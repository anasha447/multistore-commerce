import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in — Matessa" };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[70svh] place-items-center px-5 py-14">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
