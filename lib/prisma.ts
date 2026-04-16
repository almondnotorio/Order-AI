import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Add it to your .env file."
    );
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

// Use a Proxy for truly lazy initialization — the client is not created
// until the first database operation, so Next.js build succeeds without a DB URL.
const handler: ProxyHandler<object> = {
  get(_target, prop: string | symbol) {
    const instance = (globalThis as { _prisma?: PrismaClient })._prisma;
    if (instance) {
      return (instance as unknown as Record<string | symbol, unknown>)[prop];
    }
    const newInstance = createPrismaClient();
    (globalThis as { _prisma?: PrismaClient })._prisma = newInstance;
    return (newInstance as unknown as Record<string | symbol, unknown>)[prop];
  },
};

export const prisma = new Proxy({}, handler) as PrismaClient;
