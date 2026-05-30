import { Fragment } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PrintButton } from "@/components/report/print-button";
import {
  loadEventSummary,
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

const JUDGE_SLOTS = 8;
const SYM_LIFT = "~";
const SYM_BENT = "<";
const TICK = "✓";

const ROUND_STATUS_TH: Record<RoundSummary["status"], string> = {
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังแข่งขัน",
  FINISHED: "เสร็จสิ้น",
};

function thaiDate(d: Date): string {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function RoundSheet({ ev, round }: { ev: EventSummary; round: RoundSummary }) {
  const J = Math.max(JUDGE_SLOTS, round.judges.length);
  const slots = Array.from({ length: J }, (_, i) => round.judges[i] ?? null);

  // per-judge column tallies for the CHECK·TOTAL row
  const tally = slots.map((j) => {
    if (!j) return { lift: 0, bent: 0, rc: 0 };
    return {
      lift: round.athletes.filter((a) => a.marks[j.id]?.yellowLifted).length,
      bent: round.athletes.filter((a) => a.marks[j.id]?.yellowBent).length,
      rc: round.athletes.filter(
        (a) => a.marks[j.id]?.red && a.marks[j.id]!.red!.state !== "OVERRIDDEN",
      ).length,
    };
  });
  const grand = {
    lift: round.athletes.reduce((n, a) => n + a.totals.lifted, 0),
    bent: round.athletes.reduce((n, a) => n + a.totals.bent, 0),
    rc: round.athletes.reduce((n, a) => n + a.totals.red, 0),
  };

  const totalCols = 1 + J * 3 + 2 + 2 + 1 + 3;

  return (
    <section className="sheet">
      <div className="title">RACE WALKING JUDGES SUMMARY SHEET</div>
      <div className="subtitle">ใบสรุปผลการตัดสินของกรรมการ — การแข่งขันเดินทน</div>

      <table className="info">
        <colgroup>
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="k">DATE / วันที่</td>
            <td>{thaiDate(ev.date)}</td>
            <td className="k">START TIME</td>
            <td>{round.startTime || "—"}</td>
            <td className="k">CHIEF JUDGE</td>
            <td>{round.chiefJudge || "—"}</td>
          </tr>
          <tr>
            <td className="k">EVENT / รายการ</td>
            <td colSpan={3}>
              {ev.name} — {round.name}
              {round.heatName ? ` (${round.heatName})` : ""}
            </td>
            <td className="k">STATUS</td>
            <td>
              {ROUND_STATUS_TH[round.status]}
              {round.distanceKm ? ` • ${round.distanceKm} กม.` : ""}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="rwjs-grid">
        <colgroup>
          <col style={{ width: "13%" }} />
          {slots.map((_, i) => (
            <Fragment key={i}>
              <col style={{ width: "2.3%" }} />
              <col style={{ width: "2.3%" }} />
              <col style={{ width: "2.6%" }} />
            </Fragment>
          ))}
          <col style={{ width: "4%" }} />
          <col style={{ width: "4%" }} />
          <col style={{ width: "4.5%" }} />
          <col style={{ width: "5.5%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "3.2%" }} />
          <col style={{ width: "3.2%" }} />
          <col style={{ width: "3.6%" }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={3}>
              หมายเลข / นักกีฬา
              <br />
              Athlete
            </th>
            {slots.map((j, i) => (
              <th key={i} colSpan={3} className="jhead">
                <span className="jnum">{i + 1}</span>
                {j ? (
                  <>
                    <br />
                    <span className="jname">{j.name}</span>
                  </>
                ) : null}
              </th>
            ))}
            <th colSpan={2}>Penalty Zone</th>
            <th colSpan={2}>Chief Judge</th>
            <th rowSpan={3}>
              DQ notif.
              <br />
              Time
            </th>
            <th rowSpan={3}>
              CHECK OF
              <br />
              {SYM_LIFT}
            </th>
            <th rowSpan={3}>
              YELLOW PADDLES
              <br />
              {SYM_BENT}
            </th>
            <th rowSpan={3}>
              DISQUAL.
              <br />
              RC
            </th>
          </tr>
          <tr>
            {slots.map((_, i) => (
              <Fragment key={i}>
                <th colSpan={2}>Yellow Paddle</th>
                <th rowSpan={2}>RC</th>
              </Fragment>
            ))}
            <th rowSpan={2}>Entrance</th>
            <th rowSpan={2}>Exit</th>
            <th rowSpan={2}>Time</th>
            <th rowSpan={2}>Offence</th>
          </tr>
          <tr>
            {slots.map((_, i) => (
              <Fragment key={i}>
                <th>{SYM_LIFT}</th>
                <th>{SYM_BENT}</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {round.athletes.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="empty">
                — ไม่มีนักกีฬาในรอบนี้ —
              </td>
            </tr>
          ) : (
            round.athletes.map((a) => {
              const cls = a.status === "DQ" ? "dq" : a.status === "DNF" ? "dnf" : "";
              return (
                <tr key={a.bib} className={cls}>
                  <td className="name">
                    <span className="mono">{a.bib}</span> {a.name}
                  </td>
                  {slots.map((j, i) => {
                    const m = j ? a.marks[j.id] : undefined;
                    const rcCls = m?.red
                      ? m.red.state === "OVERRIDDEN"
                        ? "rc overridden"
                        : m.red.state === "PENDING"
                          ? "rc pending"
                          : "rc"
                      : "";
                    return (
                      <Fragment key={i}>
                        <td>{m?.yellowLifted ? TICK : ""}</td>
                        <td>{m?.yellowBent ? TICK : ""}</td>
                        <td className={rcCls}>
                          {m?.red
                            ? m.red.state === "OVERRIDDEN"
                              ? `(${m.red.symbol})`
                              : m.red.symbol
                            : ""}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td />
                  <td />
                  <td className="mono">{a.status === "DQ" ? a.dq?.time ?? "" : ""}</td>
                  <td>{a.status === "DQ" ? a.dq?.offence ?? "" : ""}</td>
                  <td className="mono">{a.status === "DQ" ? a.dq?.time ?? "" : ""}</td>
                  <td>{a.totals.lifted || ""}</td>
                  <td>{a.totals.bent || ""}</td>
                  <td className={a.totals.red > 0 ? "rc" : ""}>{a.totals.red || ""}</td>
                </tr>
              );
            })
          )}
        </tbody>
        {round.athletes.length > 0 && (
          <tfoot>
            <tr className="total">
              <td className="name">CHECK · TOTAL</td>
              {tally.map((t, i) => (
                <Fragment key={i}>
                  <td>{t.lift || ""}</td>
                  <td>{t.bent || ""}</td>
                  <td>{t.rc || ""}</td>
                </Fragment>
              ))}
              <td />
              <td />
              <td />
              <td />
              <td />
              <td>{grand.lift || ""}</td>
              <td>{grand.bent || ""}</td>
              <td>{grand.rc || ""}</td>
            </tr>
          </tfoot>
        )}
      </table>

      <div className="signs">
        <div className="sign">
          <div className="line" />
          ASSISTANTS CHIEF JUDGE / ผู้ช่วยหัวหน้ากรรมการ
        </div>
        <div className="sign">
          <div className="line" />
          RECORDERS / ผู้บันทึก
        </div>
      </div>
    </section>
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

.title { text-align:center; font-weight:700; font-size:15pt; padding:6px; letter-spacing:.4px; border:1.5px solid #000; border-bottom:none; }
.subtitle { text-align:center; font-weight:600; padding:4px; font-size:10.5pt; border:1.5px solid #000; border-top:none; }

table.info { width:100%; border-collapse:collapse; margin:6px 0 8px; font-size:9pt; table-layout:fixed; }
table.info td { border:1px solid #000; padding:3px 7px; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; }
table.info td.k { background:#f2f2f2; font-weight:700; }

table.rwjs-grid { display:table; width:100%; border-collapse:collapse; table-layout:fixed; font-size:7pt; }
table.rwjs-grid th, table.rwjs-grid td { border:1px solid #000; padding:1.5px 1px; text-align:center; vertical-align:middle; overflow:hidden; line-height:1.15; }
table.rwjs-grid thead th { background:#f2f2f2; font-weight:700; font-size:6.6pt; }
table.rwjs-grid thead { display:table-header-group; }
table.rwjs-grid th.jhead .jnum { font-size:8pt; }
table.rwjs-grid th.jhead .jname { font-weight:500; font-size:6pt; }
table.rwjs-grid th.hide { border:none; background:transparent; padding:0; }
table.rwjs-grid td.name { text-align:left; white-space:nowrap; font-weight:600; padding-left:4px; font-size:7pt; }
table.rwjs-grid td.mono, table.rwjs-grid .mono { font-variant-numeric:tabular-nums; }
table.rwjs-grid tbody tr.dq td { color:#c00000; }
table.rwjs-grid tbody tr.dnf td { color:#b45309; }
table.rwjs-grid td.empty, p.empty { color:#94a3b8; font-style:italic; }
table.rwjs-grid tfoot td { background:#f2f2f2; font-weight:700; }
.rc { font-weight:700; color:#c00000; font-size:8pt; }
.rc.pending { color:#c55a11; }
.rc.overridden { color:#94a3b8; text-decoration:line-through; font-weight:400; }

.signs { display:flex; gap:48px; margin-top:46px; padding:0 10px; }
.sign { flex:1; text-align:center; font-size:8.2pt; font-weight:600; color:#334155; }
/* empty signing space above, the line at the bottom, caption right beneath it */
.sign .line { border-bottom:1px solid #000; margin:0 8px 3px; padding-top:30px; }

@media screen {
  .summary-root { background:#eef2f7; min-height:100vh; padding-bottom:24px; }
  .sheet { background:#fff; max-width:1200px; margin:0 auto 22px; padding:20px 22px 24px; box-shadow:0 1px 10px rgba(15,23,42,.14); border-radius:6px; }
}

/* Explicit landscape A4 (297×210mm) — more reliable than the "A4 landscape"
   keyword, so the wide table is never squeezed into portrait width. */
@page { size: 297mm 210mm; margin: 6mm; }

@media print {
  html, body { background:#fff !important; }
  body * { visibility:hidden; }
  /* The admin sidebar is hidden via visibility but still reserves ~16rem of layout
     width, which pushed the absolutely-positioned sheet to the right. Remove it
     from layout so the sheet sits flush against the page's left margin. */
  [data-slot="sidebar"] { display:none !important; }
  #summary-print, #summary-print * { visibility:visible; }
  /* force backgrounds + borders to print even when "Background graphics" is off */
  #summary-print {
    position:absolute; left:0; top:0; width:100%;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .no-print { display:none !important; }
  .sheet { page-break-after:always; box-shadow:none; margin:0; padding:0; max-width:none; }
  .sheet:last-child { page-break-after:auto; }

  /* Shrink so the whole table fits the landscape page width WITHOUT the browser
     down-scaling it (down-scaling is what makes the 1px gridlines disappear). */
  .title { font-size:13pt; }
  .subtitle { font-size:9pt; }
  table.info { font-size:7.5pt; }
  table.rwjs-grid { font-size:5.6pt; }
  table.rwjs-grid thead th { font-size:5.2pt; }
  table.rwjs-grid th, table.rwjs-grid td { padding:0.5px 0.5px; }
  table.rwjs-grid th.jhead .jname { font-size:4.8pt; }
  .rc, .rc.pending { font-size:6.4pt; }
  /* keep gridlines crisp & black */
  table.rwjs-grid th, table.rwjs-grid td, table.info td { border:0.5pt solid #000 !important; }

  table.rwjs-grid thead { display:table-header-group; }
  table.rwjs-grid tbody tr { page-break-inside:avoid; }
  .signs { margin-top:36px; }
}
`;
