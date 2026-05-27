import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบผู้ดูแล – การแข่งขันเดินทน",
  description:
    "หน้าเข้าสู่ระบบผู้ดูแลสำหรับเข้าแดชบอร์ดจัดการการแข่งขันเดินทนบน Racewalk Tournament.",
};

export default function Login() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
