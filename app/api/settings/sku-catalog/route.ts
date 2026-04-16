export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { FINAL_SKU_URL, EXTERNAL_SKU_KEY } from "@/lib/external-sku";

// GET /api/settings/sku-catalog — returns connection status (never exposes the key)
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  const setting = await prisma.systemSetting.findUnique({
    where: { key: EXTERNAL_SKU_KEY },
  });

  return apiSuccess({
    configured: !!setting,
    source: setting ? "database" : process.env.FINAL_SKU_API_KEY ? "env" : "none",
    updated_at: setting?.updated_at ?? null,
  });
}

// POST /api/settings/sku-catalog — validate an API key from final-sku.vercel.app and store it
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BadRequest", "Invalid JSON body", 400);
  }

  const apiKey = (body as { api_key?: unknown }).api_key;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return apiError("ValidationError", "api_key is required", 400);
  }

  // Validate the key against the live external catalog before storing
  let testRes: Response;
  try {
    testRes = await fetch(`${FINAL_SKU_URL}/api/skus?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
      cache: "no-store",
    });
  } catch {
    return apiError("NetworkError", "Could not reach the external SKU catalog", 502);
  }

  if (!testRes.ok) {
    return apiError(
      "InvalidKey",
      `The API key was rejected by the external catalog (${testRes.status})`,
      422
    );
  }

  const setting = await prisma.systemSetting.upsert({
    where: { key: EXTERNAL_SKU_KEY },
    create: { key: EXTERNAL_SKU_KEY, value: apiKey.trim() },
    update: { value: apiKey.trim() },
  });

  return apiSuccess({
    configured: true,
    source: "database",
    updated_at: setting.updated_at,
  });
}

// DELETE /api/settings/sku-catalog — remove stored key (falls back to FINAL_SKU_API_KEY env var)
export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  await prisma.systemSetting.delete({ where: { key: EXTERNAL_SKU_KEY } }).catch(() => {});

  return apiSuccess({
    configured: !!process.env.FINAL_SKU_API_KEY,
    source: process.env.FINAL_SKU_API_KEY ? "env" : "none",
    updated_at: null,
  });
}
