import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login – Racewalk Tournament",
  description: "หน้าเข้าสู่ระบบผู้ดูแลสำหรับจัดการ Event ของ Racewalk Tournament",
};

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}


