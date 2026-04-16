import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 config: used for CLI tools (migrate, push, studio, etc.)
// The runtime PrismaClient reads the URL from process.env.DATABASE_URL
// via the adapter in lib/prisma.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses PgBouncer connection pooling)
    // Use DATABASE_URL if DIRECT_URL is not set
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
