"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "cta";
type ButtonSize = "sm" | "md" | "lg";

// Amazon-style inline styles per variant
const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  // Yellow "Add to Cart" button
  cta: {
    backgroundColor: "var(--amz-yellow)",
    color: "var(--amz-text)",
    border: "1px solid #FCD200",
  },
  // Orange "Buy Now" button
  primary: {
    backgroundColor: "var(--amz-orange)",
    color: "#fff",
    border: "1px solid #C45500",
  },
  secondary: {
    backgroundColor: "#fff",
    color: "var(--amz-text)",
    border: "1px solid var(--amz-border)",
  },
  danger: {
    backgroundColor: "var(--amz-red)",
    color: "#fff",
    border: "1px solid #B0000E",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--amz-link)",
    border: "1px solid transparent",
  },
  outline: {
    backgroundColor: "#fff",
    color: "var(--amz-text)",
    border: "1px solid var(--amz-border)",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      children,
      className,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded font-medium transition-opacity",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9900] focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          "hover:opacity-90 active:opacity-80",
          sizeClasses[size],
          className
        )}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
