import { prisma } from "@/lib/prisma";
import { SKUManager } from "@/components/skus/SKUManager";
import { ConnectSkuCatalog } from "@/components/skus/ConnectSkuCatalog";

export default async function AdminSKUsPage() {
  const skus = await prisma.sKU.findMany({
    orderBy: [{ material: "asc" }, { width_in: "asc" }, { height_in: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--amz-text)" }}>
          SKU Catalog
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>
          Manage available signage product SKUs used for AI matching
        </p>
      </div>
      <ConnectSkuCatalog />
      <SKUManager initialSkus={skus} />
    </div>
  );
}
