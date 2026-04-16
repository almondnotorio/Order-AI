import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import { OrderStatusBadge, AIStatusBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { formatDateTime, truncate } from "@/lib/utils";

export default async function CustomerOrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const orders = await prisma.order.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: { matched_sku: { select: { sku_code: true, description: true } } },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--amz-text)" }}>
            My Orders
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--amz-text-muted)" }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--amz-yellow)",
            color: "var(--amz-text)",
            border: "1px solid #FCD200",
            textDecoration: "none",
          }}
        >
          + New Order
        </Link>
      </div>

      {orders.length === 0 ? (
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
            <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>Submit your first order to get started.</p>
            <Link
              href="/orders/new"
              className="mt-4 inline-block text-sm font-medium"
              style={{ color: "var(--amz-link)" }}
            >
              Submit an order ›
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-hidden rounded">
            <table className="min-w-full">
              <thead>
                <tr style={{ backgroundColor: "#F0F2F2" }}>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    Order
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide hidden sm:table-cell"
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    SKU
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell"
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    Confidence
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    Status
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide hidden lg:table-cell"
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-[#F7FAFA]"
                    style={{
                      borderBottom: i < orders.length - 1 ? "1px solid var(--amz-border)" : "none",
                    }}
                  >
                    <td className="px-5 py-3">
                      <Link href={`/orders/${order.id}`} style={{ textDecoration: "none" }}>
                        <p
                          className="text-sm font-medium hover:underline"
                          style={{ color: "var(--amz-link)" }}
                        >
                          {truncate(order.raw_input, 60)}
                        </p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--amz-text-muted)" }}>
                          {order.id.slice(0, 8)}…
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {order.matched_sku ? (
                        <span
                          className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: "#F0F2F2", color: "var(--amz-text)" }}
                        >
                          {order.matched_sku.sku_code}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <ConfidenceBadge score={order.confidence_score} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <OrderStatusBadge status={order.status} />
                        {order.ai_status !== "COMPLETE" && (
                          <AIStatusBadge status={order.ai_status} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
                        {formatDateTime(order.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
