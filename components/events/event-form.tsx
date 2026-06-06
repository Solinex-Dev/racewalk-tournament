"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DetailField } from "@/components/common/detail-field";
import { createEvent, updateEvent } from "@/app/actions/events";
import { kmFromMeters } from "@/lib/distance";
import { parseBibAgeGroup } from "@/lib/bib";

export type EventAthleteEntry = { athleteId: string; bib: string };

export type EventFormValues = {
  name: string;
  /** datetime-local string, e.g. "2026-07-12T08:00" */
  startTime: string;
  /** datetime-local string; optional */
  endTime: string;
  location: string;
  /** distance in METRES (UI unit) — converted to km on save */
  distanceMeters: string;
  lapCount: number;
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "FINISHED";
  athletes: EventAthleteEntry[];
};

type GlobalAthlete = { id: string; name: string };

type EventFormProps = {
  mode: "create" | "edit";
  eventId?: string;
  canEdit?: boolean;
  defaultValues?: Partial<EventFormValues>;
  /** All athletes in the system — used for the picker modal. */
  globalAthletes: GlobalAthlete[];
};

const EMPTY: EventFormValues = {
  name: "",
  startTime: "",
  endTime: "",
  location: "",
  distanceMeters: "",
  lapCount: 1,
  status: "DRAFT",
  athletes: [],
};

const STATUS_LABEL: Record<EventFormValues["status"], string> = {
  DRAFT: "ร่าง – ยังไม่เผยแพร่",
  SCHEDULED: "กำหนดการ – ตั้งวันไว้แล้ว",
  ONGOING: "กำลังดำเนินการ – กำลังแข่งขัน",
  FINISHED: "เสร็จสิ้น – แข่งขันเสร็จแล้ว",
};

// Athlete list shows this many rows per page; the rest paginate.
const ATHLETES_PER_PAGE = 20;

/**
 * One athlete row (event form). BIB is editable here; the order number is shown
 * read-only — the start-list order is set per round in the round form, not here.
 */
function AthleteRow({
  position,
  athleteName,
  bib,
  bibConflict,
  onBibChange,
  onRemove,
}: Readonly<{
  position: number;
  athleteName: string;
  bib: string;
  bibConflict: boolean;
  onBibChange: (value: string) => void;
  onRemove: () => void;
}>) {
  // BIB must be age-encoded ([age band][3-digit seq], e.g. 65001). Anything else
  // (empty or malformed) is invalid and blocks saving.
  const ageGroup = parseBibAgeGroup(bib);
  const bibInvalid = !ageGroup;
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 last:border-b-0">
      {/* Order number — display only (start-list order is edited per round) */}
      <span className="w-10 shrink-0 text-center text-sm font-semibold text-slate-500">
        {position}
      </span>

      <span className="flex-1 truncate text-xs text-slate-800">{athleteName}</span>
      <Input
        className={`h-7 w-24 shrink-0 px-2 py-1 text-xs ${
          bibConflict || bibInvalid ? "border-red-400 text-red-700 focus-visible:ring-red-200" : ""
        }`}
        value={bib}
        onChange={(e) => onBibChange(e.target.value)}
        placeholder="เช่น 65001"
        aria-invalid={bibConflict || bibInvalid ? true : undefined}
      />
      {/* Live age-band chip (valid) or a format hint (invalid) */}
      <span className="flex w-20 shrink-0 justify-center">
        {ageGroup ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            รุ่น {ageGroup.label}
          </span>
        ) : (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 ring-1 ring-red-200">
            ผิดรูปแบบ
          </span>
        )}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-12 shrink-0 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
        onClick={onRemove}
      >
        ลบ
      </Button>
    </div>
  );
}

