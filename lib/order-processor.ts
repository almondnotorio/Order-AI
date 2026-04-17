import { prisma } from "@/lib/prisma";
import { processOrderWithAI, AIOrderResult } from "@/lib/claude";
import { AIStatus, DeliveryType, OrderStatus, SKU } from "@/app/generated/prisma/client";

function matchSKU(skuCatalog: SKU[], parsed: AIOrderResult["parsed"]): SKU | null {
  if (!parsed.width_in || !parsed.height_in || !parsed.reflectivity) return null;
  return (
    skuCatalog.find(
      (s) =>
        s.width_in === parsed.width_in &&
        s.height_in === parsed.height_in &&
        s.thickness === parsed.thickness &&
        s.reflectivity === parsed.reflectivity &&
        s.sides === parsed.sides &&
        s.material === (parsed.material ?? "ALUMINUM")
    ) ?? null
  );
}

export async function processOrder(orderId: string): Promise<void> {
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

    const result = await processOrderWithAI(order.raw_input);

    // Programmatic SKU matching — prevents AI from biasing attribute extraction toward catalog entries
    const matchedSKU = matchSKU(skuCatalog, result.parsed);
    const matchedSkuId = matchedSKU?.id ?? null;
    const matched_sku_code = matchedSKU?.sku_code ?? null;

    if (!matchedSKU) {
      result.flags.push("No matching SKU found — manual review required");
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
        ai_raw_response: { ...result, matched_sku_code } as object,
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
