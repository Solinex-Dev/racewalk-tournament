import { Fragment } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PrintButton } from "@/components/report/print-button";
import {
  loadEventSummary,
  formatMs,
  type RoundSummary,
  type EventSummary,
} from "@/lib/report/summary-sheet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ใบสรุปผลการตัดสิน – การแข่งขันเดินทน",
};

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ round?: string }>;
};

const SYM_LIFT = "~";
const SYM_BENT = "<";

const ROUND_STATUS_TH: Record<RoundSummary["status"], string> = {
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังแข่งขัน",
  FINISHED: "เสร็จสิ้น",
};

function thaiDate(d: Date): string {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

// Relative column weights → identical proportions across every round's table.
const W = {
  bib: 30,
  name: 150,
  country: 46,
  jSub: 22, // each of ~ / < / RC per judge
  tSub: 24, // each of the three totals columns
  rank: 40,
  finish: 80,
  status: 48,
  dqTime: 52,
  offence: 72,
} as const;

function RoundSheet({ ev, round }: { ev: EventSummary; round: RoundSummary }) {
  const judges = round.judges;
  const total =
    W.bib +
    W.name +
    W.country +
    judges.length * 3 * W.jSub +
    3 * W.tSub +
    W.rank +
    W.finish +
    W.status +
    W.dqTime +
    W.offence;
  const pc = (w: number) => `${((w / total) * 100).toFixed(3)}%`;

  return (
    <section className="sheet">
      <div className="title">RACE WALKING JUDGES SUMMARY SHEET</div>
      <div className="subtitle">ใบสรุปผลการตัดสินของกรรมการ — การแข่งขันเดินทน</div>

      <table className="info">
        <colgroup>
          <col style={{ width: "15%" }} />
          <col style={{ width: "18.5%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "18.5%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="k">รายการ / EVENT</td>
            <td colSpan={5}>
              {ev.name} — {round.name}
              {round.heatName ? ` (${round.heatName})` : ""}
            </td>
          </tr>
          <tr>
            <td className="k">วันที่ / DATE</td>
            <td>{thaiDate(ev.date)}</td>
            <td className="k">เวลาเริ่ม / START</td>
            <td>{round.startTime || "—"}</td>
            <td className="k">ระยะ / DISTANCE</td>
            <td>{round.distanceKm ? `${round.distanceKm} กม.` : "—"}</td>
          </tr>
          <tr>
            <td className="k">สถานที่ / VENUE</td>
            <td>{ev.location}</td>
            <td className="k">หัวหน้ากรรมการ / CHIEF</td>
            <td>{round.chiefJudge || "—"}</td>
            <td className="k">สถานะ / STATUS</td>
            <td>{ROUND_STATUS_TH[round.status]}</td>
          </tr>
          <tr>
            <td className="k">ผู้บันทึกเวลา / RECORDERS</td>
            <td colSpan={5}>{round.recorders.join(", ") || "—"}</td>
          </tr>
        </tbody>
      </table>

      <table className="rwjs-grid">
        <colgroup>
          <col style={{ width: pc(W.bib) }} />
          <col style={{ width: pc(W.name) }} />
          <col style={{ width: pc(W.country) }} />
          {judges.map((j) => (
            <Fragment key={j.id}>
              <col style={{ width: pc(W.jSub) }} />
              <col style={{ width: pc(W.jSub) }} />
              <col style={{ width: pc(W.jSub) }} />
            </Fragment>
          ))}
          <col style={{ width: pc(W.tSub) }} />
          <col style={{ width: pc(W.tSub) }} />
          <col style={{ width: pc(W.tSub) }} />
          <col style={{ width: pc(W.rank) }} />
          <col style={{ width: pc(W.finish) }} />
          <col style={{ width: pc(W.status) }} />
          <col style={{ width: pc(W.dqTime) }} />
          <col style={{ width: pc(W.offence) }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2}>
              หมายเลข
              <br />
              BIB
            </th>
            <th rowSpan={2}>นักกีฬา / ATHLETE</th>
            <th rowSpan={2}>ประเทศ</th>
            {judges.map((j, idx) => (
              <th key={j.id} colSpan={3} className="jhead">
                <span className="jname">
                  {idx + 1}. {j.name}
                </span>
                {j.zone ? <span className="zone">{j.zone}</span> : null}
              </th>
            ))}
            <th colSpan={3}>
              รวม
              <br />
              TOTALS
            </th>
            <th rowSpan={2}>
              อันดับ
              <br />
              RANK
            </th>
            <th rowSpan={2}>
              เวลาเข้าเส้นชัย
              <br />
              FINISH
            </th>
            <th rowSpan={2}>สถานะ</th>
            <th rowSpan={2}>
              เวลา
              <br />
              DQ
            </th>
            <th rowSpan={2}>
              ความผิด
              <br />
              OFFENCE
            </th>
          </tr>
          <tr className="subhead">
            {judges.map((j) => (
              <ThSymbols key={j.id} />
            ))}
            <ThSymbols />
          </tr>
        </thead>
        <tbody>
          {round.athletes.length === 0 ? (
            <tr>
              <td colSpan={3 + judges.length * 3 + 8} className="empty">
                — ไม่มีนักกีฬาในรอบนี้ —
              </td>
            </tr>
          ) : (
            round.athletes.map((a) => {
              const cls = a.status === "DQ" ? "dq" : a.status === "DNF" ? "dnf" : "";
              return (
                <tr key={a.bib} className={cls}>
                  <td className="bib">{a.bib}</td>
                  <td className="name">{a.name}</td>
                  <td>{a.country}</td>
                  {judges.map((j) => {
                    const m = a.marks[j.id] ?? { yellowLifted: false, yellowBent: false, red: null };
                    const rcCls = m.red
                      ? m.red.state === "OVERRIDDEN"
                        ? "rc overridden"
                        : m.red.state === "PENDING"
                          ? "rc pending"
                          : "rc"
                      : "";
                    return (
                      <RedCells
                        key={j.id}
                        lift={m.yellowLifted}
                        bent={m.yellowBent}
                        rc={
                          m.red
                            ? m.red.state === "OVERRIDDEN"
                              ? `(${m.red.symbol})`
                              : m.red.symbol
                            : ""
                        }
                        rcCls={rcCls}
                      />
                    );
                  })}
                  <td className="tot">{a.totals.lifted || ""}</td>
                  <td className="tot">{a.totals.bent || ""}</td>
                  <td className={a.totals.red > 0 ? "tot rc" : "tot"}>{a.totals.red || ""}</td>
                  <td className="rank">{a.status === "OK" ? a.position ?? "" : ""}</td>
                  <td className="mono">{formatMs(a.finishMs)}</td>
                  <td>{a.status === "DQ" ? "DQ" : a.status === "DNF" ? "DNF" : a.finishMs ? "จบ" : ""}</td>
                  <td className="mono">{a.dq?.time ?? ""}</td>
                  <td className="offence">{a.dq?.offence ?? ""}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="legend">
        <strong>สัญลักษณ์:</strong>&nbsp; {SYM_LIFT} = ยกเท้า (loss of contact) &nbsp;|&nbsp; {SYM_BENT} =
        เข่างอ (bent knee) &nbsp;|&nbsp; RC = ใบแดง (Red Card) &nbsp;|&nbsp; ( ) = ใบแดงที่ถูกยกเลิก
      </div>

      <div className="signs">
        <div className="sign">
          <div className="line" />
          หัวหน้ากรรมการ / CHIEF JUDGE
        </div>
        <div className="sign">
          <div className="line" />
          ผู้ช่วยหัวหน้ากรรมการ / ASSISTANT CHIEF JUDGE
        </div>
        <div className="sign">
          <div className="line" />
          ผู้บันทึก / RECORDERS
        </div>
      </div>
    </section>
  );
}

function ThSymbols() {
  return (
    <>
      <th className="sym">{SYM_LIFT}</th>
      <th className="sym">{SYM_BENT}</th>
      <th className="sym">RC</th>
    </>
  );
}

function RedCells({
  lift,
  bent,
  rc,
  rcCls,
}: {
  lift: boolean;
  bent: boolean;
  rc: string;
  rcCls: string;
}) {
  return (
    <>
      <td className="mk">{lift ? SYM_LIFT : ""}</td>
      <td className="mk">{bent ? SYM_BENT : ""}</td>
      <td className={`mk ${rcCls}`}>{rc}</td>
    </>
  );
}

export default async function SummaryPrintPage(props: Props) {
  const { eventId } = await props.params;
  const { round: roundId } = await props.searchParams;

  const summary = await loadEventSummary(eventId, roundId);
  if (!summary) notFound();

  const xlsxHref = `/api/events/${eventId}/summary-xlsx${roundId ? `?round=${roundId}` : ""}`;

  return (
    <div id="summary-print" className="summary-root">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap"
      />
      <style>{CSS}</style>

      <div className="toolbar no-print">
        <PrintButton />
        <a className="tbtn" href={xlsxHref}>
          ⬇ ดาวน์โหลด Excel
        </a>
        <a className="tlink" href={`/admin/events/${eventId}/report`}>
          ← กลับไปหน้า Report
        </a>
        <span className="thint">เคล็ดลับ: ในกล่อง Print เลือกแนวกระดาษ “แนวนอน” (Landscape) เพื่อให้ตารางเต็มหน้า</span>
      </div>

      {summary.rounds.map((round) => (
        <RoundSheet key={round.id} ev={summary} round={round} />
      ))}

      {summary.rounds.length === 0 && (
        <section className="sheet">
          <div className="title">RACE WALKING JUDGES SUMMARY SHEET</div>
          <p className="empty" style={{ padding: 24 }}>
            {summary.name} — ยังไม่มีรอบการแข่งขัน
          </p>
        </section>
      )}
    </div>
  );
}

const CSS = `
.summary-root { font-family: 'Sarabun','Tahoma','Leelawadee UI',sans-serif; color:#0f172a; }
.toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:12px; padding:12px 16px; }
.toolbar .tbtn { background:#15803d; color:#fff; border-radius:8px; padding:8px 14px; font-size:14px; font-weight:600; text-decoration:none; }
.toolbar .tbtn:hover { background:#166534; }
.toolbar .tlink { color:#475569; font-size:13px; text-decoration:none; }
.toolbar .tlink:hover { text-decoration:underline; }
.toolbar .thint { color:#64748b; font-size:12px; }

.title { background:#0f172a; color:#fff; text-align:center; font-weight:700; font-size:15pt; padding:8px 6px; letter-spacing:.6px; }
.subtitle { text-align:center; font-weight:600; padding:5px; background:#eef2f7; font-size:11pt; border-bottom:1px solid #cbd5e1; }

table.info { width:100%; border-collapse:collapse; margin:8px 0 10px; font-size:9pt; table-layout:fixed; }
table.info td { border:1px solid #cbd5e1; padding:4px 8px; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; }
table.info td.k { background:#f1f5f9; font-weight:700; color:#334155; }

table.rwjs-grid { display:table; width:100%; border-collapse:collapse; table-layout:fixed; font-size:8pt; }
table.rwjs-grid th, table.rwjs-grid td { border:1px solid #94a3b8; padding:3px 2px; text-align:center; vertical-align:middle; overflow:hidden; line-height:1.25; }
table.rwjs-grid thead th { background:#e8edf3; font-weight:700; font-size:7.6pt; }
table.rwjs-grid thead tr:first-child th { height:36px; padding:2px 3px; }
table.rwjs-grid thead tr.subhead th { height:15px; }
table.rwjs-grid th.sym { font-size:8.5pt; }
table.rwjs-grid th.jhead { line-height:1.15; }
table.rwjs-grid th.jhead .jname { display:block; font-size:7.4pt; }
table.rwjs-grid th.jhead .zone { display:block; font-weight:500; font-size:6.8pt; color:#475569; margin-top:1px; }
table.rwjs-grid tbody td { height:23px; }
table.rwjs-grid tbody tr:nth-child(even) td { background:#f8fafc; }
table.rwjs-grid td.name { text-align:left; padding-left:7px; font-weight:600; white-space:nowrap; text-overflow:ellipsis; }
table.rwjs-grid td.bib { font-weight:700; }
table.rwjs-grid td.mono { font-variant-numeric:tabular-nums; letter-spacing:.2px; }
table.rwjs-grid td.mk { font-size:8.6pt; }
table.rwjs-grid td.tot { font-weight:600; background:#fbfdff; }
table.rwjs-grid td.offence { font-size:7.6pt; letter-spacing:1px; }
table.rwjs-grid tbody tr.dq td { background:#fef2f2; color:#b91c1c; }
table.rwjs-grid tbody tr.dnf td { background:#fffbeb; color:#b45309; }
table.rwjs-grid td.empty, p.empty { color:#94a3b8; font-style:italic; }
.rc { font-weight:700; color:#b91c1c; }
.rc.pending { color:#c2410c; }
.rc.overridden { color:#94a3b8; text-decoration:line-through; font-weight:400; }
table.rwjs-grid tbody tr.dq td.rc { color:#991b1b; }

.legend { font-size:8pt; color:#475569; margin-top:8px; padding:5px 8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; }
.signs { display:flex; gap:36px; margin-top:30px; padding:0 10px; }
.sign { flex:1; text-align:center; font-size:8.6pt; font-weight:600; color:#334155; }
.sign .line { border-top:1px solid #475569; margin:0 6px 6px; padding-top:24px; }

@media screen {
  .summary-root { background:#eef2f7; min-height:100vh; padding-bottom:24px; }
  .sheet { background:#fff; max-width:1180px; margin:0 auto 24px; padding:22px 26px 26px; box-shadow:0 1px 10px rgba(15,23,42,.14); border-radius:8px; }
}

@page { size: A4 landscape; margin: 9mm; }

@media print {
  body * { visibility:hidden; }
  #summary-print, #summary-print * { visibility:visible; }
  #summary-print { position:absolute; left:0; top:0; width:100%; }
  .no-print { display:none !important; }
  .sheet { page-break-after:always; box-shadow:none; margin:0; padding:0; max-width:none; }
  .sheet:last-child { page-break-after:auto; }
  table.rwjs-grid thead { display:table-header-group; }
  table.rwjs-grid tbody tr { page-break-inside:avoid; }
}
`;
