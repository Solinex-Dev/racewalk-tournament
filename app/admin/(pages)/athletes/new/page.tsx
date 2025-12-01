import Link from "next/link";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { Button } from "@/components/ui/button";

export default function NewAthletePage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              เพิ่มนักกีฬาใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มเพิ่มข้อมูลนักกีฬาโดยระบุชื่อ สังกัด ประเทศ และหมายเหตุเพิ่มเติม
            </p>
          </div>

          <Link href="/admin/athletes">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AthleteForm mode="create" />
      </div>
    </main>
  );
}


