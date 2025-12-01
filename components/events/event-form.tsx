 "use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AthleteEntry = {
  athlete_id: string;
  bib_no: string;
};

type JudgeEntry = {
  judge_id: string;
  table_no: string;
  event_secret_code: string;
};

type EventFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<EventFormValues>;
};

export type EventFormValues = {
  name: string;
  date: string;
  location: string;
  distance_km: string;
  status: "draft" | "scheduled" | "ongoing" | "finished";
  note?: string;
  judge_join_code?: string;
  max_athletes: string;
  max_judges: string;
  athletes: AthleteEntry[];
  judges: JudgeEntry[];
};

const EMPTY_VALUES: EventFormValues = {
  name: "",
  date: "",
  location: "",
  distance_km: "",
  status: "draft",
  note: "",
  judge_join_code: "",
  max_athletes: "",
  max_judges: "",
  athletes: [],
  judges: [],
};

// TODO: ภายหลังให้ดึงรายการนักกีฬา / กรรมการจากฐานข้อมูลจริง
const MOCK_ATHLETE_OPTIONS = [
  { id: "ath-001", name: "Somchai Rakdee" },
  { id: "ath-002", name: "Jane Doe" },
  { id: "ath-003", name: "Chanida Runfast" },
];

const MOCK_JUDGE_OPTIONS = [
  { id: "jud-001", name: "Mr. Referee 1" },
  { id: "jud-002", name: "Ms. Referee 2" },
  { id: "jud-003", name: "Head Judge" },
];

const EVENT_SECRET_CODE_LENGTH = 6;
const EVENT_SECRET_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateEventSecretCode() {
  let code = "";
  for (let i = 0; i < EVENT_SECRET_CODE_LENGTH; i += 1) {
    const idx = Math.floor(Math.random() * EVENT_SECRET_CODE_CHARS.length);
    code += EVENT_SECRET_CODE_CHARS[idx] ?? "X";
  }
  return code;
}

