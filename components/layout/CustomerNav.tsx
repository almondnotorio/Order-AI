"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/orders/new", label: "Place Order" },
  { href: "/orders", label: "Orders", exact: false },
];

export function CustomerNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string) ?? "customer";
  const isAdmin = role === "admin";

  return (
    <header style={{ backgroundColor: "var(--amz-dark)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-6">
          {/* Logo */}
          <Link
            href="/orders/new"
            className="flex items-center gap-2 shrink-0 group"
            style={{ color: "white", textDecoration: "none" }}
          >
            <div
              className="h-8 w-8 rounded flex items-center justify-center"
              style={{ backgroundColor: "var(--amz-orange)" }}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-wide text-white group-hover:text-[#FF9900] transition-colors">
              AIOrders
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1">
            {navLinks.map((link) => {
              const active =
                link.exact === false
                  ? pathname.startsWith(link.href) && pathname !== "/orders/new"
                  : pathname === link.href || pathname.startsWith(link.href);
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

          {/* Right side — user avatar + role badge */}
          <div className="ml-auto flex items-center gap-2">
            <UserButton />
            <span
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide"
              style={
                isAdmin
                  ? { backgroundColor: "var(--amz-orange)", color: "#fff" }
                  : { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }
              }
            >
              {isAdmin ? "Admin" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--amz-navy)", height: "3px" }} />
    </header>
  );
}
