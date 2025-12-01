import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type JudgeFormValues = {
  first_name: string;
  last_name: string;
  department: string;
  organization: string;
  status: "active" | "inactive";
  note: string;
};

type JudgeFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<JudgeFormValues>;
};

export function JudgeForm({ mode, defaultValues }: JudgeFormProps) {
  const isEdit = mode === "edit";

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขข้อมูลกรรมการ" : "เพิ่มกรรมการใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          ระบุข้อมูลพื้นฐานของกรรมการที่จะใช้ในระบบ เช่น ชื่อ หน่วยงาน และสถานะการใช้งาน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="first_name"
                className="block text-xs font-medium text-slate-800"
              >
                ชื่อ (First name)
              </label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={defaultValues?.first_name}
                placeholder="เช่น Somchai"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="last_name"
                className="block text-xs font-medium text-slate-800"
              >
                นามสกุล (Last name)
              </label>
              <Input
                id="last_name"
                name="last_name"
                defaultValue={defaultValues?.last_name}
                placeholder="เช่น Rakdee"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="department"
                className="block text-xs font-medium text-slate-800"
              >
                แผนก / หน่วยงาน (Department)
              </label>
              <Input
                id="department"
                name="department"
                defaultValue={defaultValues?.department}
                placeholder="เช่น Technical Committee, ภาควิชาพลศึกษา"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="organization"
                className="block text-xs font-medium text-slate-800"
              >
                องค์กร / สังกัด (Organization)
              </label>
              <Input
                id="organization"
                name="organization"
                defaultValue={defaultValues?.organization}
                placeholder="เช่น สมาคมกรีฑา, มหาวิทยาลัยตัวอย่าง"
                className="rounded-xl text-sm"
              />
            </div>
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

          <div className="space-y-1.5">
            <label
              htmlFor="note"
              className="block text-xs font-medium text-slate-800"
            >
              หมายเหตุ (Note)
            </label>
            <textarea
              id="note"
              name="note"
              defaultValue={defaultValues?.note}
              placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับกรรมการ เช่น ความเชี่ยวชาญ ประสบการณ์ หรือข้อจำกัดเฉพาะ"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isEdit ? "บันทึกการแก้ไข" : "เพิ่มกรรมการ"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


