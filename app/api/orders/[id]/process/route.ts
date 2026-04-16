import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { processOrder } from "@/lib/order-processor";
import { AIStatus, OrderStatus } from "@/app/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

// POST /api/orders/[id]/process — re-run AI processing
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return apiError("NotFound", "Order not found", 404);
  }

  // Reset AI state before reprocessing
  await prisma.order.update({
    where: { id },
    data: {
      ai_status: AIStatus.PENDING,
      status: OrderStatus.PENDING,
      matched_sku_id: null,
      confidence_score: null,
      flags: [],
      ai_notes: null,
      processed_at: null,
    },
  });

  // Trigger processing in the background
  processOrder(id).catch((err) => {
    console.error(`Re-process failed for order ${id}:`, err);
  });

  return apiSuccess({ id, message: "Processing started" });
}
