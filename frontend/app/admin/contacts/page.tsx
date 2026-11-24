import { redirect } from "next/navigation";
import { ContactsView } from "@/components/admin/ContactsView";
import { getCurrentUser } from "@/lib/server/session";
import { getContactQueries, getSubscribers } from "@/lib/server/contacts";

export const dynamic = "force-dynamic";

/** Combined staff view: support queries + newsletter subscribers, shown as two tabs.
 *  Both MANAGER and ADMIN may see it. The active tab (and its page) come from the URL. */
export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { tab: tabParam, page } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/contacts");
  const isStaff = user.roles.includes("ADMIN") || user.roles.includes("MANAGER");
  if (!isStaff) redirect("/");

  const tab = tabParam === "subscribers" ? "subscribers" : "queries";
  const pageNum = page && /^\d+$/.test(page) ? Number(page) : 0;

  // Only the active tab is paginated by `page`; the other stays on its first page.
  const [queries, subscribers] = await Promise.all([
    getContactQueries({ page: tab === "queries" ? pageNum : 0, size: 20 }),
    getSubscribers({ page: tab === "subscribers" ? pageNum : 0, size: 20 }),
  ]);

  return <ContactsView tab={tab} queries={queries} subscribers={subscribers} />;
}
