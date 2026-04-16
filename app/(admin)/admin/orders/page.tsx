import { prisma } from "@/lib/prisma";
import { AdminOrdersTable } from "@/components/orders/AdminOrdersTable";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
    include: {
      matched_sku: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const serialized = orders.map((o) => ({
    ...o,
    created_at: o.created_at.toISOString(),
    updated_at: o.updated_at.toISOString(),
    processed_at: o.processed_at?.toISOString() ?? null,
    flags: (o.flags as string[]) ?? [],
    matched_sku: o.matched_sku
      ? {
          ...o.matched_sku,
          created_at: o.matched_sku.created_at.toISOString(),
          updated_at: o.matched_sku.updated_at.toISOString(),
        }
      : null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--amz-text)" }}>
          Orders
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>
          All customer orders with AI processing results
        </p>
      </div>
      <AdminOrdersTable initialOrders={serialized} />
    </div>
  );
}
