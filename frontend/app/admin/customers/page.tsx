import { redirect } from "next/navigation";
import { CustomersView } from "@/components/admin/CustomersView";
import { getCurrentUser } from "@/lib/server/session";
import { getAdminUsers, getCustomerAnalytics } from "@/lib/server/adminUsers";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ enabled?: string; page?: string }>;
}) {
  const { enabled, page } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/customers");
  if (!user.roles.includes("ADMIN")) redirect("/admin"); // customer analytics is ADMIN-only

  const enabledFilter = enabled === "true" ? true : enabled === "false" ? false : undefined;
  const pageNum = page && /^\d+$/.test(page) ? Number(page) : 0;

  const [analytics, directory] = await Promise.all([
    getCustomerAnalytics(),
    getAdminUsers({ role: "CUSTOMER", enabled: enabledFilter, page: pageNum, size: 20 }),
  ]);

  return <CustomersView analytics={analytics} directory={directory} enabled={enabled} />;
}
