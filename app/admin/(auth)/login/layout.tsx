import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบผู้ดูแล – การแข่งขันเดินทน",
  description: "หน้าเข้าสู่ระบบผู้ดูแลสำหรับจัดการกิจกรรมของการแข่งขันเดินทน",
};

export default function AdminAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}


