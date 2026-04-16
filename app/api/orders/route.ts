import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAuth, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";
import { submitOrderSchema, orderQuerySchema } from "@/lib/validators";
import { processOrder } from "@/lib/order-processor";
import { AIStatus, OrderStatus } from "@/app/generated/prisma/client";

// Ensure a User row exists in DB for the authenticated Clerk user.
// Uses clerkClient (direct backend API) so it works in Route Handlers
// regardless of whether the Clerk proxy has initialised request context.
async function ensureUserExists(userId: string) {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      console.error(`Clerk user ${userId} has no email address`);
      return;
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, name },
      update: { email, name },
    });
  } catch (err) {
    console.error(`ensureUserExists failed for ${userId}:`, err);
    // Re-throw so the order creation returns a proper error instead of FK failure
    throw new Error("Failed to sync user record. Please try again.");
  }
}

// POST /api/orders — submit a new order
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  const authError = requireAuth(ctx);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BadRequest", "Invalid JSON body", 400);
  }

  const parsed = submitOrderSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("ValidationError", "Invalid request body", 400, parsed.error.flatten());
  }

  // Auto-create user row if it doesn't exist (webhook may not be configured yet)
  if (ctx!.authType === "clerk") {
    await ensureUserExists(ctx!.userId);
  }

  const order = await prisma.order.create({
    data: {
      user_id: ctx!.userId,
      raw_input: parsed.data.raw_input,
      ai_status: AIStatus.PENDING,
      status: OrderStatus.PENDING,
    },
  });

  // Trigger AI processing in the background (non-blocking)
  processOrder(order.id).catch((err) => {
    console.error(`Background order processing failed for ${order.id}:`, err);
  });

  return apiSuccess(
    {
      id: order.id,
      status: order.status,
      ai_status: order.ai_status,
      created_at: order.created_at,
    },
    201
  );
}

// GET /api/orders — list orders (admin sees all, customer sees own)
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  const authError = requireAuth(ctx);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const queryParsed = orderQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryParsed.success) {
    return apiError("ValidationError", "Invalid query parameters", 400, queryParsed.error.flatten());
  }

  const { status, page, limit, search } = queryParsed.data;
  const skip = (page - 1) * limit;

  const isAdmin = ctx!.role === "ADMIN";

  const where = {
    ...(isAdmin ? {} : { user_id: ctx!.userId }),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { raw_input: { contains: search, mode: "insensitive" as const } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        matched_sku: { select: { sku_code: true, description: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return apiSuccess(orders, 200, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