export function EventForm({
  mode,
  eventId,
  canEdit = false,
  defaultValues,
  globalAthletes,
}: Readonly<EventFormProps>) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const submitLabel = isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้าง Event ใหม่";

  const [saved, setSaved] = React.useState<EventFormValues>({ ...EMPTY, ...defaultValues });
  const [form, setForm] = React.useState<EventFormValues>(saved);
  const [editing, setEditing] = React.useState(!isEdit);
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Athlete picker state
  const [athleteSearch, setAthleteSearch] = React.useState("");
  const [athletePickerOpen, setAthletePickerOpen] = React.useState(false);
  const [athletePickerSelected, setAthletePickerSelected] = React.useState<string[]>([]);

  // In-list search / pagination (order is managed per round, not here)
  const [listQuery, setListQuery] = React.useState("");
  const [listPage, setListPage] = React.useState(0);

  const startEdit = () => {
    setForm(saved);
    setError(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(saved);
    setError(null);
    setEditing(false);
  };

  const filteredAthletes = globalAthletes.filter((a) => {
    if (!athleteSearch) return true;
    const q = athleteSearch.toLowerCase();
    return a.name.toLowerCase().includes(q);
  });

  // BIB duplicate detection within the event (warns in red, never blocks).
  const bibDup = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of form.athletes) {
      const t = a.bib.trim();
      if (!t) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const keys = new Set<string>();
    for (const [k, n] of counts) if (n > 1) keys.add(k);
    return { keys, labels: [...keys] };
  }, [form.athletes]);

  // Operate by athleteId (robust under search/pagination, where the row index
  // shown is not the index in the full array).
  const handleBibChange = (athleteId: string, bib: string) =>
    setForm((p) => ({
      ...p,
      athletes: p.athletes.map((a) => (a.athleteId === athleteId ? { ...a, bib } : a)),
    }));

  const handleRemoveAthlete = (athleteId: string) =>
    setForm((p) => ({ ...p, athletes: p.athletes.filter((a) => a.athleteId !== athleteId) }));

  const confirmAthletePicker = () => {
    const existing = new Set(form.athletes.map((a) => a.athleteId));
    const toAdd = athletePickerSelected.filter((id) => !existing.has(id));
    if (toAdd.length > 0) {
      setForm((p) => ({
        ...p,
        athletes: [...p.athletes, ...toAdd.map((id) => ({ athleteId: id, bib: "" }))],
      }));
    }
    setAthletePickerOpen(false);
    setAthletePickerSelected([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.endTime && form.startTime && form.endTime < form.startTime) {
      setError("เวลาจบกิจกรรมต้องไม่ก่อนเวลาเริ่มกิจกรรม");
      return;
    }
    // Every athlete must have a valid age-encoded BIB (e.g. 65001) before saving.
    if (form.athletes.some((a) => !parseBibAgeGroup(a.bib))) {
      setError("มีนักกีฬาที่ยังไม่ได้กรอกหมายเลข BIB หรือกรอกไม่ถูกต้อง (ต้องเป็นรูปแบบ เช่น 65001)");
      return;
    }
    // The form works in metres; storage is km — convert at the boundary.
    const { distanceMeters, ...rest } = form;
    const payload = { ...rest, distanceKm: kmFromMeters(distanceMeters) };
    startTransition(async () => {
      try {
        if (isEdit && eventId) {
          await updateEvent(eventId, payload);
          setSaved(form);
          setEditing(false);
          router.refresh();
        } else {
          const result = await createEvent(payload);
          router.push(`/admin/events/${result.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  // ── Athlete list: search + pagination ──────────────────────────────────────
  const athleteListQ = listQuery.trim().toLowerCase();
  const filteredAthleteRows = form.athletes
    .map((entry, fullIndex) => ({ entry, fullIndex }))
    .filter(({ entry }) => {
      if (!athleteListQ) return true;
      const nm = (globalAthletes.find((g) => g.id === entry.athleteId)?.name ?? "").toLowerCase();
      return entry.bib.toLowerCase().includes(athleteListQ) || nm.includes(athleteListQ);
    });
  const athleteTotalPages = Math.max(1, Math.ceil(filteredAthleteRows.length / ATHLETES_PER_PAGE));
  const athletePage = Math.min(listPage, athleteTotalPages - 1);
  const athletePageStart = athletePage * ATHLETES_PER_PAGE;
  const athletePageRows = filteredAthleteRows.slice(athletePageStart, athletePageStart + ATHLETES_PER_PAGE);

  return (
    <>
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-6">
          {editing ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Basic info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="event-name" className="text-sm font-medium text-slate-800">ชื่อ Event</label>
                  <Input
                    id="event-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="เช่น Racewalk Championship 2025"
                  />
                  <p className="text-[11px] text-slate-500">
                    ชื่อเต็มของการแข่งขันที่จะใช้แสดงทั้งฝั่ง Admin และ Public
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-start-time" className="text-sm font-medium text-slate-800">เวลาเริ่มกิจกรรม</label>
                  <Input
                    id="event-start-time"
                    type="datetime-local"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  />
                  <p className="text-[11px] text-slate-500">วันและเวลาที่เริ่มกิจกรรม</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-end-time" className="text-sm font-medium text-slate-800">เวลาจบกิจกรรม</label>
                  <Input
                    id="event-end-time"
                    type="datetime-local"
                    min={form.startTime || undefined}
                    value={form.endTime}
                    onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                  />
                  <p className="text-[11px] text-slate-500">วันและเวลาที่คาดว่าจะจบ (ไม่บังคับ)</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-location" className="text-sm font-medium text-slate-800">สถานที่จัดการแข่งขัน</label>
                  <Input
                    id="event-location"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="เช่น สนามกีฬาแห่งชาติ"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-distance" className="text-sm font-medium text-slate-800">ระยะทางรวม (เมตร)</label>
                  <Input
                    id="event-distance"
                    type="number"
                    min={0}
                    step="any"
                    value={form.distanceMeters}
                    onChange={(e) => setForm((p) => ({ ...p, distanceMeters: e.target.value }))}
                    placeholder="เช่น 10000, 20000"
                  />
                  <p className="text-[11px] text-slate-500">ระยะทางทั้งหมดของการแข่งขันเป็นเมตร (ใส่ทศนิยมได้)</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-lap-count" className="text-sm font-medium text-slate-800">
                    จำนวนรอบสนาม (Lap count) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="event-lap-count"
                    type="number"
                    min={1}
                    step="1"
                    required
                    value={form.lapCount}
                    onChange={(e) => setForm((p) => ({ ...p, lapCount: Math.max(1, Number(e.target.value) || 1) }))}
                    placeholder="เช่น 10, 20, 50"
                  />
                  <p className="text-[11px] text-slate-500">
                    จำนวนรอบที่นักกีฬาต้องเดินครบเพื่อจบการแข่งขัน — กำหนดตามขนาดสนามจริง
                    {form.distanceMeters && form.lapCount > 0 && (
                      <span className="mt-0.5 block text-emerald-600">
                        ระยะต่อรอบประมาณ {(Number(form.distanceMeters) / form.lapCount).toFixed(2)} ม./รอบ
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 md:max-w-md">
                <label htmlFor="event-status" className="text-sm font-medium text-slate-800">สถานะ Event</label>
                <select
                  id="event-status"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EventFormValues["status"] }))}
                >
                  <option value="DRAFT">ร่าง – ยังไม่เผยแพร่</option>
                  <option value="SCHEDULED">กำหนดการ – ตั้งวันไว้แล้ว</option>
                  <option value="ONGOING">กำลังดำเนินการ – กำลังแข่งขัน</option>
                  <option value="FINISHED">เสร็จสิ้น – แข่งขันเสร็จแล้ว</option>
                </select>
                <p className="text-[11px] text-slate-500">ใช้กำหนด state หลักของ Event เพื่อแสดงผลและคุม flow อื่น ๆ</p>
              </div>

              {/* Athletes */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">นักกีฬาที่เข้าร่วม Event</h2>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Bib ที่กำหนดที่นี่ใช้ในทุกรอบของ Event นี้ • ลำดับการออกตัวของนักกีฬาแก้ไขได้ในหน้า “รอบการแข่งขัน”
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg px-3 text-xs"
                      onClick={() => {
                        setAthletePickerSelected([]);
                        setAthleteSearch("");
                        setAthletePickerOpen(true);
                      }}
                    >
                      + เพิ่มนักกีฬา
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending} className="h-7 rounded-lg px-3 text-xs font-medium">
                      {isPending ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                  </div>
                </div>

                {bibDup.keys.size > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    <span>
                      มีหมายเลข Bib ซ้ำกัน:{" "}
                      <span className="font-semibold">{bibDup.labels.join(", ")}</span> — กรุณาตรวจสอบ
                    </span>
                  </div>
                )}

                {form.athletes.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-center text-[11px] text-slate-500">
                    ยังไม่มีนักกีฬา – กด &quot;เพิ่มนักกีฬา&quot;
                  </div>
                ) : (
                  <>
                    <Input
                      className="h-8 px-2 py-1 text-xs"
                      placeholder="ค้นหาด้วยชื่อ หรือ Bib..."
                      value={listQuery}
                      onChange={(e) => {
                        setListQuery(e.target.value);
                        setListPage(0);
                      }}
                    />

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {/* header row */}
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium uppercase text-slate-500">
                        <span className="w-10 shrink-0 text-center">ลำดับ</span>
                        <span className="flex-1">นักกีฬา</span>
                        <span className="w-24 shrink-0">หมายเลข Bib</span>
                        <span className="w-20 shrink-0 text-center">รุ่นอายุ</span>
                        <span className="w-12 shrink-0 text-right">ลบ</span>
                      </div>

                      {athletePageRows.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-slate-500">
                          ไม่พบนักกีฬาตามคำค้นหา
                        </div>
                      ) : (
                        athletePageRows.map(({ entry, fullIndex }) => {
                          const athlete = globalAthletes.find((a) => a.id === entry.athleteId);
                          const bibConflict = entry.bib.trim() !== "" && bibDup.keys.has(entry.bib.trim());
                          return (
                            <AthleteRow
                              key={entry.athleteId}
                              position={fullIndex + 1}
                              athleteName={athlete?.name ?? entry.athleteId}
                              bib={entry.bib}
                              bibConflict={bibConflict}
                              onBibChange={(v) => handleBibChange(entry.athleteId, v)}
                              onRemove={() => handleRemoveAthlete(entry.athleteId)}
                            />
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-600">
                      <span>
                        แสดง {athletePageRows.length} จาก {filteredAthleteRows.length} คน
                        {athleteListQ ? " (กรองแล้ว)" : ` • ทั้งหมด ${form.athletes.length} คน`}
                      </span>
                      {athleteTotalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={athletePage <= 0}
                            onClick={() => setListPage(athletePage - 1)}
                            className="h-7 rounded-lg px-2 text-[11px]"
                          >
                            ก่อนหน้า
                          </Button>
                          <span>หน้า {athletePage + 1}/{athleteTotalPages}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={athletePage >= athleteTotalPages - 1}
                            onClick={() => setListPage(athletePage + 1)}
                            className="h-7 rounded-lg px-2 text-[11px]"
                          >
                            ถัดไป
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                {isEdit && (
                  <Button type="button" variant="outline" disabled={isPending} onClick={cancelEdit} className="rounded-xl px-4 py-2 text-sm">
                    ยกเลิก
                  </Button>
                )}
                <Button type="submit" disabled={isPending} className="rounded-xl px-4 py-2 text-sm font-medium">
                  {isPending ? "กำลังบันทึก..." : submitLabel}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {isEdit && canEdit && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startEdit}
                    className="gap-1.5 rounded-lg border-slate-200 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> แก้ไข
                  </Button>
                </div>
              )}
              <dl>
                <DetailField label="ชื่อ Event" value={saved.name} />
                <DetailField label="เวลาเริ่มกิจกรรม" value={saved.startTime ? saved.startTime.replace("T", " ") : "—"} />
                <DetailField label="เวลาจบกิจกรรม" value={saved.endTime ? saved.endTime.replace("T", " ") : "—"} />
                <DetailField label="สถานที่" value={saved.location} />
                <DetailField label="ระยะทางรวม (ม.)" value={saved.distanceMeters} />
                <DetailField label="จำนวนรอบสนาม" value={String(saved.lapCount)} />
                <DetailField label="สถานะ" value={STATUS_LABEL[saved.status]} />
                <DetailField
                  label="นักกีฬาที่ลงทะเบียน"
                  value={
                    saved.athletes.length === 0
                      ? "ยังไม่มีนักกีฬา"
                      : `${saved.athletes.length} คน`
                  }
                />
              </dl>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Athlete Picker Modal */}
      {athletePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">เพิ่มนักกีฬาเข้า Event</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-lg px-2 text-[11px]"
                onClick={() => setAthletePickerOpen(false)}
              >
                ปิด
              </Button>
            </div>

            <Input
              className="mb-3 h-8 px-2 py-1 text-xs"
              placeholder="ค้นหาชื่อนักกีฬา..."
              value={athleteSearch}
              onChange={(e) => setAthleteSearch(e.target.value)}
            />

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
              <ul className="divide-y divide-slate-200 text-xs">
                {filteredAthletes.length === 0 ? (
                  <li className="px-3 py-3 text-center text-[11px] text-slate-500">
                    ไม่พบนักกีฬาตามคำค้นหา
                  </li>
                ) : (
                  [...filteredAthletes]
                    .sort((a, b) => {
                      const aIn = form.athletes.some((x) => x.athleteId === a.id);
                      const bIn = form.athletes.some((x) => x.athleteId === b.id);
                      if (aIn === bIn) return 0;
                      return aIn ? 1 : -1;
                    })
                    .map((athlete) => {
                      const alreadyIn = form.athletes.some((x) => x.athleteId === athlete.id);
                      const checked = athletePickerSelected.includes(athlete.id);
                      return (
                        <li
                          key={athlete.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-slate-50/80"
                        >
                          <label className="flex flex-1 items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300"
                              disabled={alreadyIn}
                              checked={checked && !alreadyIn}
                              onChange={() =>
                                !alreadyIn &&
                                setAthletePickerSelected((p) =>
                                  p.includes(athlete.id)
                                    ? p.filter((x) => x !== athlete.id)
                                    : [...p, athlete.id],
                                )
                              }
                            />
                            <span className="truncate">{athlete.name}</span>
                          </label>
                          {alreadyIn && (
                            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              อยู่ใน Event แล้ว
                            </span>
                          )}
                        </li>
                      );
                    })
                )}
              </ul>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg px-3 text-xs"
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
                ยืนยันการเพิ่ม ({athletePickerSelected.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
