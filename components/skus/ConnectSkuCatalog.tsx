"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ConnectionStatus = {
  configured: boolean;
  source: "database" | "env" | "none";
  updated_at: string | null;
};

export function ConnectSkuCatalog() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/settings/sku-catalog")
      .then((r) => r.json())
      .then((j) => setStatus(j.data))
      .catch(() => {});
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/sku-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus(json.data);
        setShowForm(false);
        setApiKey("");
        toast.success("Connected to external SKU catalog");
      } else {
        toast.error(json.message || "Connection failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Remove the stored API key? Future syncs will use the FINAL_SKU_API_KEY env var if set.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/settings/sku-catalog", { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setStatus(json.data);
        toast.success("API key removed");
      } else {
        toast.error(json.message || "Failed to remove key");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = status?.configured;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              External SKU Catalog
              <span className="ml-2 font-normal text-gray-500 text-xs">
                final-sku.vercel.app
              </span>
            </p>
            <p className="text-xs text-gray-400">
              {isConnected
                ? status?.source === "database"
                  ? `Connected via saved key${status.updated_at ? ` · updated ${new Date(status.updated_at).toLocaleDateString()}` : ""}`
                  : "Connected via FINAL_SKU_API_KEY env var"
                : "Not connected — sync will fail without an API key"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {isConnected ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm((v) => !v)}
              >
                Update Key
              </Button>
              {status?.source === "database" && (
                <Button
                  size="sm"
                  variant="danger"
                  loading={disconnecting}
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              Connect
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleConnect} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            Generate an API key in your{" "}
            <a
              href="https://final-sku.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline"
            >
              final-sku.vercel.app
            </a>{" "}
            admin panel, then paste it here. The key will be validated before saving.
          </p>
          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="oap_…"
            required
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>
              Validate &amp; Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setApiKey(""); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
