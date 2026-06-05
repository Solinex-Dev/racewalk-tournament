import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { compareAthletesByFinish } from "@/lib/athlete-sort";
import { metersFromKm } from "@/lib/distance";
import { PrintButton } from "@/components/report/print-button";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Print Report – การแข่งขันเดินทน",
};

// Always reflect the latest moderator edits (finish times, status) — never cache.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ eventId: string }> };

function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง",
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังดำเนินการ",
  FINISHED: "เสร็จสิ้น",
};

const ROUND_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังดำเนินการ",
  FINISHED: "เสร็จสิ้น",
};

export default async function PrintReportPage(props: Readonly<Props>) {
  const { eventId } = await props.params;

  const me = await getCurrentAdmin();
  if (!hasPermission(me, "reports", "view")) return <NoAccess />;

  const [event, rawEventAthletes] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      include: {
        rounds: {
          where: { deletedAt: null },
          orderBy: { scheduledTime: "asc" },
          include: {
            roundAthletes: {
              where: { deletedAt: null },
              include: { athlete: { include: { affiliation: { select: { name: true } } } } },
              orderBy: [{ position: "asc" }, { athleteId: "asc" }],
            },
            cards: { where: { deletedAt: null } },
            finishTimes: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.eventAthlete.findMany({
      where: { eventId, deletedAt: null },
      select: { athleteId: true, bib: true },
    }),
  ]);

  if (!event) notFound();

  // BIB is stored at Event level — build a lookup map for use throughout this page.
  const bibMap = new Map(rawEventAthletes.map((ea) => [ea.athleteId, ea.bib]));

  // Per-round standings: sort with the shared finish comparator and assign a
  // DQ-aware rank (the same logic as the public leaderboard). A finisher who was
  // later DQ'd drops out of the ranked group, so everyone below moves up — the
  // stored `position` is raw finish order and isn't DQ-adjusted, so we compute it.
  const rankedByRound = new Map(
    event.rounds.map((round) => {
      const rows = round.roundAthletes.map((ra) => {
        const finish = round.finishTimes.find((f) => f.athleteId === ra.athleteId);
        return {
          ra,
          yellow: round.cards.filter(
            (c) => c.athleteId === ra.athleteId && c.color === "YELLOW",
          ).length,
          confirmedRed: round.cards.filter(
            (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "CONFIRMED",
          ).length,
          finishMs: finish?.timeMs ?? null,
          isFinished: !!finish,
        };
      });
      rows.sort((a, b) =>
        compareAthletesByFinish(
          { status: a.ra.status, position: a.ra.position ?? null, isFinished: a.isFinished, currentLap: 0, bib: bibMap.get(a.ra.athleteId) ?? "" },
          { status: b.ra.status, position: b.ra.position ?? null, isFinished: b.isFinished, currentLap: 0, bib: bibMap.get(b.ra.athleteId) ?? "" },
        ),
      );
      let rank = 0;
      const ranked = rows.map((r) => ({
        ...r,
        rank: r.ra.status === "OK" && r.isFinished ? (rank += 1) : null,
      }));
      return [round.id, ranked] as const;
    }),
  );

  return (
    <main className="print-page mx-auto max-w-full overflow-x-auto bg-white p-6 text-slate-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { padding: 0 !important; max-width: none !important; }
          .page-break { page-break-after: always; }
        }
        .print-page table { width: 100%; border-collapse: collapse; font-size: 11pt; margin-bottom: 12px; }
        .print-page th, .print-page td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
        .print-page th { background: #eee; }
        .print-page tr.dq { color: #b91c1c; }
        .print-page tr.dnf { color: #92400e; }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <PrintButton />
        <Link
          href={`/admin/events/${eventId}/report`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          กลับไปหน้า Report
        </Link>
      </div>

      <h1 className="text-2xl font-bold">รายงานผลการแข่งขัน</h1>
      <div className="mb-4 mt-2 text-sm text-slate-700">
        <p className="text-lg font-semibold">{event.name}</p>
        <p>
          วันที่:{" "}
          {event.date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p>สถานที่: {event.location}</p>
        <p>สถานะ Event: {STATUS_LABEL[event.status] ?? event.status}</p>
        <p>ระยะ: {metersFromKm(event.distanceKm)} ม.</p>
      </div>

      {event.rounds.length === 0 && (
        <p className="mt-8 italic text-slate-500">Event นี้ยังไม่มีรอบการแข่งขัน</p>
      )}

      {event.rounds.map((round) => (
        <section key={round.id} className="mb-6">
          <h2 className="mt-6 border-b-2 border-slate-800 pb-1 text-lg font-bold">{round.name}</h2>
          <div className="mt-2 text-sm text-slate-600">
            สถานะ: {ROUND_STATUS_LABEL[round.status] ?? round.status}
            {round.distanceKm && ` • ระยะ ${metersFromKm(round.distanceKm)} ม.`}
          </div>
          {round.startedAt && (
            <p className="mt-1 text-xs text-slate-600">
              เริ่ม: {round.startedAt.toLocaleString("th-TH")}
              {round.endedAt && ` — จบ: ${round.endedAt.toLocaleString("th-TH")}`}
            </p>
          )}

          {round.roundAthletes.length === 0 ? (
            <p className="mt-2 italic text-slate-500">ไม่มีนักกีฬาในรอบนี้</p>
          ) : (
            <table className="mt-3">
              <thead>
                <tr>
                  <th>อันดับ</th>
                  <th>Bib</th>
                  <th>นักกีฬา</th>
                  <th>ประเทศ</th>
                  <th>สังกัด</th>
                  <th>Y</th>
                  <th>R (ยืนยัน)</th>
                  <th>เวลาเข้าเส้นชัย</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {(rankedByRound.get(round.id) ?? []).map((r) => {
                  const nonDqRowClass = r.ra.status === "DNF" ? "dnf" : "";
                  const rowClass = r.ra.status === "DQ" ? "dq" : nonDqRowClass;
                  return (
                    <tr key={r.ra.id} className={rowClass}>
                      <td>{r.rank ?? "—"}</td>
                      <td className="font-mono">{bibMap.get(r.ra.athleteId) ?? "?"}</td>
                      <td>{r.ra.athlete.name}</td>
                      <td>{r.ra.athlete.country}</td>
                      <td>{r.ra.athlete.affiliation?.name ?? "—"}</td>
                      <td className="text-center">{r.yellow}</td>
                      <td className="text-center">{r.confirmedRed}</td>
                      <td className="font-mono">{formatMs(r.finishMs)}</td>
                      <td>{r.ra.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      ))}

      <div className="mt-8 border-t border-slate-300 pt-3 text-xs text-slate-500">
        <p>สร้างเมื่อ: {new Date().toLocaleString("th-TH")}</p>
        <p>ระบบ Racewalk Tournament</p>
      </div>
    </main>
  );
}
