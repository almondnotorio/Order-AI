import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generateApiKey(): { raw: string; hash: string } {
  const raw = "oap_" + crypto.randomBytes(32).toString("hex");
  const hash = hashApiKey(raw);
  return { raw, hash };
}

export function hashApiKey(raw: string): string {
  const salt = process.env.API_KEY_SALT;
  if (!salt) throw new Error("API_KEY_SALT environment variable is not set");
  return crypto.createHmac("sha256", salt).update(raw).digest("hex");
}

export async function validateApiKey(raw: string) {
  if (!raw.startsWith("oap_")) return null;

  let hash: string;
  try {
    hash = hashApiKey(raw);
  } catch {
    return null;
  }

  const key = await prisma.apiKey.findUnique({
    where: { key_hash: hash },
    include: { user: true },
  });

  if (!key || key.revoked) return null;

  // Update last_used without blocking the request
  prisma.apiKey
    .update({ where: { id: key.id }, data: { last_used: new Date() } })
    .catch(() => {});

  return key;
}
