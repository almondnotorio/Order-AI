import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAuth, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { updateOrderSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req);
  const authError = requireAuth(ctx);
  if (authError) return authError;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      matched_sku: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!order) {
    return apiError("NotFound", "Order not found", 404);
  }

  // Customers can only view their own orders
  if (ctx!.role !== "ADMIN" && order.user_id !== ctx!.userId) {
    return apiError("Forbidden", "Access denied", 403);
  }

  return apiSuccess(order);
}

// PUT /api/orders/[id] — admin update
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

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("ValidationError", "Invalid request body", 400, parsed.error.flatten());
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return apiError("NotFound", "Order not found", 404);
  }

  // Validate matched_sku_id if provided
  if (parsed.data.matched_sku_id) {
    const sku = await prisma.sKU.findUnique({
      where: { id: parsed.data.matched_sku_id },
    });
    if (!sku) {
      return apiError("NotFound", "SKU not found", 404);
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.matched_sku_id !== undefined
        ? { matched_sku_id: parsed.data.matched_sku_id }
        : {}),
      ...(parsed.data.delivery_type ? { delivery_type: parsed.data.delivery_type } : {}),
      ...(parsed.data.admin_remark !== undefined
        ? { admin_remark: parsed.data.admin_remark || null }
        : {}),
    },
    include: {
      matched_sku: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return apiSuccess(updated);
}

// DELETE /api/orders/[id] — admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return apiError("NotFound", "Order not found", 404);
  }

  await prisma.order.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
