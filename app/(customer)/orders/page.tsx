import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderStatusBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { formatDateTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerOrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const viewer = await currentUser();
  const isAdmin = viewer?.publicMetadata?.role === "admin";

  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { user_id: userId },
    orderBy: { created_at: "desc" },
    include: {
      matched_sku: { select: { sku_code: true, description: true } },
      user: { select: { name: true, email: true } },
    },
  });

  const headers = [
    "Order",
    ...(isAdmin ? ["Customer"] : []),
    "SKU",
    "Attributes",
    "Confidence",
    "Status",
    "Remark",
    "Date",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--amz-text)" }}>
            {isAdmin ? "All Orders" : "My Orders"}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--amz-text-muted)" }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        {!isAdmin && (
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
            + Place Order
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div
          className="rounded-xl py-16 text-center"
          style={{ backgroundColor: "#fff", border: "1px solid var(--amz-border)" }}
        >
          <div
            className="mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "#F0F2F2" }}
          >
            <svg className="h-7 w-7" style={{ color: "#878787" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--amz-text)" }}>
            No orders yet
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>
            {isAdmin ? "No orders have been placed yet." : "Place your first order to get started."}
          </p>
          {!isAdmin && (
            <Link
              href="/orders/new"
              className="mt-5 inline-block px-6 py-2 rounded text-sm font-bold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--amz-yellow)",
                color: "var(--amz-text)",
                border: "1px solid #FCD200",
                textDecoration: "none",
              }}
            >
              Place an Order
            </Link>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid var(--amz-border)" }}
        >
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: "#F7F5F2" }}>
                {headers.map((h) => (
                  <th
                    key={h}
                    className={[
                      "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide",
                      h === "Attributes" ? "hidden lg:table-cell" : "",
                      h === "Confidence" ? "hidden md:table-cell" : "",
                      h === "Date" ? "hidden lg:table-cell" : "",
                    ].join(" ")}
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const attrs = [
                  order.parsed_width && order.parsed_height
                    ? `${order.parsed_width}×${order.parsed_height}"`
                    : null,
                  order.parsed_reflectivity,
                  order.parsed_thickness,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-[#F7FAFA]"
                    style={{
                      borderBottom: i < orders.length - 1 ? "1px solid var(--amz-border)" : "none",
                    }}
                  >
                    {/* Order description */}
                    <td className="px-5 py-3.5">
                      <Link href={`/orders/${order.id}`} style={{ textDecoration: "none" }}>
                        <p
                          className="text-sm font-medium hover:underline"
                          style={{ color: "var(--amz-link)" }}
                        >
                          {truncate(order.raw_input, 55)}
                        </p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--amz-text-muted)" }}>
                          #{order.id.slice(0, 8)}
                        </p>
                      </Link>
                    </td>

                    {/* Customer (admin only) */}
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        {order.user.name && (
                          <p className="text-sm font-medium" style={{ color: "var(--amz-text)" }}>
                            {order.user.name}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
                          {order.user.email}
                        </p>
                      </td>
                    )}

                    {/* Matched SKU */}
                    <td className="px-5 py-3.5">
                      {order.matched_sku ? (
                        <div>
                          <span
                            className="font-mono text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: "#F0F2F2", color: "var(--amz-text)" }}
                          >
                            {order.matched_sku.sku_code}
                          </span>
                          {order.matched_sku.description && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--amz-text-muted)" }}>
                              {truncate(order.matched_sku.description, 30)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>—</span>
                      )}
                    </td>

                    {/* Parsed attributes */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs" style={{ color: "var(--amz-text)" }}>
                        {attrs || "—"}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <ConfidenceBadge score={order.confidence_score} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Admin remark */}
                    <td className="px-5 py-3.5 hidden lg:table-cell max-w-[200px]">
                      {order.admin_remark ? (
                        <span
                          className="text-xs"
                          style={{
                            color: order.status === "APPROVED" ? "#166534" : order.status === "REJECTED" ? "#991B1B" : "var(--amz-text-muted)",
                          }}
                        >
                          {order.admin_remark.length > 60
                            ? order.admin_remark.slice(0, 60) + "…"
                            : order.admin_remark}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
                        {formatDateTime(order.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
