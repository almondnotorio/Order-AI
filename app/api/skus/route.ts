export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { createSkuSchema, skuQuerySchema } from "@/lib/validators";

// GET /api/skus — public, no auth required
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const queryParsed = skuQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryParsed.success) {
    return apiError("ValidationError", "Invalid query parameters", 400, queryParsed.error.flatten());
  }

  const { material, reflectivity, sides, active, page, limit } = queryParsed.data;
  const skip = (page - 1) * limit;

  const where = {
    ...(material ? { material } : {}),
    ...(reflectivity ? { reflectivity } : {}),
    ...(sides ? { sides } : {}),
    ...(active !== undefined ? { active } : { active: true }),
  };

  const [skus, total] = await Promise.all([
    prisma.sKU.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ material: "asc" }, { width_in: "asc" }, { height_in: "asc" }],
    }),
    prisma.sKU.count({ where }),
  ]);

  return apiSuccess(skus, 200, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/skus — admin only
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

  const parsed = createSkuSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("ValidationError", "Invalid request body", 400, parsed.error.flatten());
  }

  // Check for duplicate SKU code
  const existing = await prisma.sKU.findUnique({
    where: { sku_code: parsed.data.sku_code },
  });
  if (existing) {
    return apiError("Conflict", `SKU code "${parsed.data.sku_code}" already exists`, 409);
  }

  const sku = await prisma.sKU.create({ data: parsed.data });
  return apiSuccess(sku, 201);
}
