import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { Role } from "@/app/generated/prisma/client";

export type AuthContext = {
  userId: string;
  role: Role;
  authType: "clerk" | "apikey";
};

export async function getAuthContext(
  req: NextRequest
): Promise<AuthContext | null> {
  // Check API key first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer oap_")) {
    const raw = authHeader.slice(7);
    const key = await validateApiKey(raw);
    if (!key) return null;
    return { userId: key.user_id, role: key.user.role, authType: "apikey" };
  }

  // Fall back to Clerk session
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const role =
    (user?.publicMetadata?.role as string) === "admin"
      ? Role.ADMIN
      : Role.CUSTOMER;

  return { userId, role, authType: "clerk" };
}

export function requireAdmin(ctx: AuthContext | null): NextResponse | null {
  if (!ctx) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 }
    );
  }
  if (ctx.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }
  return null;
}

export function requireAuth(ctx: AuthContext | null): NextResponse | null {
  if (!ctx) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 }
    );
  }
  return null;
}
