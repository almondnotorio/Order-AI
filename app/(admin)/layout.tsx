export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "admin") redirect("/orders/new");

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--brand-bg)" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
