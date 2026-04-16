export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/api-keys/[id] — revoke an API key
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req);
  const adminError = requireAdmin(ctx);
  if (adminError) return adminError;

  const { id } = await params;

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key) return apiError("NotFound", "API key not found", 404);

  await prisma.apiKey.update({ where: { id }, data: { revoked: true } });
  return apiSuccess({ revoked: true, id });
}
