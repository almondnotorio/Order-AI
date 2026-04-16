"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "REVIEW", "APPROVED", "REJECTED", "FULFILLED"];

export function AdminOrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

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
    <div className="flex items-center gap-3">
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
      <Button variant="secondary" size="sm" loading={reprocessing} onClick={handleReprocess}>
        Re-process AI
      </Button>
    </div>
  );
}
