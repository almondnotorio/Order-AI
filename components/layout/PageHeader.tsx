"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PageHeader({ title, subtitle, actionLabel, actionHref }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1
          className="font-bold leading-tight"
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: "2rem",
            color: "var(--brand-text)",
          }}
        >
          {title}
        </h1>
        <p
          className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--brand-muted)" }}
        >
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--brand-accent)", textDecoration: "none" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {actionLabel}
          </Link>
        )}

        <button
          className="p-2 rounded-full transition-colors hover:bg-black/5"
          style={{ color: "var(--brand-muted)" }}
          aria-label="Notifications"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <UserButton />
      </div>
    </div>
  );
}
