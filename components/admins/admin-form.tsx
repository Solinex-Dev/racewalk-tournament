import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AdminFormValues = {
  name: string;
  email: string;
  role: string;
   password: string;
  status: "active" | "inactive";
};

type AdminFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<AdminFormValues>;
};

export function AdminForm({ mode, defaultValues }: AdminFormProps) {
  const isEdit = mode === "edit";

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขข้อมูล Admin" : "สร้าง Admin ใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          ระบุข้อมูลพื้นฐานของผู้ดูแลระบบสำหรับจัดการการแข่งขันเดินทน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-800"
            >
              ชื่อแสดงผล (Display name)
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name}
              placeholder="เช่น System Admin"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-800"
            >
              อีเมล
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={defaultValues?.email}
              placeholder="admin@example.com"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-800"
            >
              รหัสผ่าน (Password)
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={isEdit ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน" : "กำหนดรหัสผ่านเริ่มต้น"}
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="role"
              className="block text-xs font-medium text-slate-800"
            >
              บทบาท (Role)
            </label>
            <select
              id="role"
              name="role"
              defaultValue={defaultValues?.role ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            >
              <option value="" disabled>
                เลือกบทบาทของ Admin
              </option>
              <option value="owner">Owner / System admin</option>
              <option value="event_admin">Event admin</option>
              <option value="score_admin">Score admin</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-slate-800">
              สถานะการใช้งาน
            </span>
            <div className="flex gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  defaultChecked={defaultValues?.status !== "inactive"}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <span>ใช้งานอยู่</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  defaultChecked={defaultValues?.status === "inactive"}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <span>ปิดการใช้งาน</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isEdit ? "บันทึกการแก้ไข" : "สร้าง Admin"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

