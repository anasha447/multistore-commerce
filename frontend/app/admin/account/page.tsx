import { redirect } from "next/navigation";
import { AccountView } from "@/components/admin/AccountView";
import { getCurrentUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/account");
  return <AccountView user={user} />;
}
