"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

type SKU = {
  id: string;
  sku_code: string;
  description: string;
  width_in: number;
  height_in: number;
  thickness: string;
  reflectivity: string;
  sides: string;
  material: string;
  active: boolean;
};

function SKUForm({ onSuccess }: { onSuccess: (sku: SKU) => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sku_code: "",
    description: "",
    width_in: "",
    height_in: "",
    thickness: ".040",
    reflectivity: "HIP",
    sides: "SINGLE",
    material: "ALUMINUM",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/skus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          width_in: parseFloat(form.width_in),
          height_in: parseFloat(form.height_in),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("SKU created");
        onSuccess(json.data);
      } else {
        toast.error(json.message || "Failed to create SKU");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="SKU Code" value={form.sku_code} onChange={(e) => f("sku_code", e.target.value.toUpperCase())} placeholder="AL-6X18-040-HIP-SS" required />
      <Input label="Description" value={form.description} onChange={(e) => f("description", e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Width (in)" type="number" step="0.5" value={form.width_in} onChange={(e) => f("width_in", e.target.value)} required />
        <Input label="Height (in)" type="number" step="0.5" value={form.height_in} onChange={(e) => f("height_in", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Thickness" value={form.thickness} onChange={(e) => f("thickness", e.target.value)}>
          {[".040", ".063", ".080", ".125"].map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select label="Reflectivity" value={form.reflectivity} onChange={(e) => f("reflectivity", e.target.value)}>
          {["NONE", "EG", "HIP", "DG3"].map((r) => <option key={r}>{r}</option>)}
        </Select>
        <Select label="Sides" value={form.sides} onChange={(e) => f("sides", e.target.value)}>
          {["SINGLE", "DOUBLE"].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select label="Material" value={form.material} onChange={(e) => f("material", e.target.value)}>
          {["ALUMINUM", "STEEL", "PLASTIC"].map((m) => <option key={m}>{m}</option>)}
        </Select>
      </div>
      <Button type="submit" variant="cta" loading={loading} className="w-full">Create SKU</Button>
    </form>
  );
}

function SyncButton({ onSync }: { onSync: (skus: SKU[]) => void }) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skus/sync", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(
          `Synced ${json.data.synced} SKUs (${json.data.created} new, ${json.data.updated} updated)`
        );
        const listRes = await fetch("/api/skus?limit=1000");
        const listJson = await listRes.json();
        if (listRes.ok) onSync(listJson.data ?? []);
      } else {
        toast.error(json.message || "Sync failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="secondary" loading={loading} onClick={handleSync}>
      Sync from Catalog
    </Button>
  );
}

export function SKUManager({ initialSkus }: { initialSkus: SKU[] }) {
  const [skus, setSkus] = useState(initialSkus);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this SKU? Orders already matched will not be affected.")) return;
    try {
      const res = await fetch(`/api/skus/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSkus((prev) => prev.map((s) => s.id === id ? { ...s, active: false } : s));
        toast.success("SKU deactivated");
      } else {
        toast.error("Failed to deactivate SKU");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const filtered = skus.filter(
    (s) =>
      s.sku_code.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search SKUs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded border px-3 text-sm w-64 focus:outline-none"
          style={{
            borderColor: "var(--amz-border)",
            backgroundColor: "#fff",
            color: "var(--amz-text)",
          }}
        />
        <Button size="sm" variant="cta" onClick={() => setShowCreate(true)}>+ Add SKU</Button>
        <SyncButton onSync={(newSkus) => setSkus((prev) => {
          const map = new Map(prev.map((s) => [s.sku_code, s]));
          for (const s of newSkus) map.set(s.sku_code, s);
          return Array.from(map.values());
        })} />
        <span className="text-sm" style={{ color: "var(--amz-text-muted)" }}>
          {filtered.length} SKUs
        </span>
      </div>

      <div
        className="overflow-hidden rounded bg-white"
        style={{ border: "1px solid var(--amz-border)", boxShadow: "0 2px 5px rgba(15,17,17,0.08)" }}
      >
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: "#F0F2F2" }}>
              {["SKU Code", "Description", "Dims", "Spec", "Status", ""].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${
                    h === "Description" ? "hidden md:table-cell" :
                    h === "Dims" ? "hidden sm:table-cell" :
                    h === "Spec" ? "hidden lg:table-cell" : ""
                  }`}
                  style={{ color: "var(--amz-text-muted)", borderBottom: "1px solid var(--amz-border)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--amz-text-muted)" }}>
                  No SKUs found
                </td>
              </tr>
            )}
            {filtered.map((sku, i) => (
              <tr
                key={sku.id}
                className={!sku.active ? "opacity-50" : ""}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--amz-border)" : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#F7FAFA"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = ""}
              >
                <td className="px-4 py-3 font-mono text-sm" style={{ color: "var(--amz-link)" }}>
                  {sku.sku_code}
                </td>
                <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: "var(--amz-text)" }}>
                  {sku.description}
                </td>
                <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--amz-text-muted)" }}>
                  {sku.width_in}"×{sku.height_in}"
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="muted">{sku.thickness}</Badge>
                    <Badge variant="info">{sku.reflectivity}</Badge>
                    <Badge variant="default">{sku.sides === "SINGLE" ? "SS" : "DS"}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={sku.active ? "success" : "muted"}>
                    {sku.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {sku.active && (
                    <button
                      onClick={() => handleDeactivate(sku.id)}
                      className="text-xs hover:underline"
                      style={{ color: "var(--amz-red)" }}
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New SKU">
        <SKUForm
          onSuccess={(sku) => {
            setSkus((prev) => [sku, ...prev]);
            setShowCreate(false);
          }}
        />
      </Modal>
    </div>
  );
}
