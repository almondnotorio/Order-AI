"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatDateTime } from "@/lib/utils";

type ApiKey = {
  id: string;
  label: string;
  last_used: string | null;
  created_at: string;
  user: { email: string };
};

export function ApiKeyManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const json = await res.json();
      if (res.ok) {
        setNewKey(json.data.raw_key);
        const { raw_key: _, ...keyData } = json.data;
        setKeys((prev) => [keyData, ...prev]);
        setLabel("");
        setShowCreate(false);
        toast.success("API key created");
      } else {
        toast.error(json.message || "Failed to create key");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        toast.success("API key revoked");
      } else {
        toast.error("Failed to revoke key");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--amz-text-muted)" }}>
          {keys.length} active key{keys.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" variant="cta" onClick={() => setShowCreate(true)}>
          + Generate Key
        </Button>
      </div>

      {/* New key banner */}
      {newKey && (
        <div
          className="rounded px-4 py-4"
          style={{ border: "1px solid #B7E4C7", backgroundColor: "#D4EDDA" }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--amz-green)" }}>
            New API Key — copy it now, it won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 font-mono text-sm px-3 py-2 rounded break-all"
              style={{
                backgroundColor: "#fff",
                border: "1px solid var(--amz-border)",
                color: "var(--amz-text)",
              }}
            >
              {newKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                toast.success("Copied!");
              }}
              className="shrink-0 rounded px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--amz-green)" }}
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs hover:underline"
            style={{ color: "var(--amz-green)" }}
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Keys table */}
      <div
        className="overflow-hidden rounded bg-white"
        style={{ border: "1px solid var(--amz-border)", boxShadow: "0 2px 5px rgba(15,17,17,0.08)" }}
      >
        {keys.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--amz-text-muted)" }}>
            No API keys yet. Generate one to connect external applications.
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: "#F0F2F2" }}>
                {["Label", "Owner", "Created", "Last Used", ""].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${
                      h === "Owner" ? "hidden sm:table-cell" :
                      h === "Created" ? "hidden md:table-cell" :
                      h === "Last Used" ? "hidden lg:table-cell" : ""
                    }`}
                    style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((key, i) => (
                <tr
                  key={key.id}
                  style={{
                    borderBottom: i < keys.length - 1 ? "1px solid var(--amz-border)" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#F7FAFA"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium" style={{ color: "var(--amz-text)" }}>
                      {key.label}
                    </span>
                    <p className="text-xs font-mono" style={{ color: "var(--amz-text-muted)" }}>
                      {key.id.slice(0, 12)}…
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--amz-text-muted)" }}>
                    {key.user.email}
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "var(--amz-text-muted)" }}>
                    {formatDateTime(key.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs hidden lg:table-cell" style={{ color: "var(--amz-text-muted)" }}>
                    {key.last_used ? formatDateTime(key.last_used) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(key.id)}
                      className="text-xs hover:underline"
                      style={{ color: "var(--amz-red)" }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Generate API Key">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. ERP Integration, Mobile App"
            required
          />
          <p className="text-xs" style={{ color: "var(--amz-text-muted)" }}>
            The raw API key will be shown once after creation. Store it securely.
            Use it in the{" "}
            <code
              className="px-1 rounded text-xs font-mono"
              style={{ backgroundColor: "#F0F2F2" }}
            >
              Authorization: Bearer &lt;key&gt;
            </code>{" "}
            header.
          </p>
          <Button type="submit" variant="cta" loading={creating} className="w-full">
            Generate Key
          </Button>
        </form>
      </Modal>
    </div>
  );
}
