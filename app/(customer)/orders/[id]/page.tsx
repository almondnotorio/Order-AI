import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OrderStatusBadge, AIStatusBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { ParsedAttributesCard } from "@/components/orders/ParsedAttributesCard";
import { FlagsCard } from "@/components/orders/FlagsCard";
import { SKUMatchCard } from "@/components/orders/SKUMatchCard";
import { formatDateTime } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export default async function CustomerOrderDetailPage({ params }: Params) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const viewer = await currentUser();
  const isAdmin = viewer?.publicMetadata?.role === "admin";

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { matched_sku: true },
  });

  if (!order || (!isAdmin && order.user_id !== userId)) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/orders"
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--amz-link)" }}
        >
          ‹ My Orders
        </Link>
      </div>

      {/* Title + badges */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: "var(--amz-text)" }}>
          Order Details
        </h1>
        <OrderStatusBadge status={order.status} />
        <AIStatusBadge status={order.ai_status} />
        {order.delivery_type === "RUSH" && (
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: "#FFF0D0", color: "var(--amz-orange)" }}
          >
            Rush Delivery
          </span>
        )}
      </div>

      {/* Original request */}
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
          <div
            className="mt-3 flex flex-wrap items-center gap-4 text-xs"
            style={{ color: "var(--amz-text-muted)" }}
          >
            <span>Submitted {formatDateTime(order.created_at)}</span>
            {order.processed_at && (
              <span>Processed {formatDateTime(order.processed_at)}</span>
            )}
            <div className="flex items-center gap-2">
              <span>Confidence</span>
              <ConfidenceBadge score={order.confidence_score} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin decision remark */}
      {(order.status === "APPROVED" || order.status === "REJECTED") && order.admin_remark && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3"
              style={{
                backgroundColor: order.status === "APPROVED" ? "#DCFCE7" : "#FEE2E2",
                border: `1px solid ${order.status === "APPROVED" ? "#86EFAC" : "#FCA5A5"}`,
              }}
            >
              <span
                className="mt-0.5 text-xs font-bold uppercase tracking-wider"
                style={{ color: order.status === "APPROVED" ? "#166534" : "#991B1B" }}
              >
                {order.status === "APPROVED" ? "Approved" : "Rejected"}
              </span>
              <p className="text-sm" style={{ color: order.status === "APPROVED" ? "#166534" : "#991B1B" }}>
                {order.admin_remark}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {order.ai_status === "COMPLETE" || order.ai_status === "FAILED" ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ParsedAttributesCard order={order} />
            <SKUMatchCard matchedSku={order.matched_sku} confidenceScore={order.confidence_score} />
          </div>
          <FlagsCard flags={(order.flags as string[]) ?? []} notes={order.ai_notes} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm">
            <span style={{ color: "var(--amz-text-muted)" }}>
              {order.ai_status === "PROCESSING"
                ? "AI is processing your order…"
                : "Order is queued for processing."}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
