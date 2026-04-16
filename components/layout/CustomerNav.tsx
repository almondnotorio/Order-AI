"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders/new", label: "New Order" },
  { href: "/orders", label: "My Orders" },
];

export function CustomerNav() {
  const pathname = usePathname();

  return (
    <header style={{ backgroundColor: "var(--amz-dark)" }}>
      {/* Main bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-6">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 shrink-0 group"
            style={{ color: "white" }}
          >
            <div
              className="h-8 w-8 rounded flex items-center justify-center"
              style={{ backgroundColor: "var(--amz-orange)" }}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-wide text-white group-hover:text-[#FF9900] transition-colors">
              OrderAI
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded border transition-colors",
                    active
                      ? "text-white border-white"
                      : "text-gray-200 border-transparent hover:text-white hover:border-white"
                  )}
                  style={{ textDecoration: "none" }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/orders/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded"
              style={{
                backgroundColor: "var(--amz-yellow)",
                color: "var(--amz-text)",
                border: "1px solid #FCD200",
                textDecoration: "none",
              }}
            >
              + New Order
            </Link>
            <div
              className="flex items-center gap-2 px-2 py-1 rounded border border-transparent hover:border-white transition-colors cursor-pointer"
            >
              <UserButton />
              <span className="hidden sm:block text-xs text-gray-300">Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{ backgroundColor: "var(--amz-navy)", height: "3px" }} />
    </header>
  );
}