export function EventForm({ mode, defaultValues }: EventFormProps) {
  const [form, setForm] = React.useState<EventFormValues>(() => {
    const merged: EventFormValues = {
      ...EMPTY_VALUES,
      ...defaultValues,
      athletes: defaultValues?.athletes ?? EMPTY_VALUES.athletes,
      judges: (defaultValues?.judges as any) ?? EMPTY_VALUES.judges,
    };

    const judgesWithCode: JudgeEntry[] = (merged.judges ?? []).map(
      (judge: any) => ({
        judge_id: judge.judge_id ?? "",
        table_no: judge.table_no ?? "",
        event_secret_code:
          judge.event_secret_code && typeof judge.event_secret_code === "string"
            ? judge.event_secret_code
            : generateEventSecretCode(),
      }),
    );

    return {
      ...merged,
      judges: judgesWithCode,
    };
  });

  const isEdit = mode === "edit";
  const maxAthletes = Number(form.max_athletes || 0);
  const maxJudges = Number(form.max_judges || 0);

  const [athleteSearch, setAthleteSearch] = React.useState("");
  const [judgeSearch, setJudgeSearch] = React.useState("");
  const [athletePickerOpen, setAthletePickerOpen] = React.useState(false);
  const [judgePickerOpen, setJudgePickerOpen] = React.useState(false);
  const [athletePickerSelected, setAthletePickerSelected] = React.useState<
    string[]
  >([]);
  const [judgePickerSelected, setJudgePickerSelected] = React.useState<
    string[]
  >([]);

  const filteredAthleteOptions = MOCK_ATHLETE_OPTIONS.filter((a) => {
    if (!athleteSearch) return true;
    const q = athleteSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
    );
  });

  const filteredJudgeOptions = MOCK_JUDGE_OPTIONS.filter((j) => {
    if (!judgeSearch) return true;
    const q = judgeSearch.toLowerCase();
    return j.name.toLowerCase().includes(q) || j.id.toLowerCase().includes(q);
  });

  const handleAddAthleteRow = () => {
    if (maxAthletes > 0 && form.athletes.length >= maxAthletes) {
      alert("จำนวนรายชื่อนักกีฬาเกินค่าที่กำหนดแล้ว");
      return;
    }
    setAthletePickerSelected([]);
    setAthleteSearch("");
    setAthletePickerOpen(true);
  };

  const handleRemoveAthleteRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      athletes: prev.athletes.filter((_, i) => i !== index),
    }));
  };

  const handleAthleteBibChange = (index: number, bib: string) => {
    setForm((prev) => ({
      ...prev,
      athletes: prev.athletes.map((a, i) =>
        i === index ? { ...a, bib_no: bib } : a,
      ),
    }));
  };

  const handleAddJudgeRow = () => {
    if (maxJudges > 0 && form.judges.length >= maxJudges) {
      alert("จำนวนกรรมการเกินค่าที่กำหนดแล้ว");
      return;
    }
    setJudgePickerSelected([]);
    setJudgeSearch("");
    setJudgePickerOpen(true);
  };

  const handleRemoveJudgeRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      judges: prev.judges.filter((_, i) => i !== index),
    }));
  };

  const handleJudgeTableChange = (index: number, tableNo: string) => {
    setForm((prev) => ({
      ...prev,
      judges: prev.judges.map((j, i) =>
        i === index ? { ...j, table_no: tableNo } : j,
      ),
    }));
  };

  const toggleAthletePickerItem = (id: string) => {
    setAthletePickerSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const confirmAthletePicker = () => {
    const existingIds = new Set(form.athletes.map((a) => a.athlete_id));
    const candidates = athletePickerSelected.filter((id) => !existingIds.has(id));

    if (candidates.length === 0) {
      setAthletePickerOpen(false);
      return;
    }

    let remaining = Infinity;
    if (maxAthletes > 0) {
      remaining = maxAthletes - form.athletes.length;
    }

    if (remaining <= 0) {
      alert("จำนวนรายชื่อนักกีฬาเกินค่าที่กำหนดแล้ว");
      setAthletePickerOpen(false);
      return;
    }

    const toAdd = candidates.slice(0, remaining);
    if (toAdd.length < candidates.length) {
      alert("มีบางรายชื่อไม่ถูกเพิ่มเพราะเกินจำนวนสูงสุดที่กำหนด");
    }

    setForm((prev) => ({
      ...prev,
      athletes: [
        ...prev.athletes,
        ...toAdd.map((id) => ({ athlete_id: id, bib_no: "" })),
      ],
    }));

    setAthletePickerOpen(false);
  };

  const toggleJudgePickerItem = (id: string) => {
    setJudgePickerSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const confirmJudgePicker = () => {
    const existingIds = new Set(form.judges.map((j) => j.judge_id));
    const candidates = judgePickerSelected.filter((id) => !existingIds.has(id));

    if (candidates.length === 0) {
      setJudgePickerOpen(false);
      return;
    }

    let remaining = Infinity;
    if (maxJudges > 0) {
      remaining = maxJudges - form.judges.length;
    }

    if (remaining <= 0) {
      alert("จำนวนกรรมการเกินค่าที่กำหนดแล้ว");
      setJudgePickerOpen(false);
      return;
    }

    const toAdd = candidates.slice(0, remaining);
    if (toAdd.length < candidates.length) {
      alert("มีบางรายชื่อกรรมการไม่ถูกเพิ่มเพราะเกินจำนวนสูงสุดที่กำหนด");
    }

    setForm((prev) => ({
      ...prev,
      judges: [
        ...prev.judges,
        ...toAdd.map((id) => ({
          judge_id: id,
          table_no: "",
          event_secret_code: generateEventSecretCode(),
        })),
      ],
    }));

    setJudgePickerOpen(false);
  };

  const handleRegenerateJudgeSecret = (index: number) => {
    setForm((prev) => ({
      ...prev,
      judges: prev.judges.map((j, i) =>
        i === index
          ? {
              ...j,
              event_secret_code: generateEventSecretCode(),
            }
          : j,
      ),
    }));
  };

  // TODO: เชื่อมต่อ submit กับ server action / API จริงภายหลัง
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log("[Mock submit event]", form);
    alert(
      isEdit
        ? "บันทึกการแก้ไข Event (mock) เรียบร้อย – รอเชื่อมต่อฐานข้อมูลจริง"
        : "สร้าง Event ใหม่ (mock) เรียบร้อย – รอเชื่อมต่อฐานข้อมูลจริง",
    );
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardContent className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                ชื่อ Event
              </label>
              <Input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="เช่น Racewalk Championship 2025"
              />
              <p className="text-[11px] text-slate-500">
                ชื่อเต็มของการแข่งขันที่จะใช้แสดงทั้งฝั่ง Admin และ Public
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                วันที่จัดการแข่งขัน
              </label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                สถานที่จัดการแข่งขัน
              </label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="เช่น สนามกีฬาแห่งชาติ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                ระยะทาง (กิโลเมตร)
              </label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={form.distance_km}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    distance_km: e.target.value,
                  }))
                }
                placeholder="เช่น 10, 20, 50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                สถานะ Event
              </label>
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as EventFormValues["status"],
                  }))
                }
              >
                <option value="draft">ร่าง – ยังไม่เผยแพร่</option>
                <option value="scheduled">กำหนดการ – ตั้งวันไว้แล้ว</option>
                <option value="ongoing">กำลังดำเนินการ – กำลังแข่งขัน</option>
                <option value="finished">เสร็จสิ้น – แข่งขันเสร็จแล้ว</option>
              </select>
              <p className="text-[11px] text-slate-500">
                ใช้กำหนด state หลักของ Event เพื่อแสดงผลและคุม flow อื่น ๆ
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                โค้ดสำหรับกรรมการ (Judge join code)
              </label>
              <Input
                value={form.judge_join_code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    judge_join_code: e.target.value,
                  }))
                }
                placeholder="เช่น RW2025-A – ใช้สำหรับกรรมการ join เข้ารายการนี้"
              />
              <p className="text-[11px] text-slate-500">
                โค้ดนี้จะใช้ในหน้า Judger join match page
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                จำนวนนักกีฬาสูงสุดใน Event นี้
              </label>
              <Input
                type="number"
                min={0}
                value={form.max_athletes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_athletes: e.target.value,
                  }))
                }
                placeholder="เช่น 50"
              />
              <p className="text-[11px] text-slate-500">
                ใช้กำหนดจำนวนรายชื่อนักกีฬาที่อนุญาตให้เข้าร่วม Event นี้
                (ไว้กันลิมิตก่อนเลือกตัวจริง)
              </p>
              {form.athletes.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  ปัจจุบันเลือกนักกีฬาแล้ว {form.athletes.length} คน
                  {maxAthletes > 0 && ` / จำกัด ${maxAthletes} คน`}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                จำนวนกรรมการสูงสุดใน Event นี้
              </label>
              <Input
                type="number"
                min={0}
                value={form.max_judges}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_judges: e.target.value,
                  }))
                }
                placeholder="เช่น 10"
              />
              <p className="text-[11px] text-slate-500">
                ใช้กำหนดจำนวนกรรมการ / โต๊ะ ที่จะใช้ใน Event นี้
              </p>
              {form.judges.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  ปัจจุบันเลือกกรรมการแล้ว {form.judges.length} คน
                  {maxJudges > 0 && ` / จำกัด ${maxJudges} คน`}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                จัดการรายชื่อนักกีฬาใน Event นี้
              </h2>
              <p className="mt-1 text-[11px] text-slate-600">
                เลือกนักกีฬาที่จะเข้าร่วม Event นี้ และกำหนด{" "}
                <span className="font-medium">หมายเลขประจำตัวใน Event</span>{" "}
                (bib number) ให้แต่ละคน
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-[11px] text-slate-600">
                  แถวรายชื่อนักกีฬา (สูงสุด{" "}
                  {maxAthletes > 0 ? `${maxAthletes} คน` : "ไม่จำกัด"}) –
                  ปัจจุบันเพิ่ม {form.athletes.length} แถว
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-7 w-40 px-2 py-1 text-xs"
                    placeholder="ค้นหานักกีฬา..."
                    value={athleteSearch}
                    onChange={(e) => setAthleteSearch(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 rounded-lg px-3 text-xs"
                    onClick={handleAddAthleteRow}
                  >
                    + เพิ่มแถว
                  </Button>
                </div>
              </div>

              <div className="min-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">นักกีฬา</th>
                      <th className="px-3 py-2 text-left">หมายเลขนักกีฬา (bib)</th>
                      <th className="px-3 py-2 text-right">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {form.athletes.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-[11px] text-slate-500"
                        >
                          ยังไม่มีรายชื่อนักกีฬาใน Event นี้ – กดปุ่ม
                          &quot;เพิ่มแถว&quot; เพื่อเริ่มเพิ่มนักกีฬา
                        </td>
                      </tr>
                    )}
                    {form.athletes.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 align-middle text-[11px] text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <span className="text-xs text-slate-800">
                            {MOCK_ATHLETE_OPTIONS.find(
                              (a) => a.id === row.athlete_id,
                            )?.name || "-"}
                            {row.athlete_id && (
                              <span className="ml-1 font-mono text-[10px] text-slate-500">
                                ({row.athlete_id})
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Input
                            className="h-7 w-full px-2 py-1 text-xs"
                            value={row.bib_no}
                            onChange={(e) =>
                              handleAthleteBibChange(index, e.target.value)
                            }
                            placeholder="เช่น 101, 102"
                          />
                        </td>
                        <td className="px-3 py-2 align-middle text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg border-slate-200 px-2 text-[11px]"
                            onClick={() => handleRemoveAthleteRow(index)}
                          >
                            ลบ
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                จัดการกรรมการ / โต๊ะกรรมการใน Event นี้
              </h2>
              <p className="mt-1 text-[11px] text-slate-600">
                เลือกกรรมการสำหรับ Event นี้
                และกำหนด{" "}
                <span className="font-medium">หมายเลขโต๊ะที่นั่งของกรรมการ</span>{" "}
                และ{" "}
                <span className="font-medium">
                  รหัสลับของกรรมการใน Event (event secret code)
                </span>{" "}
                สำหรับใช้ยืนยันตัวตนในฝั่ง Judger
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-[11px] text-slate-600">
                  แถวรายชื่อกรรมการ (สูงสุด{" "}
                  {maxJudges > 0 ? `${maxJudges} คน` : "ไม่จำกัด"}) – ปัจจุบันเพิ่ม{" "}
                  {form.judges.length} แถว
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-7 w-40 px-2 py-1 text-xs"
                    placeholder="ค้นหากรรมการ..."
                    value={judgeSearch}
                    onChange={(e) => setJudgeSearch(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 rounded-lg px-3 text-xs"
                    onClick={handleAddJudgeRow}
                  >
                    + เพิ่มแถว
                  </Button>
                </div>
              </div>

              <div className="min-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">กรรมการ</th>
                      <th className="px-3 py-2 text-left">โต๊ะที่นั่ง</th>
                      <th className="px-3 py-2 text-left">
                        รหัสลับใน Event (6 ตัวอักษร)
                      </th>
                      <th className="px-3 py-2 text-right">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {form.judges.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-[11px] text-slate-500"
                        >
                          ยังไม่มีรายชื่อกรรมการใน Event นี้ – กดปุ่ม
                          &quot;เพิ่มแถว&quot; เพื่อเริ่มเพิ่มกรรมการ
                        </td>
                      </tr>
                    )}
                    {form.judges.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 align-middle text-[11px] text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <span className="text-xs text-slate-800">
                            {MOCK_JUDGE_OPTIONS.find(
                              (j) => j.id === row.judge_id,
                            )?.name || "-"}
                            {row.judge_id && (
                              <span className="ml-1 font-mono text-[10px] text-slate-500">
                                ({row.judge_id})
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Input
                            className="h-7 w-full px-2 py-1 text-xs"
                            value={row.table_no}
                            onChange={(e) =>
                              handleJudgeTableChange(index, e.target.value)
                            }
                            placeholder="เช่น 1, 2, A, B"
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-800">
                              {row.event_secret_code || "------"}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-lg border-slate-200 px-2 text-[11px]"
                              onClick={() => handleRegenerateJudgeSecret(index)}
                            >
                              รีเซ็ตโค้ด
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg border-slate-200 px-2 text-[11px]"
                            onClick={() => handleRemoveJudgeRow(index)}
                          >
                            ลบ
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">
              หมายเหตุภายใน (Internal note)
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="รายละเอียดเพิ่มเติม เช่น เงื่อนไขพิเศษ / หมายเหตุสำหรับทีมงาน"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้าง Event ใหม่"}
            </Button>
          </div>

          <p className="text-[11px] text-slate-500">
            * ฟอร์มนี้เป็นตัวอย่างเบื้องต้น – ในขั้นต่อไปจะเชื่อมต่อกับ Prisma
            / MySQL และเพิ่มการ validate อย่างละเอียดมากขึ้น
          </p>
        </form>

        {athletePickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    เพิ่มนักกีฬาเข้า Event
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-600">
                    เลือกนักกีฬาที่ต้องการเพิ่ม สามารถค้นหาด้วยชื่อหรือรหัสได้
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg border-slate-200 px-2 text-[11px]"
                  onClick={() => setAthletePickerOpen(false)}
                >
                  ปิด
                </Button>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <Input
                  className="h-8 px-2 py-1 text-xs"
                  placeholder="ค้นหานักกีฬา..."
                  value={athleteSearch}
                  onChange={(e) => setAthleteSearch(e.target.value)}
                />
                <span className="text-[11px] text-slate-500">
                  เลือกได้สูงสุด{" "}
                  {maxAthletes > 0
                    ? Math.max(maxAthletes - form.athletes.length, 0)
                    : "ไม่จำกัด"}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                <ul className="divide-y divide-slate-200 text-xs">
                  {filteredAthleteOptions.length === 0 && (
                    <li className="px-3 py-3 text-center text-[11px] text-slate-500">
                      ไม่พบนักกีฬาตามคำค้นหา
                    </li>
                  )}
                  {[...filteredAthleteOptions]
                    .sort((a, b) => {
                      const aIn = form.athletes.some(
                        (x) => x.athlete_id === a.id,
                      );
                      const bIn = form.athletes.some(
                        (x) => x.athlete_id === b.id,
                      );
                      if (aIn === bIn) return 0;
                      return aIn ? 1 : -1; // คนที่อยู่ใน Event แล้วให้ไปอยู่ด้านล่าง
                    })
                    .map((athlete) => {
                      const alreadyInEvent = form.athletes.some(
                        (a) => a.athlete_id === athlete.id,
                      );
                      const checked =
                        athletePickerSelected.includes(athlete.id);
                      return (
                        <li
                          key={athlete.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-slate-50/80"
                        >
                          <label className="flex flex-1 items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                              disabled={alreadyInEvent}
                              checked={checked && !alreadyInEvent}
                              onChange={() =>
                                !alreadyInEvent &&
                                toggleAthletePickerItem(athlete.id)
                              }
                            />
                            <span className="truncate">
                              {athlete.name}{" "}
                              <span className="font-mono text-[10px] text-slate-500">
                                ({athlete.id})
                              </span>
                            </span>
                          </label>
                          {alreadyInEvent && (
                            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              อยู่ใน Event แล้ว
                            </span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  onClick={() => setAthletePickerOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  onClick={confirmAthletePicker}
                  disabled={athletePickerSelected.length === 0}
                >
                  ยืนยันการเพิ่ม
                </Button>
              </div>
            </div>
          </div>
        )}

        {judgePickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    เพิ่มกรรมการเข้า Event
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-600">
                    เลือกกรรมการที่ต้องการเพิ่ม สามารถค้นหาด้วยชื่อหรือรหัสได้
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg border-slate-200 px-2 text-[11px]"
                  onClick={() => setJudgePickerOpen(false)}
                >
                  ปิด
                </Button>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <Input
                  className="h-8 px-2 py-1 text-xs"
                  placeholder="ค้นหากรรมการ..."
                  value={judgeSearch}
                  onChange={(e) => setJudgeSearch(e.target.value)}
                />
                <span className="text-[11px] text-slate-500">
                  เลือกได้สูงสุด{" "}
                  {maxJudges > 0
                    ? Math.max(maxJudges - form.judges.length, 0)
                    : "ไม่จำกัด"}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                <ul className="divide-y divide-slate-200 text-xs">
                  {filteredJudgeOptions.length === 0 && (
                    <li className="px-3 py-3 text-center text-[11px] text-slate-500">
                      ไม่พบกรรมการตามคำค้นหา
                    </li>
                  )}
                  {[...filteredJudgeOptions]
                    .sort((a, b) => {
                      const aIn = form.judges.some(
                        (x) => x.judge_id === a.id,
                      );
                      const bIn = form.judges.some(
                        (x) => x.judge_id === b.id,
                      );
                      if (aIn === bIn) return 0;
                      return aIn ? 1 : -1; // กรรมการที่อยู่ใน Event แล้วให้ไปอยู่ด้านล่าง
                    })
                    .map((judge) => {
                      const alreadyInEvent = form.judges.some(
                        (j) => j.judge_id === judge.id,
                      );
                      const checked = judgePickerSelected.includes(judge.id);
                      return (
                        <li
                          key={judge.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-slate-50/80"
                        >
                          <label className="flex flex-1 items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                              disabled={alreadyInEvent}
                              checked={checked && !alreadyInEvent}
                              onChange={() =>
                                !alreadyInEvent &&
                                toggleJudgePickerItem(judge.id)
                              }
                            />
                            <span className="truncate">
                              {judge.name}{" "}
                              <span className="font-mono text-[10px] text-slate-500">
                                ({judge.id})
                              </span>
                            </span>
                          </label>
                          {alreadyInEvent && (
                            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              อยู่ใน Event แล้ว
                            </span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  onClick={() => setJudgePickerOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  onClick={confirmJudgePicker}
                  disabled={judgePickerSelected.length === 0}
                >
                  ยืนยันการเพิ่ม
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


