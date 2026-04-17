import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Pending",    color: "#92400E", bg: "#FEF3C7" },
  REVIEW:    { label: "Needs Review", color: "#9A3412", bg: "#FFEDD5" },
  APPROVED:  { label: "Approved",   color: "#166534", bg: "#DCFCE7" },
  CANCELLED: { label: "Cancelled",  color: "#991B1B", bg: "#FEE2E2" },
  FAILED:    { label: "Failed",     color: "#991B1B", bg: "#FEE2E2" },
};

export default async function AdminDashboardPage() {
  const [total, pending, review, approved, failed] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "REVIEW" } }),
    prisma.order.count({ where: { status: "APPROVED" } }),
    prisma.order.count({ where: { ai_status: "FAILED" } }),
  ]);

  const stats = [
    {
      label: "Total Orders",
      value: total,
      iconBg: "#FFE8E8",
      iconColor: "#E06060",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: "Pending",
      value: pending,
      iconBg: "#E8F0FF",
      iconColor: "#4472C4",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Needs Review",
      value: review,
      iconBg: "#FFF5E0",
      iconColor: "#D97706",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: "Approved",
      value: approved,
      iconBg: "#E8F8EE",
      iconColor: "#16A34A",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "AI Failed",
      value: failed,
      iconBg: "#FFE8EC",
      iconColor: "#DC2626",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { created_at: "desc" },
    include: {
      matched_sku: { select: { sku_code: true } },
      user: { select: { email: true, name: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your order catalog"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-xl p-5"
            style={{ backgroundColor: "var(--brand-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
          >
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--brand-muted)" }}
              >
                {s.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: "var(--brand-text)" }}>
                {s.value}
              </p>
            </div>
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.iconBg, color: s.iconColor }}
            >
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recently Added Orders */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--brand-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--brand-border)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--brand-text)" }}>
            Recently Added Orders
          </h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: "var(--brand-muted)", textDecoration: "none" }}
          >
            View all
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div>
          {recentOrders.length === 0 ? (
            <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--brand-muted)" }}>
              No orders yet.
            </p>
          ) : (
            recentOrders.map((order, i) => {
              const statusStyle = STATUS_STYLE[order.status] ?? { label: order.status, color: "#888", bg: "#F3F4F6" };
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-black/[0.02]"
                  style={{
                    borderBottom: i < recentOrders.length - 1 ? "1px solid var(--brand-border)" : "none",
                    textDecoration: "none",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#F5F0E8", color: "#B0A898" }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--brand-text)" }}>
                      {order.raw_input.slice(0, 70)}
                    </p>
                    <p className="mt-0.5 text-xs truncate" style={{ color: "var(--brand-muted)" }}>
                      {order.id.slice(0, 8)}…
                      {" · "}
                      {order.user.name ?? order.user.email}
                    </p>
                  </div>

                  {/* Right: SKU + status */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {order.matched_sku && (
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#F0EDE6", color: "var(--brand-muted)" }}
                      >
                        {order.matched_sku.sku_code}
                      </span>
                    )}
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
