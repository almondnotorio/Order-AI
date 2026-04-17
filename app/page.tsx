import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  redirect(isAdmin ? "/admin/dashboard" : "/orders/new");
}
