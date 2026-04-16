import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isAdminPageRoute = createRouteMatcher(["/admin(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/(.*)",   // ALL API routes handle their own auth inside the route handler
]);
const isProtectedPageRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/orders(.*)",
  "/admin(.*)",
]);

const CORS_ORIGIN = "https://final-sku.vercel.app";
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function addCors(req: NextRequest, res: NextResponse): NextResponse {
  if (req.headers.get("origin") === CORS_ORIGIN) {
    res.headers.set("Access-Control-Allow-Origin", CORS_ORIGIN);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.headers.set(key, value);
    }
  }
  return res;
}

export default clerkMiddleware(async (auth, req) => {
  // Handle CORS preflight for API routes from final-sku.vercel.app
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const headers: Record<string, string> = { ...CORS_HEADERS };
    if (origin === CORS_ORIGIN) headers["Access-Control-Allow-Origin"] = CORS_ORIGIN;
    return new NextResponse(null, { status: 204, headers });
  }

  // All /api/* routes bypass middleware auth entirely.
  // Auth is handled inside each route handler via getAuthContext().
  // This prevents Clerk from redirecting API calls to /sign-in (which breaks fetch).
  if (isPublicRoute(req)) {
    return addCors(req, NextResponse.next());
  }

  // Protect page routes — redirect unauthenticated users to /sign-in
  if (isProtectedPageRoute(req)) {
    const { userId, sessionClaims } = await auth.protect();

    // Admin page routes require admin role
    if (isAdminPageRoute(req)) {
      const metadata = sessionClaims?.metadata as { role?: string } | undefined;
      if (metadata?.role !== "admin") {
        const url = new URL("/dashboard", req.url);
        url.searchParams.set("error", "access_denied");
        return NextResponse.redirect(url);
      }
    }

    void userId; // used via auth.protect()
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
