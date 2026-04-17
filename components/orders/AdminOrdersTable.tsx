"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { OrderStatusBadge, AIStatusBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ParsedAttributesCard } from "@/components/orders/ParsedAttributesCard";
import { FlagsCard } from "@/components/orders/FlagsCard";
import { SKUMatchCard } from "@/components/orders/SKUMatchCard";
import { formatDateTime, truncate } from "@/lib/utils";

type SKU = {
  id: string;
  sku_code: string;
  description: string;
  width_in: number;
  height_in: number;
  thickness: string;
  reflectivity: string;
  sides: string;
  material: string;
};

type Order = {
  id: string;
  raw_input: string;
  status: string;
  ai_status: string;
  confidence_score: number | null;
  flags: string[] | null;
  ai_notes: string | null;
  delivery_type: string;
  created_at: string;
  processed_at: string | null;
  parsed_width: number | null;
  parsed_height: number | null;
  parsed_thickness: string | null;
  parsed_reflectivity: string | null;
  parsed_sides: string | null;
  parsed_material: string | null;
  parsed_delivery: string | null;
  parsed_quantity: number | null;
  matched_sku: SKU | null;
  user: { id: string; email: string; name: string | null };
};

const ORDER_STATUSES = ["PENDING", "PROCESSING", "REVIEW", "APPROVED", "REJECTED", "FULFILLED"];

function StatusSelect({ orderId, current }: { orderId: string; current: string }) {
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setValue(newStatus);
        toast.success("Status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      className="text-xs rounded border px-2 py-1 disabled:opacity-60 focus:outline-none"
      style={{
        borderColor: "var(--amz-border)",
        backgroundColor: "#fff",
        color: "var(--amz-text)",
      }}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

function ReprocessButton({ orderId, onReprocess }: { orderId: string; onReprocess: (id: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleReprocess = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/process`, { method: "POST" });
      if (res.ok) {
        toast.success("Re-processing started");
        onReprocess(orderId);
      } else {
        toast.error("Failed to start re-processing");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" loading={loading} onClick={handleReprocess}>
      Re-process
    </Button>
  );
}

export function AdminOrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const handleReprocess = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, ai_status: "PROCESSING", status: "PROCESSING" } : o
      )
    );
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchesSearch =
      !search ||
      o.raw_input.toLowerCase().includes(search.toLowerCase()) ||
      o.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (o.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.matched_sku?.sku_code ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search orders, emails, SKUs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded border px-3 text-sm w-64 focus:outline-none"
          style={{
            borderColor: "var(--amz-border)",
            backgroundColor: "#fff",
            color: "var(--amz-text)",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded border px-3 text-sm focus:outline-none"
          style={{
            borderColor: "var(--amz-border)",
            backgroundColor: "#fff",
            color: "var(--amz-text)",
          }}
        >
          <option value="ALL">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-sm" style={{ color: "var(--amz-text-muted)" }}>
          {filtered.length} orders
        </span>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded bg-white"
        style={{ border: "1px solid var(--amz-border)", boxShadow: "0 2px 5px rgba(15,17,17,0.08)" }}
      >
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: "#F0F2F2" }}>
              {["", "Customer", "Input", "SKU", "Conf.", "Status", "Date", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "var(--amz-text-muted)" }}>
                  No orders found
                </td>
              </tr>
            )}
            {filtered.map((order, i) => (
              <>
                <tr
                  key={order.id}
                  className="transition-colors cursor-pointer"
                  style={{
                    borderBottom: "1px solid var(--amz-border)",
                    backgroundColor: expanded === order.id ? "#F7FAFA" : undefined,
                  }}
                  onMouseEnter={(e) => { if (expanded !== order.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#F7FAFA"; }}
                  onMouseLeave={(e) => { if (expanded !== order.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <td className="px-4 py-3 w-8">
                    <svg
                      className="h-4 w-4 transition-transform"
                      style={{
                        color: "var(--amz-text-muted)",
                        transform: expanded === order.id ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                  <td className="px-4 py-3">
                    {order.user.name && (
                      <div className="text-sm font-medium" style={{ color: "var(--amz-text)" }}>
                        {order.user.name}
                      </div>
                    )}
                    <div className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
                      {order.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm" style={{ color: "var(--amz-text)" }}>
                      {truncate(order.raw_input, 55)}
                    </p>
                    {order.delivery_type === "RUSH" && (
                      <span className="text-xs font-medium" style={{ color: "var(--amz-orange)" }}>Rush</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {order.matched_sku ? (
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#F0F2F2", color: "var(--amz-text)" }}
                      >
                        {order.matched_sku.sku_code}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>No match</span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ConfidenceBadge score={order.confidence_score} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      <StatusSelect orderId={order.id} current={order.status} />
                      <AIStatusBadge status={order.ai_status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
                      {formatDateTime(order.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <ReprocessButton orderId={order.id} onReprocess={handleReprocess} />
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium hover:underline"
                        style={{ color: "var(--amz-link)" }}
                      >
                        Detail
                      </Link>
                    </div>
                  </td>
                </tr>

                {expanded === order.id && (
                  <tr key={`${order.id}-expanded`}>
                    <td
                      colSpan={8}
                      className="px-4 py-4"
                      style={{ backgroundColor: "#F7FAFA", borderBottom: "1px solid var(--amz-border)" }}
                    >
                      <div className="space-y-4">
                        <div>
                          <h4
                            className="text-xs font-semibold uppercase tracking-wide mb-1"
                            style={{ color: "var(--amz-text-muted)" }}
                          >
                            Full Input
                          </h4>
                          <p
                            className="text-sm rounded px-3 py-2"
                            style={{
                              color: "var(--amz-text)",
                              backgroundColor: "#fff",
                              border: "1px solid var(--amz-border)",
                            }}
                          >
                            {order.raw_input}
                          </p>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                          <ParsedAttributesCard order={order} />
                          <SKUMatchCard matchedSku={order.matched_sku} confidenceScore={order.confidence_score} />
                        </div>
                        <FlagsCard flags={order.flags ?? []} notes={order.ai_notes} />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
