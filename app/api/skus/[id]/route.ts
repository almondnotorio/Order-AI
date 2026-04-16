export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { createSkuSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

// GET /api/skus/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sku = await prisma.sKU.findUnique({ where: { id } });
  if (!sku) return apiError("NotFound", "SKU not found", 404);
  return apiSuccess(sku);
}

// PUT /api/skus/[id] — admin only
export async function PUT(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BadRequest", "Invalid JSON body", 400);
  }

  const parsed = createSkuSchema.partial().safeParse(body);
  if (!parsed.success) {
    return apiError("ValidationError", "Invalid request body", 400, parsed.error.flatten());
  }

  const sku = await prisma.sKU.findUnique({ where: { id } });
  if (!sku) return apiError("NotFound", "SKU not found", 404);

  const updated = await prisma.sKU.update({ where: { id }, data: parsed.data });
  return apiSuccess(updated);
}

// DELETE /api/skus/[id] — admin only, soft delete
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  const { id } = await params;

  const sku = await prisma.sKU.findUnique({ where: { id } });
  if (!sku) return apiError("NotFound", "SKU not found", 404);

  // Soft delete to preserve FK integrity
  const updated = await prisma.sKU.update({
    where: { id },
    data: { active: false },
  });

  return apiSuccess({ deactivated: true, id: updated.id });
}
