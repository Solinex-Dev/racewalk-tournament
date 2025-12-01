import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Admin login – Racewalk Tournament",
  description:
    "หน้าเข้าสู่ระบบผู้ดูแลสำหรับเข้าแดชบอร์ดจัดการการแข่งขันเดินทนบน Racewalk Tournament.",
};

export default function Login() {
  return <AdminLoginForm />;
}
