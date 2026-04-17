"use client";

import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "REVIEW", "APPROVED", "REJECTED", "FULFILLED"];

export function AdminOrderActions({
  orderId,
  currentStatus,
  currentRemark,
}: {
  orderId: string;
  currentStatus: string;
  currentRemark?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [pending, setPending] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [remark, setRemark] = useState(currentRemark ?? "");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) return;
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPending(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [pending]);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDecision = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pending, admin_remark: remark }),
      });
      if (res.ok) {
        setStatus(pending);
        setPending(null);
        toast.success(`Order ${pending.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error("Failed to update order");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/process`, { method: "POST" });
      if (res.ok) {
        toast.success("Re-processing started. Refresh in a moment to see results.");
        router.refresh();
      } else {
        toast.error("Failed to start re-processing");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={saving}
        className="h-9 rounded border px-3 text-sm focus:outline-none disabled:opacity-60"
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

      {/* Approve / Reject quick buttons */}
      <div className="relative" ref={popoverRef}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRemark(currentRemark ?? ""); setPending("APPROVED"); }}
            disabled={saving}
            className="h-9 px-3 rounded text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" }}
          >
            Approve
          </button>
          <button
            onClick={() => { setRemark(currentRemark ?? ""); setPending("REJECTED"); }}
            disabled={saving}
            className="h-9 px-3 rounded text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}
          >
            Reject
          </button>
        </div>

        {pending && (
          <div
            className="absolute right-0 top-11 z-50 w-72 rounded-xl p-4 shadow-xl"
            style={{ backgroundColor: "#fff", border: "1px solid var(--amz-border)" }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--amz-text-muted)" }}>
              {pending === "APPROVED" ? "Approve order" : "Reject order"}
            </p>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional remark for the customer…"
              rows={3}
              className="w-full rounded border px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ borderColor: "var(--amz-border)", color: "var(--amz-text)" }}
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setPending(null)}
                className="px-3 py-1.5 text-xs rounded"
                style={{ color: "var(--amz-text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDecision}
                disabled={saving}
                className="px-4 py-1.5 rounded text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: pending === "APPROVED" ? "#16A34A" : "#DC2626" }}
              >
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>

      <Button variant="secondary" size="sm" loading={reprocessing} onClick={handleReprocess}>
        Re-process AI
      </Button>
    </div>
  );
}
