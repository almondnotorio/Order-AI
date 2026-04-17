"use client";

import { useState, useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Badge, OrderStatusBadge } from "@/components/ui/Badge";

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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: OrderResult;
  isProcessing?: boolean;
  timestamp: Date;
};

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatSides(sides: string | null) {
  if (!sides) return "—";
  return sides === "DOUBLE" ? "Double Sided" : "Single Sided";
}

function formatDelivery(delivery: string | null) {
  if (!delivery) return "—";
  return delivery.charAt(0) + delivery.slice(1).toLowerCase();
}

function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function BotIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const icon = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0`}
      style={{ backgroundColor: "#1C1C1C" }}
    >
      <svg className={`${icon} text-white`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.75 3A2.25 2.25 0 007.5 5.25V6H6a2 2 0 00-2 2v2a2 2 0 002 2 6 6 0 0012 0 2 2 0 002-2V8a2 2 0 00-2-2h-1.5v-.75A2.25 2.25 0 0014.25 3h-4.5zM12 10a1 1 0 110 2 1 1 0 010-2zm-2.5 0a1 1 0 110 2 1 1 0 010-2zm5 0a1 1 0 110 2 1 1 0 010-2zM4 19a2 2 0 012-2h12a2 2 0 012 2v.5H4V19z" />
      </svg>
    </div>
  );
}

function UserIcon() {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: "var(--brand-accent)" }}
    >
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />
      </svg>
    </div>
  );
}

function OrderResultCard({ result }: { result: OrderResult }) {
  const confidence = result.confidence_score ?? 0;
  const pct = Math.round(confidence * 100);
  const confidenceColor = pct >= 80 ? "#067D62" : pct >= 50 ? "#985B01" : "#CC0C39";
  const dimensions =
    result.parsed_width && result.parsed_height
      ? `${result.parsed_width}×${result.parsed_height}`
      : "—";
  const flags = result.flags ?? [];

  return (
    <div
      className="mt-3 rounded-lg overflow-hidden text-sm"
      style={{ border: "1px solid var(--amz-border)", backgroundColor: "#FAFAF8" }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "var(--amz-border)", backgroundColor: "#fff" }}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 shrink-0"
            style={{ color: "#067D62" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold" style={{ color: "var(--amz-text)" }}>
            Order Processed
          </span>
        </div>
        <OrderStatusBadge status={result.status} />
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Parsed attributes */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--amz-text-muted)" }}
          >
            Parsed Attributes
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            {([
              ["Size", dimensions],
              ["Thickness", result.parsed_thickness ?? "—"],
              ["Reflectivity", result.parsed_reflectivity ?? "—"],
              ["Sides", formatSides(result.parsed_sides)],
              ["Delivery", formatDelivery(result.parsed_delivery)],
              ["Quantity", result.parsed_quantity?.toString() ?? "—"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
                  {label}
                </dt>
                <dd
                  className="font-semibold"
                  style={{
                    color:
                      label === "Reflectivity" && value !== "—"
                        ? "var(--amz-teal)"
                        : "var(--amz-text)",
                  }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </div>
        </div>

        {/* SKU match */}
        <div className="pt-3 border-t" style={{ borderColor: "var(--amz-border)" }}>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--amz-text-muted)" }}
          >
            SKU Match
          </p>
          {result.matched_sku ? (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold font-mono" style={{ color: "var(--amz-text)" }}>
                  {result.matched_sku.sku_code}
                </p>
                <p style={{ color: "var(--amz-text-muted)" }}>
                  {result.matched_sku.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold" style={{ color: confidenceColor }}>
                  {pct}%
                </p>
                <p className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
                  confidence
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: "#CC0C39" }}>
              No matching SKU — manual review required
            </p>
          )}
        </div>

        {/* Flags & notes */}
        {(flags.length > 0 || result.ai_notes) && (
          <div className="pt-3 border-t" style={{ borderColor: "var(--amz-border)" }}>
            {flags.length > 0 && (
              <div className="mb-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1"
                  style={{ color: "#985B01" }}
                >
                  <span>⚠</span> Flags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {flags.map((f, i) => (
                    <Badge key={i} variant="warning">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
            {result.ai_notes && (
              <p
                className="text-xs rounded px-2 py-1.5"
                style={{ color: "var(--amz-text-muted)", backgroundColor: "#F0EDE6" }}
              >
                {result.ai_notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-start gap-3">
      <BotIcon />
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-none px-4 py-3 inline-block max-w-xl"
          style={{ backgroundColor: "#fff", border: "1px solid var(--amz-border)" }}
        >
          {message.isProcessing ? (
            <div className="flex items-center gap-2" style={{ color: "var(--amz-text-muted)" }}>
              <Spinner className="h-4 w-4" />
              <span className="text-sm">Processing your order…</span>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: "var(--amz-text)" }}>
                {renderText(message.content)}
              </p>
              {message.result && <OrderResultCard result={message.result} />}
            </>
          )}
        </div>
        <p className="mt-1 text-xs pl-1" style={{ color: "var(--amz-text-muted)" }}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-start gap-3 flex-row-reverse">
      <UserIcon />
      <div className="flex flex-col items-end min-w-0">
        <div
          className="rounded-2xl rounded-tr-none px-4 py-3 max-w-xl"
          style={{ backgroundColor: "var(--amz-orange)", color: "#fff" }}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <p className="mt-1 text-xs pr-1" style={{ color: "var(--amz-text-muted)" }}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi there! 👋 I'm your AI order assistant. Tell me what signage you need in plain English and I'll parse the specifications, validate against our catalog, and find the best matching SKU for you.",
  timestamp: new Date(),
};

export function OrderForm() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [polling, setPolling] = useState<{ orderId: string; msgId: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!polling) return;
    const { orderId, msgId } = polling;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const json = await res.json();
        const order: OrderResult = json.data;

        if (order.ai_status !== "COMPLETE" && order.ai_status !== "FAILED") return;

        const pct = Math.round((order.confidence_score ?? 0) * 100);
        const sku = order.matched_sku?.sku_code ?? null;
        const content =
          order.ai_status === "FAILED"
            ? "I encountered an issue processing your order. It's been flagged for manual review."
            : sku
            ? `Order processed! I matched your request to **${sku}** with ${pct}% confidence.`
            : "I processed your order but couldn't find an exact SKU match. It's been queued for manual review.";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, content, result: order, isProcessing: false, timestamp: new Date() }
              : m
          )
        );
        setPolling(null);
        setIsProcessing(false);
      } catch {
        // silently retry
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [polling]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    const botMsgId = `b-${Date.now()}`;
    const botMsg: Message = {
      id: botMsgId,
      role: "assistant",
      content: "",
      isProcessing: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setIsProcessing(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: text }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const errContent =
          res.status === 401 || res.status === 403
            ? "Session expired. Please refresh and sign in again."
            : `Server error (${res.status}). Please try again.`;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, content: errContent, isProcessing: false } : m
          )
        );
        setIsProcessing(false);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? { ...m, content: json.message || "Failed to submit order.", isProcessing: false }
              : m
          )
        );
        setIsProcessing(false);
        return;
      }

      setPolling({ orderId: json.data.id, msgId: botMsgId });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, content: "Network error. Please try again.", isProcessing: false }
            : m
        )
      );
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        height: "calc(100dvh - 180px)",
        minHeight: "520px",
        backgroundColor: "#fff",
        border: "1px solid var(--amz-border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      }}
    >
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg) =>
          msg.role === "assistant" ? (
            <AssistantBubble key={msg.id} message={msg} />
          ) : (
            <UserBubble key={msg.id} message={msg} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="border-t px-4 pt-3 pb-4"
        style={{ borderColor: "var(--amz-border)", backgroundColor: "#FAFAF8" }}
      >
        <div className="flex items-end gap-3">
          <BotIcon size="sm" />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
            placeholder={`Describe your signage order... (e.g., "6×18 HIP reflective, .040 thick, double sided, rush")`}
            rows={1}
            disabled={isProcessing}
            className="flex-1 resize-none rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
            style={{
              borderColor: "var(--amz-border)",
              backgroundColor: "#fff",
              color: "var(--amz-text)",
              maxHeight: "120px",
              lineHeight: "1.5",
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "var(--amz-orange)" }}
          >
            {isProcessing ? (
              <Spinner className="h-4 w-4 text-white" />
            ) : (
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        <p className="mt-2 text-xs pl-11" style={{ color: "var(--amz-text-muted)" }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
