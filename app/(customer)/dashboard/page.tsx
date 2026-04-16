import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { formatDate, truncate } from "@/lib/utils";

export default async function CustomerDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [totalOrders, recentOrders, reviewCount] = await Promise.all([
    prisma.order.count({ where: { user_id: userId } }),
    prisma.order.findMany({
      where: { user_id: userId },
      take: 5,
      orderBy: { created_at: "desc" },
      include: { matched_sku: { select: { sku_code: true } } },
    }),
    prisma.order.count({
      where: { user_id: userId, status: "REVIEW" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--amz-text)" }}>
          Your Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>
          Submit and track your signage orders
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total orders */}
        <Card>
          <CardContent className="py-5">
            <div className="text-3xl font-bold" style={{ color: "var(--amz-orange)" }}>
              {totalOrders}
            </div>
            <div className="mt-1 text-sm font-medium" style={{ color: "var(--amz-text-muted)" }}>
              Total Orders
            </div>
          </CardContent>
        </Card>

        {/* Needs review */}
        <Card>
          <CardContent className="py-5">
            <div className="text-3xl font-bold" style={{ color: reviewCount > 0 ? "#985B01" : "var(--amz-green)" }}>
              {reviewCount}
            </div>
            <div className="mt-1 text-sm font-medium" style={{ color: "var(--amz-text-muted)" }}>
              Needs Review
            </div>
          </CardContent>
        </Card>

        {/* CTA card */}
        <Card>
          <CardContent className="py-5">
            <Link
              href="/orders/new"
              className="block"
              style={{ textDecoration: "none" }}
            >
              <div
                className="w-full rounded py-2 px-4 text-center text-sm font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--amz-yellow)",
                  color: "var(--amz-text)",
                  border: "1px solid #FCD200",
                }}
              >
                + Place New Order
              </div>
              <p className="mt-2 text-xs text-center" style={{ color: "var(--amz-text-muted)" }}>
                Describe your signage in plain language
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <Card>
          {/* Card header — Amazon-style section header */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: "var(--amz-border)" }}
          >
            <h2 className="text-base font-bold" style={{ color: "var(--amz-text)" }}>
              Recent Orders
            </h2>
            <Link
              href="/orders"
              className="text-sm font-medium"
              style={{ color: "var(--amz-link)", textDecoration: "none" }}
            >
              View all orders ›
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--amz-border)" }}>
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#F7FAFA]"
                style={{ textDecoration: "none" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--amz-text)" }}>
                    {truncate(order.raw_input, 80)}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--amz-text-muted)" }}>
                    {formatDate(order.created_at)}
                    {order.matched_sku && (
                      <span
                        className="ml-2 font-mono px-1 rounded"
                        style={{ backgroundColor: "#F0F2F2", color: "var(--amz-text)" }}
                      >
                        {order.matched_sku.sku_code}
                      </span>
                    )}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {recentOrders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div
              className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "#F0F2F2" }}
            >
              <svg className="h-6 w-6" style={{ color: "#878787" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--amz-text)" }}>No orders yet</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>Place your first order to get started.</p>
            <Link
              href="/orders/new"
              className="mt-4 inline-block px-6 py-2 rounded text-sm font-bold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--amz-yellow)",
                color: "var(--amz-text)",
                border: "1px solid #FCD200",
                textDecoration: "none",
              }}
            >
              Place an Order
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
