"use client";

import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const DECIDED = new Set(["APPROVED", "REJECTED", "FULFILLED"]);

export function ApproveRejectButtons({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPending(null);
        setRemark("");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pending]);

  if (DECIDED.has(currentStatus)) return null;

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pending, admin_remark: remark.trim() || undefined }),
      });
      if (res.ok) {
        toast.success(`Order ${pending === "APPROVED" ? "approved" : "rejected"}`);
        setPending(null);
        setRemark("");
        router.refresh();
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      {!pending ? (
        <div className="flex gap-1.5">
          <button
            onClick={() => setPending("APPROVED")}
            className="text-xs px-2.5 py-1 rounded font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#D4EDDA", color: "#067D62" }}
          >
            ✓ Approve
          </button>
          <button
            onClick={() => setPending("REJECTED")}
            className="text-xs px-2.5 py-1 rounded font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#FDECEC", color: "#CC0C39" }}
          >
            ✗ Reject
          </button>
        </div>
      ) : (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg shadow-xl border p-3"
          style={{ backgroundColor: "#fff", borderColor: "var(--amz-border)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--amz-text)" }}>
            {pending === "APPROVED" ? "✓ Approve" : "✗ Reject"} order
          </p>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Remark for customer (optional)…"
            rows={2}
            className="w-full text-xs rounded border px-2 py-1.5 resize-none focus:outline-none mb-2"
            style={{ borderColor: "var(--amz-border)", color: "var(--amz-text)" }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={confirm}
              disabled={saving}
              className="flex-1 text-xs py-1.5 rounded font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ backgroundColor: pending === "APPROVED" ? "#16A34A" : "#DC2626" }}
            >
              {saving ? "Saving…" : `Confirm ${pending === "APPROVED" ? "Approval" : "Rejection"}`}
            </button>
            <button
              onClick={() => { setPending(null); setRemark(""); }}
              className="text-xs px-3 py-1.5 rounded border font-medium"
              style={{ borderColor: "var(--amz-border)", color: "var(--amz-text-muted)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
