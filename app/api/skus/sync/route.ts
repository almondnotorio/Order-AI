export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { fetchExternalSkus } from "@/lib/external-sku";

// POST /api/skus/sync — admin only
// Pulls the active SKU catalog from final-sku.vercel.app and upserts into local DB.
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  let skus;
  try {
    skus = await fetchExternalSkus();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch external SKUs";
    return apiError("ExternalFetchError", message, 502);
  }

  if (skus.length === 0) {
    return apiSuccess({ synced: 0, created: 0, updated: 0 });
  }

  let created = 0;
  let updated = 0;

  for (const sku of skus) {
    const result = await prisma.sKU.upsert({
      where: { sku_code: sku.sku_code },
      create: sku,
      update: {
        description: sku.description,
        width_in: sku.width_in,
        height_in: sku.height_in,
        thickness: sku.thickness,
        reflectivity: sku.reflectivity,
        sides: sku.sides,
        material: sku.material,
        active: sku.active,
      },
    });

    // Prisma upsert doesn't tell us create vs update directly;
    // check created_at == updated_at as a proxy (they match on fresh rows).
    const isNew =
      result.created_at.getTime() === result.updated_at.getTime();
    if (isNew) {
      created++;
    } else {
      updated++;
    }
  }

  return apiSuccess({ synced: skus.length, created, updated });
}
