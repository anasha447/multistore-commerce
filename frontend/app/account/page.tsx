import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AccountView } from "@/components/account/AccountView";
import { getCurrentUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Account — Matessa" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <AccountView user={user} />
      </main>
      <SiteFooter variant="minimal" />
    </>
  );
}
