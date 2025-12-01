import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AffiliationFormValues = {
  name: string;
  head_of_affiliation: string;
  join_at: string;
  note: string;
};

type AffiliationFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<AffiliationFormValues>;
};

export function AffiliationForm({ mode, defaultValues }: AffiliationFormProps) {
  const isEdit = mode === "edit";

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขสังกัด / สโมสร" : "เพิ่มสังกัด / สโมสรใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          จัดการข้อมูลสังกัด / สโมสรของนักกีฬา เช่น ชมรม มหาวิทยาลัย หรือทีมตัวแทน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-800"
            >
              ชื่อสังกัด / สโมสร (Name)
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name}
              placeholder="เช่น ชมรมเดินทนกรุงเทพฯ, มหาวิทยาลัยตัวอย่าง"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="head_of_affiliation"
              className="block text-xs font-medium text-slate-800"
            >
              ผู้ดูแล/หัวหน้าสังกัด (Head of affiliation)
            </label>
            <Input
              id="head_of_affiliation"
              name="head_of_affiliation"
              defaultValue={defaultValues?.head_of_affiliation}
              placeholder="เช่น นายสมชาย รักดี"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="join_at"
              className="block text-xs font-medium text-slate-800"
            >
              วันที่เข้าร่วม / เริ่มใช้งาน (Join at)
            </label>
            <Input
              id="join_at"
              name="join_at"
              type="date"
              defaultValue={defaultValues?.join_at}
              className="rounded-xl text-sm"
            />
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
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสังกัด เช่น ช่องทางติดต่อ เงื่อนไขพิเศษ ฯลฯ"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isEdit ? "บันทึกการแก้ไข" : "เพิ่มสังกัด / สโมสร"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


