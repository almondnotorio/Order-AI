"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "All Orders",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/admin/skus",
    label: "SKU Catalog",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: "/admin/api-keys",
    label: "API Keys",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col flex-shrink-0" style={{ backgroundColor: "var(--brand-sidebar)" }}>
      {/* Logo */}
      <div
        className="flex h-16 items-center justify-between px-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/admin/dashboard" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <div
            className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--brand-accent)" }}
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-widest uppercase">OrderAI</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Order Catalog
            </div>
          </div>
        </Link>

        <button className="transition-colors" style={{ color: "rgba(255,255,255,0.25)" }} aria-label="Collapse sidebar">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navLinks.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/admin/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
              style={active ? { backgroundColor: "var(--brand-accent)" } : {}}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — user + role indicator */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <UserButton />
        <div className="min-w-0">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
          >
            Admin
          </span>
        </div>
      </div>
    </aside>
  );
}
