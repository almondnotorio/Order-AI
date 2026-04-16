import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type ParsedData = {
  parsed_width: number | null;
  parsed_height: number | null;
  parsed_thickness: string | null;
  parsed_reflectivity: string | null;
  parsed_sides: string | null;
  parsed_material: string | null;
  parsed_delivery: string | null;
  parsed_quantity: number | null;
};

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--amz-text-muted)" }}
      >
        {label}
      </dt>
      <dd
        className="mt-0.5 text-sm font-medium"
        style={{ color: value ? "var(--amz-text)" : "#C8CBCB" }}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

export function ParsedAttributesCard({ order }: { order: ParsedData }) {
  const dimensions =
    order.parsed_width && order.parsed_height
      ? `${order.parsed_width}" × ${order.parsed_height}"`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Attributes</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Dimensions" value={dimensions} />
          <Field label="Thickness" value={order.parsed_thickness} />
          <Field label="Reflectivity" value={order.parsed_reflectivity} />
          <Field label="Sides" value={order.parsed_sides} />
          <Field label="Material" value={order.parsed_material} />
          <Field label="Delivery" value={order.parsed_delivery} />
          <Field label="Quantity" value={order.parsed_quantity} />
        </dl>
      </CardContent>
    </Card>
  );
}
