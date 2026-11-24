import { redirect } from "next/navigation";
import { StaffView } from "@/components/admin/StaffView";
import { getCurrentUser } from "@/lib/server/session";
import { getAdminUsers } from "@/lib/server/adminUsers";
import type { AdminUserResponse, Role } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; enabled?: string; page?: string }>;
}) {
  const { role, enabled, page } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/staff");
  if (!user.roles.includes("ADMIN")) redirect("/admin"); // staff area is ADMIN-only

  // Staff = MANAGER + ADMIN. With no role filter, fetch both and merge.
  const roleFilter = role === "MANAGER" || role === "ADMIN" ? (role as Role) : undefined;
  const enabledFilter = enabled === "true" ? true : enabled === "false" ? false : undefined;
  const pageNum = page && /^\d+$/.test(page) ? Number(page) : 0;

  let data;
  if (roleFilter) {
    data = await getAdminUsers({ role: roleFilter, enabled: enabledFilter, page: pageNum, size: 20 });
  } else {
    const [managers, admins] = await Promise.all([
      getAdminUsers({ role: "MANAGER", enabled: enabledFilter, size: 1000 }),
      getAdminUsers({ role: "ADMIN", enabled: enabledFilter, size: 1000 }),
    ]);
    // Dedupe by id: a user who is BOTH admin and manager (e.g. the seed admin has
    // ["ADMIN","MANAGER"]) appears in both lists — otherwise React sees a duplicate key.
    const byId = new Map<number, AdminUserResponse>();
    for (const u of [...admins.items, ...managers.items]) byId.set(u.id, u);
    const all = [...byId.values()];
    const size = 20;
    const totalPages = Math.max(1, Math.ceil(all.length / size));
    const number = Math.min(pageNum, totalPages - 1);
    data = {
      items: all.slice(number * size, number * size + size),
      total: all.length,
      page: number,
      totalPages,
    };
  }

  return <StaffView data={data} currentUserId={user.id} role={role} enabled={enabled} />;
}
