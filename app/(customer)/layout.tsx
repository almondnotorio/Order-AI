export const dynamic = "force-dynamic";
import { CustomerNav } from "@/components/layout/CustomerNav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--amz-bg)" }}>
      <CustomerNav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
