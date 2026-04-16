import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [total, pending, review, approved, failed] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "REVIEW" } }),
    prisma.order.count({ where: { status: "APPROVED" } }),
    prisma.order.count({ where: { ai_status: "FAILED" } }),
  ]);

  const stats = [
    { label: "Total Orders",  value: total,    color: "var(--amz-text)",    href: "/admin/orders" },
    { label: "Pending",       value: pending,  color: "var(--amz-teal)",    href: "/admin/orders?status=PENDING" },
    { label: "Needs Review",  value: review,   color: "#985B01",             href: "/admin/orders?status=REVIEW" },
    { label: "Approved",      value: approved, color: "var(--amz-green)",   href: "/admin/orders?status=APPROVED" },
    { label: "AI Failed",     value: failed,   color: "var(--amz-red)",     href: "/admin/orders?status=REVIEW" },
  ];

  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { created_at: "desc" },
    include: {
      matched_sku: { select: { sku_code: true } },
      user: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--amz-text)" }}>
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>
          Order processing overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
              <CardContent className="py-5">
                <div className="text-3xl font-bold" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--amz-text-muted)" }}>
                  {s.label}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--amz-border)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--amz-text)" }}>
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium"
            style={{ color: "var(--amz-link)", textDecoration: "none" }}
          >
            View all ›
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: "#F0F2F2" }}>
                {["Customer", "Input", "SKU", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-[#F7FAFA]"
                  style={{
                    borderBottom: i < recentOrders.length - 1 ? "1px solid var(--amz-border)" : "none",
                  }}
                >
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--amz-text-muted)" }}>
                    {order.user.email}
                  </td>
                  <td
                    className="px-5 py-3 text-sm max-w-xs truncate"
                    style={{ color: "var(--amz-text)" }}
                  >
                    {order.raw_input.slice(0, 50)}
                  </td>
                  <td className="px-5 py-3">
                    {order.matched_sku ? (
                      <span
                        className="font-mono text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "#F0F2F2", color: "var(--amz-text)" }}
                      >
                        {order.matched_sku.sku_code}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs font-medium hover:underline"
                      style={{ color: "var(--amz-link)" }}
                    >
                      {order.status}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
