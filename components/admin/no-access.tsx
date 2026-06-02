import { ShieldAlert } from "lucide-react";

/** Shown by admin pages when the signed-in admin lacks the required permission. */
export function NoAccess({ message }: { message?: string }) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="h-8 w-8 text-amber-500" />
        <h2 className="text-base font-semibold text-slate-900">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-slate-600">
          {message ?? "บัญชีของคุณไม่มีสิทธิ์เข้าถึงส่วนนี้ — ติดต่อผู้ดูแลระบบหากต้องการสิทธิ์เพิ่มเติม"}
        </p>
      </div>
    </main>
  );
}
