import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/ui/Badge";

type SKUMatchProps = {
  matchedSku: {
    sku_code: string;
    description: string;
    width_in: number;
    height_in: number;
    thickness: string;
    reflectivity: string;
    sides: string;
    material: string;
  } | null;
  confidenceScore: number | null;
};

export function SKUMatchCard({ matchedSku, confidenceScore }: SKUMatchProps) {
  const score = confidenceScore ?? 0;
  const borderStyle: React.CSSProperties = !matchedSku
    ? { border: "2px solid #FDECEC" }
    : score >= 0.8
    ? { border: "2px solid #D4EDDA" }
    : score >= 0.5
    ? { border: "2px solid #FFF3CD" }
    : { border: "2px solid #FDECEC" };

  return (
    <div
      className="rounded bg-white"
      style={{
        ...borderStyle,
        boxShadow: "0 2px 5px rgba(15,17,17,0.08)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--amz-border)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--amz-text)" }}>
          SKU Match
        </h3>
        <ConfidenceBadge score={confidenceScore} />
      </div>
      <div className="px-5 py-4">
        {matchedSku ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-sm font-bold px-2 py-1 rounded"
                style={{ backgroundColor: "#F0F2F2", color: "var(--amz-text)" }}
              >
                {matchedSku.sku_code}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--amz-text)" }}>
              {matchedSku.description}
            </p>
            <dl className="grid grid-cols-2 gap-2 mt-3 text-xs">
              {[
                ["Dimensions", `${matchedSku.width_in}" × ${matchedSku.height_in}"`],
                ["Thickness", matchedSku.thickness],
                ["Reflectivity", matchedSku.reflectivity],
                ["Sides", matchedSku.sides],
              ].map(([label, val]) => (
                <div key={label}>
                  <dt style={{ color: "var(--amz-text-muted)" }}>{label}</dt>
                  <dd className="font-medium" style={{ color: "var(--amz-text)" }}>{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--amz-red)" }}>
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            No matching SKU found. Manual review required.
          </div>
        )}
      </div>
    </div>
  );
}
