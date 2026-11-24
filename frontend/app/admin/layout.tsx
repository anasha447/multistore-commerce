import { redirect } from "next/navigation";
import "./admin.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Admin console shell. Guards the whole /admin tree: signed-out → login,
 *  customers → storefront. MANAGER sees Operate + Sell; ADMIN also sees People.
 *  Layout chrome (collapsible rail + mobile drawer) lives in the AdminShell client. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  const isAdmin = user.roles.includes("ADMIN");
  const isStaff = isAdmin || user.roles.includes("MANAGER");
  if (!isStaff) redirect("/");

  return (
    <div className="admin">
      <AdminShell isAdmin={isAdmin} firstName={user.firstName} lastName={user.lastName}>
        {children}
      </AdminShell>
    </div>
  );
}
