import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  getSafeAdminRedirect,
  isAdminSession,
} from "@/lib/admin-auth-redirect";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบผู้ดูแล – การแข่งขันเดินทน",
  description:
    "หน้าเข้าสู่ระบบผู้ดูแลสำหรับเข้าแดชบอร์ดจัดการการแข่งขันเดินทนบน Racewalk Tournament.",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function Login({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (isAdminSession(role, session?.user?.id)) {
    const { callbackUrl } = await searchParams;
    redirect(getSafeAdminRedirect(callbackUrl));
  }

  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
