import { prisma } from "@/lib/prisma";
import { processOrderWithAI } from "@/lib/claude";
import { AIStatus, DeliveryType, OrderStatus } from "@/app/generated/prisma/client";

export async function processOrder(orderId: string): Promise<void> {
  // Mark as processing
  await prisma.order.update({
    where: { id: orderId },
    data: { ai_status: AIStatus.PROCESSING, status: OrderStatus.PROCESSING },
  });

  try {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });

    const skuCatalog = await prisma.sKU.findMany({
      where: { active: true },
    });

    const result = await processOrderWithAI(order.raw_input, skuCatalog);

    // Find matched SKU id
    let matchedSkuId: string | null = null;
    if (result.matched_sku_code) {
      const sku = await prisma.sKU.findUnique({
        where: { sku_code: result.matched_sku_code },
      });
      matchedSkuId = sku?.id ?? null;
    }

    const hasFlags = result.flags.length > 0;
    const newStatus =
      result.confidence_score < 0.5 || !matchedSkuId
        ? OrderStatus.REVIEW
        : hasFlags
        ? OrderStatus.REVIEW
        : OrderStatus.APPROVED;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        ai_status: AIStatus.COMPLETE,
        status: newStatus,
        parsed_width: result.parsed.width_in,
        parsed_height: result.parsed.height_in,
        parsed_thickness: result.parsed.thickness,
        parsed_reflectivity: result.parsed.reflectivity,
        parsed_sides: result.parsed.sides,
        parsed_material: result.parsed.material,
        parsed_delivery: result.parsed.delivery as DeliveryType,
        parsed_quantity: result.parsed.quantity,
        confidence_score: result.confidence_score,
        matched_sku_id: matchedSkuId,
        ai_notes: result.notes,
        flags: result.flags,
        ai_raw_response: result as object,
        delivery_type: result.parsed.delivery as DeliveryType,
        processed_at: new Date(),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during processing";

    await prisma.order.update({
      where: { id: orderId },
      data: {
        ai_status: AIStatus.FAILED,
        status: OrderStatus.REVIEW,
        flags: ["AI processing failed — manual review required: " + message],
        processed_at: new Date(),
      },
    });
  }
}
