import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium" style={{ color: "var(--amz-text)" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "h-9 w-full rounded border px-3 text-sm",
            "focus:outline-none focus:ring-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-red-400",
            className
          )}
          style={{
            borderColor: error ? undefined : "var(--amz-border)",
            backgroundColor: "#fff",
            color: "var(--amz-text)",
            ...style,
          }}
          {...props}
        />
        {error && <p className="text-xs" style={{ color: "var(--amz-red)" }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
