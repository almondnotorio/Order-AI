export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { createApiKeySchema } from "@/lib/validators";
import { generateApiKey } from "@/lib/api-key";

// GET /api/api-keys — admin only
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  const keys = await prisma.apiKey.findMany({
    orderBy: { created_at: "desc" },
    include: { user: { select: { id: true, email: true, name: true } } },
    where: { revoked: false },
  });

  // Never expose key_hash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeKeys = keys.map(({ key_hash, ...k }) => k);
  return apiSuccess(safeKeys);
}

// POST /api/api-keys — admin only
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

  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("ValidationError", "Invalid request body", 400, parsed.error.flatten());
  }

  const { raw, hash } = generateApiKey();

  const key = await prisma.apiKey.create({
    data: {
      key_hash: hash,
      label: parsed.data.label,
      user_id: ctx!.userId,
    },
    include: { user: { select: { id: true, email: true } } },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { key_hash, ...safeKey } = key;

  // Return raw key ONCE — never stored in DB
  return apiSuccess({ ...safeKey, raw_key: raw }, 201);
}
