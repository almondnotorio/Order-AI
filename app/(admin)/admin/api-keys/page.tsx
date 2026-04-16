import { prisma } from "@/lib/prisma";
import { ApiKeyManager } from "@/components/layout/ApiKeyManager";

export default async function AdminApiKeysPage() {
  const keys = await prisma.apiKey.findMany({
    where: { revoked: false },
    orderBy: { created_at: "desc" },
    include: { user: { select: { email: true } } },
  });

  const serialized = keys.map((k) => ({
    id: k.id,
    label: k.label,
    user_id: k.user_id,
    revoked: k.revoked,
    user: k.user,
    created_at: k.created_at.toISOString(),
    last_used: k.last_used?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--amz-text)" }}>
          API Keys
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--amz-text-muted)" }}>
          Manage API keys for external integrations. Keys are scoped to the generating admin&apos;s role.
        </p>
      </div>

      {/* Usage callout — Amazon info banner style */}
      <div
        className="rounded px-4 py-3 text-sm"
        style={{
          backgroundColor: "#EAF5FE",
          border: "1px solid #B0D9EE",
          color: "var(--amz-text)",
        }}
      >
        <strong>Usage:</strong> Include the API key in your request headers:{" "}
        <code
          className="ml-1 text-xs font-mono px-2 py-0.5 rounded"
          style={{ backgroundColor: "#fff", border: "1px solid var(--amz-border)" }}
        >
          Authorization: Bearer oap_...
        </code>
      </div>

      <ApiKeyManager initialKeys={serialized} />
    </div>
  );
}
