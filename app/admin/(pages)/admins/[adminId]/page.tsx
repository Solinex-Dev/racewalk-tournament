import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admins/admin-form";
import { Button } from "@/components/ui/button";

const MOCK_ADMIN_BY_ID = {
  "adm-001": {
    name: "System Admin",
    email: "admin@example.com",
    role: "Owner",
    status: "active" as const,
  },
  "adm-002": {
    name: "Event Manager",
    email: "event@example.com",
    role: "Event admin",
    status: "active" as const,
  },
  "adm-003": {
    name: "Scoring Staff",
    email: "score@example.com",
    role: "Score admin",
    status: "inactive" as const,
  },
};

// หมายเหตุ: ใน Next.js รุ่นใหม่ props ของ route อาจถูกส่งมาเป็น Promise
// เลยต้อง unwrap ด้วย await ก่อนจะอ่านค่า params
type AdminDetailPageProps = {
  params: Promise<{
    adminId: string;
  }>;
};

export default async function AdminDetailPage(props: AdminDetailPageProps) {
  const { adminId } = await props.params;

  const admin = MOCK_ADMIN_BY_ID[adminId as keyof typeof MOCK_ADMIN_BY_ID];

  if (!admin) {
    // TODO: ในภายหลังให้เปลี่ยนมา fetch จากฐานข้อมูลจริง และ handle not found ให้เหมาะสม
    notFound();
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไข Admin
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดูและอัปเดตข้อมูลผู้ดูแลระบบที่เลือก
            </p>
          </div>

          <Link href="/admin/admins">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AdminForm
          mode="edit"
          defaultValues={admin}
        />
      </div>
    </main>
  );
}

