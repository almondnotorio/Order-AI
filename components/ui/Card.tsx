import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn("rounded bg-white", className)}
      style={{
        border: "1px solid var(--amz-border)",
        boxShadow: "0 2px 5px rgba(15,17,17,0.08)",
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div
      className={cn("px-5 py-3 border-b", className)}
      style={{ borderColor: "var(--amz-border)" }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn("text-sm font-semibold", className)} style={{ color: "var(--amz-text)" }}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
