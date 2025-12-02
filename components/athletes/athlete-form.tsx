import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AthleteFormValues = {
  first_name: string;
  last_name: string;
  affiliation: string;
  country: string;
  province: string;
  note: string;
};

type AthleteFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<AthleteFormValues>;
};

export function AthleteForm({ mode, defaultValues }: AthleteFormProps) {
  const isEdit = mode === "edit";

  // TODO: ในอนาคตให้ดึงจากฐานข้อมูล Affiliations จริง ๆ
  const affiliations = [
    {
      id: "aff-001",
      name: "ชมรมเดินทนกรุงเทพฯ",
    },
    {
      id: "aff-002",
      name: "Example Athletic Club",
    },
  ];

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขข้อมูลนักกีฬา" : "เพิ่มนักกีฬาใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          ระบุข้อมูลพื้นฐานของนักกีฬาที่จะใช้ในระบบจัดการแข่งขันเดินทน
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

          <div className="space-y-1.5">
            <label
              htmlFor="affiliation"
              className="block text-xs font-medium text-slate-800"
            >
              สังกัด / สโมสร (Affiliation)
            </label>
            <input
              id="affiliation"
              name="affiliation"
              list="affiliation-options"
              defaultValue={defaultValues?.affiliation}
              placeholder="พิมพ์เพื่อค้นหาแล้วเลือกสังกัดจากรายการ"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
            <datalist id="affiliation-options">
              {affiliations.map((affiliation) => (
                <option key={affiliation.id} value={affiliation.name}>
                  {affiliation.name}
                </option>
              ))}
            </datalist>
            <p className="text-[11px] text-slate-500">
              สามารถพิมพ์บางส่วนของชื่อสังกัดเพื่อค้นหา แล้วเลือกจากรายการด้านล่าง
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="country"
              className="block text-xs font-medium text-slate-800"
            >
              ประเทศ (Country)
            </label>
            <Input
              id="country"
              name="country"
              defaultValue={defaultValues?.country}
              placeholder="เช่น Thailand"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="province"
              className="block text-xs font-medium text-slate-800"
            >
              จังหวัด (Province)
            </label>
            <Input
              id="province"
              name="province"
              defaultValue={defaultValues?.province}
              placeholder="เช่น กรุงเทพมหานคร"
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
              placeholder="ข้อมูลเพิ่มเติม เช่น หมายเลขเสื้อถาวร, หมายเหตุด้านสุขภาพ หรืออื่น ๆ"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isEdit ? "บันทึกการแก้ไข" : "เพิ่มนักกีฬา"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


