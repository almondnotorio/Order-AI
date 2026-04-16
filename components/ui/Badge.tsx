import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "purple";

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default:  { backgroundColor: "#F0F2F2", color: "#565959" },
  success:  { backgroundColor: "#D4EDDA", color: "#067D62" },
  warning:  { backgroundColor: "#FFF3CD", color: "#985B01" },
  danger:   { backgroundColor: "#FDECEC", color: "#CC0C39" },
  info:     { backgroundColor: "#E8F4FD", color: "#007185" },
  muted:    { backgroundColor: "#F0F2F2", color: "#878787" },
  purple:   { backgroundColor: "#F3E8FF", color: "#6B21A8" },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    PENDING:    "muted",
    PROCESSING: "info",
    REVIEW:     "warning",
    APPROVED:   "success",
    REJECTED:   "danger",
    FULFILLED:  "purple",
  };
  return <Badge variant={map[status] ?? "default"}>{status}</Badge>;
}

export function AIStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    PENDING:    "muted",
    PROCESSING: "info",
    COMPLETE:   "success",
    FAILED:     "danger",
  };
  return <Badge variant={map[status] ?? "default"}>AI: {status}</Badge>;
}

export function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="muted">—</Badge>;
  const pct = Math.round(score * 100);
  const variant: BadgeVariant = pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger";
  return <Badge variant={variant}>{pct}%</Badge>;
}
