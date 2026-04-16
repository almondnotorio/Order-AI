"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ParsedAttributesCard } from "@/components/orders/ParsedAttributesCard";
import { FlagsCard } from "@/components/orders/FlagsCard";
import { SKUMatchCard } from "@/components/orders/SKUMatchCard";
import { OrderStatusBadge, AIStatusBadge } from "@/components/ui/Badge";

type OrderResult = {
  id: string;
  status: string;
  ai_status: string;
  raw_input: string;
  confidence_score: number | null;
  parsed_width: number | null;
  parsed_height: number | null;
  parsed_thickness: string | null;
  parsed_reflectivity: string | null;
  parsed_sides: string | null;
  parsed_material: string | null;
  parsed_delivery: string | null;
  parsed_quantity: number | null;
  flags: string[] | null;
  ai_notes: string | null;
  matched_sku: {
    sku_code: string;
    description: string;
    width_in: number;
    height_in: number;
    thickness: string;
    reflectivity: string;
    sides: string;
    material: string;
  } | null;
};

const EXAMPLES = [
  "We need 6x18 signage, .040 thickness, HIP reflectivity, double sided, rush delivery",
  "12 by 18 aluminum sign, engineer grade reflective, single sided",
  "Two 24x36 diamond grade street signs, heavy gauge, ASAP",
  "Need some signs for the highway project ASAP",
];

export function OrderForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    if (!orderId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const json = await res.json();
        const order: OrderResult = json.data;

        if (order.ai_status === "COMPLETE" || order.ai_status === "FAILED") {
          setResult(order);
          setIsPolling(false);
          if (order.ai_status === "COMPLETE") {
            toast.success("Order processed successfully!");
          } else {
            toast.error("AI processing failed. Your order has been flagged for manual review.");
          }
        }
      } catch {
        // Silently retry
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [orderId, isPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: input.trim() }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        if (res.status === 401 || res.status === 403) {
          toast.error("Session expired. Please refresh and sign in again.");
        } else {
          toast.error(`Server error (${res.status}). Please try again.`);
        }
        return;
      }

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || "Failed to submit order");
        return;
      }

      setOrderId(json.data.id);
      setIsPolling(true);
      toast.success("Order submitted! Processing…");
    } catch (err) {
      console.error("Order submit error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. We need 6x18 signage, .040 thickness, HIP reflectivity, double sided, rush delivery"
                rows={4}
                className="w-full rounded border px-4 py-3 text-sm resize-none focus:outline-none"
                style={{
                  borderColor: "var(--amz-border)",
                  backgroundColor: "#fff",
                  color: "var(--amz-text)",
                }}
                disabled={isSubmitting || isPolling}
              />
              <p className="mt-1.5 text-xs" style={{ color: "var(--amz-text-muted)" }}>
                Describe your signage order in plain language. Include dimensions, thickness, reflectivity, sides, and delivery type.
              </p>
            </div>

            {/* Example chips — Amazon "frequently bought" pill style */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setInput(ex)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors hover:opacity-80"
                  style={{
                    borderColor: "var(--amz-border)",
                    backgroundColor: "#fff",
                    color: "var(--amz-link)",
                  }}
                >
                  {ex.slice(0, 40)}…
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="cta"
                loading={isSubmitting}
                disabled={!input.trim() || isPolling}
              >
                Submit Order
              </Button>
              {isPolling && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--amz-teal)" }}>
                  <Spinner className="h-4 w-4" />
                  AI is processing your order…
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--amz-text)" }}>
              Processing Result
            </h2>
            <OrderStatusBadge status={result.status} />
            <AIStatusBadge status={result.ai_status} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/orders/${result.id}`)}
            >
              View Full Order ›
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ParsedAttributesCard order={result} />
            <SKUMatchCard matchedSku={result.matched_sku} confidenceScore={result.confidence_score} />
          </div>

          <FlagsCard flags={result.flags ?? []} notes={result.ai_notes} />
        </div>
      )}
    </div>
  );
}
