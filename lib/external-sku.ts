import { Reflectivity, Sides, Material } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const FINAL_SKU_URL =
  (process.env.FINAL_SKU_API_URL ?? "https://final-sku.vercel.app").replace(/\/$/, "");

export const EXTERNAL_SKU_KEY = "external_sku_api_key";

// Shape returned by final-sku.vercel.app /api/skus
type ExternalSKU = {
  id: string;
  sku_code: string;
  description: string;
  width_in: number;
  height_in: number;
  thickness: string;
  reflectivity: string;
  sides: string;
  material: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

// Subset of fields needed to upsert into our local DB (no id/timestamps)
export type SKUUpsertData = {
  sku_code: string;
  description: string;
  width_in: number;
  height_in: number;
  thickness: string;
  reflectivity: Reflectivity;
  sides: Sides;
  material: Material;
  active: boolean;
};

/**
 * Resolves the API key to use for final-sku.vercel.app.
 * Priority: DB setting (admin-configured) → FINAL_SKU_API_KEY env var.
 */
export async function resolveApiKey(): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: EXTERNAL_SKU_KEY },
    });
    if (setting?.value) return setting.value;
  } catch {
    // DB unavailable (e.g. during build) — fall through
  }

  const envKey = process.env.FINAL_SKU_API_KEY;
  if (envKey) return envKey;

  throw new Error(
    "No API key configured for the external SKU catalog. " +
      "Connect via Admin → SKU Catalog settings, or set FINAL_SKU_API_KEY in your environment."
  );
}

export async function fetchExternalSkus(): Promise<SKUUpsertData[]> {
  const apiKey = await resolveApiKey();
  const all: SKUUpsertData[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${FINAL_SKU_URL}/api/skus?page=${page}&limit=100&active=true`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(
        `External SKU catalog returned ${res.status}: ${await res.text().catch(() => res.statusText)}`
      );
    }

    const json = await res.json();
    const skus: ExternalSKU[] = Array.isArray(json.data) ? json.data : [];

    for (const s of skus) {
      all.push({
        sku_code: s.sku_code,
        description: s.description,
        width_in: s.width_in,
        height_in: s.height_in,
        thickness: s.thickness,
        reflectivity: s.reflectivity as Reflectivity,
        sides: s.sides as Sides,
        material: s.material as Material,
        active: s.active,
      });
    }

    const meta = json.meta as { pages?: number } | undefined;
    if (!meta?.pages || page >= meta.pages) break;
    page++;
  }

  return all;
}
