import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OrderStatusBadge, AIStatusBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { ParsedAttributesCard } from "@/components/orders/ParsedAttributesCard";
import { FlagsCard } from "@/components/orders/FlagsCard";
import { SKUMatchCard } from "@/components/orders/SKUMatchCard";
import { formatDateTime } from "@/lib/utils";
import { AdminOrderActions } from "@/components/orders/AdminOrderActions";

type Params = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Params) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      matched_sku: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/orders"
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--amz-link)" }}
        >
          ‹ All Orders
        </Link>
      </div>

      {/* Title row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: "var(--amz-text)" }}>
            Order Detail
          </h1>
          <OrderStatusBadge status={order.status} />
          <AIStatusBadge status={order.ai_status} />
          <ConfidenceBadge score={order.confidence_score} />
        </div>
        <AdminOrderActions orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Customer + Timestamps */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium" style={{ color: "var(--amz-text)" }}>
              {order.user.name ?? "—"}
            </p>
            <p className="text-sm" style={{ color: "var(--amz-text-muted)" }}>
              {order.user.email}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Timestamps</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--amz-text-muted)" }}>Submitted</span>
                <span style={{ color: "var(--amz-text)" }}>{formatDateTime(order.created_at)}</span>
              </div>
              {order.processed_at && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--amz-text-muted)" }}>Processed</span>
                  <span style={{ color: "var(--amz-text)" }}>{formatDateTime(order.processed_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: "var(--amz-text-muted)" }}>Delivery</span>
                <span
                  style={{
                    color: order.delivery_type === "RUSH" ? "var(--amz-orange)" : "var(--amz-text)",
                    fontWeight: order.delivery_type === "RUSH" ? 600 : undefined,
                  }}
                >
                  {order.delivery_type}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Original Request</CardTitle>
            <span className="text-xs font-mono" style={{ color: "var(--amz-text-muted)" }}>
              {order.id}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed" style={{ color: "var(--amz-text)" }}>
            {order.raw_input}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ParsedAttributesCard order={order} />
        <SKUMatchCard matchedSku={order.matched_sku} confidenceScore={order.confidence_score} />
      </div>

      <FlagsCard flags={(order.flags as string[]) ?? []} notes={order.ai_notes} />
    </div>
  );
}
