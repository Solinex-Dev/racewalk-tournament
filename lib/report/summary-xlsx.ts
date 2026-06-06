/**
 * Excel (.xlsx) generator for the official Race Walking Judges Summary Sheet.
 * One worksheet per round — reproduces the World Athletics RWJS form layout
 * (plain title, judge columns with Yellow Paddle ~/</RC, Penalty Zone, Chief
 * Judge, DQ notification, CHECK OF / YELLOW PADDLES / DISQUALIFICATIONS totals,
 * CHECK·TOTAL row and signatures). White fills, black borders — no dark labels.
 *
 * Server-only — imports exceljs (Node runtime).
 */
import ExcelJS from "exceljs";
import {
  type EventSummary,
  type RoundSummary,
} from "@/lib/report/summary-sheet";
import { bangkokDateThai } from "@/lib/datetime";

const BASE_FONT = "Tahoma"; // ships with Windows, renders Thai cleanly
const JUDGE_SLOTS = 8; // the official form has 8 judge columns

const COLOR = {
  ink: "FF000000",
  muted: "FF595959",
  headFill: "FFF2F2F2",
  border: "FF000000",
  red: "FFC00000",
  amber: "FFB45309",
  pending: "FFC55A11",
} as const;

const ROUND_STATUS_TH: Record<RoundSummary["status"], string> = {
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังแข่งขัน",
  FINISHED: "เสร็จสิ้น",
};

const THIN = { style: "thin" as const, color: { argb: COLOR.border } };
const ALL_BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function thaiDate(d: Date): string {
  return bangkokDateThai(d); // Asia/Bangkok (+07)
}

function safeSheetName(name: string, used: Set<string>): string {
  const base = name.replaceAll(/[[\]*?/\\:]/g, " ").trim().slice(0, 28) || "Round";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 24)} (${i++})`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function buildRoundWorksheet(
  ws: ExcelJS.Worksheet,
  ev: Pick<EventSummary, "name" | "date" | "location">,
  round: RoundSummary,
): void {
  const judges = round.judges;
  const J = Math.max(JUDGE_SLOTS, judges.length);

  // ── column map ─────────────────────────────────────────────────────────────
  let c = 1;
  const C_ATH = c++;
  const C_JUDGE0 = c;
  c = C_JUDGE0 + J * 3;
  const C_PEN_IN = c++;
  const C_PEN_OUT = c++;
  const C_CHIEF_T = c++;
  const C_CHIEF_O = c++;
  const C_DQ_T = c++;
  const C_TOT_LIFT = c++;
  const C_TOT_BENT = c++;
  const C_TOT_RC = c++;
  const LAST = c - 1;
  const jcol = (j: number) => C_JUDGE0 + j * 3; // ~ ; +1 < ; +2 RC

  // ── widths ───────────────────────────────────────────────────────────────────
  ws.getColumn(C_ATH).width = 15; // BIB only — just fits the "CHECK · TOTAL" label
  for (let j = 0; j < J; j++) {
    ws.getColumn(jcol(j)).width = 4;
    ws.getColumn(jcol(j) + 1).width = 4;
    ws.getColumn(jcol(j) + 2).width = 4.5;
  }
  ws.getColumn(C_PEN_IN).width = 7;
  ws.getColumn(C_PEN_OUT).width = 7;
  ws.getColumn(C_CHIEF_T).width = 8;
  // Offence holds the DQ rule code (e.g. "TR7.1[TR6.3.1]") when set, else symbols.
  ws.getColumn(C_CHIEF_O).width = 14;
  // DQ / CHECK OF / YELLOW PADDLES / DISQUAL. — vertical-text headers (narrow)
  ws.getColumn(C_DQ_T).width = 6;
  ws.getColumn(C_TOT_LIFT).width = 6;
  ws.getColumn(C_TOT_BENT).width = 6;
  ws.getColumn(C_TOT_RC).width = 6;

  // ── helpers ──────────────────────────────────────────────────────────────────
  const head = (
    row: number,
    col: number,
    text: ExcelJS.CellValue,
    opts: { size?: number; fill?: boolean; rotate?: number } = {},
  ) => {
    const cell = ws.getCell(row, col);
    cell.value = text;
    cell.font = { name: BASE_FONT, bold: true, size: opts.size ?? 8, color: { argb: COLOR.ink } };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
      textRotation: opts.rotate,
    };
    if (opts.fill !== false) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.headFill } };
    }
    cell.border = ALL_BORDER;
    return cell;
  };

  // ── title (plain — no dark fill) ───────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, LAST);
  const title = ws.getCell(1, 1);
  title.value = "RACE WALKING JUDGES SUMMARY SHEET";
  title.font = { name: BASE_FONT, bold: true, size: 16, color: { argb: COLOR.ink } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  title.border = ALL_BORDER;
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, LAST);
  const sub = ws.getCell(2, 1);
  sub.value = "ใบสรุปผลการตัดสินของกรรมการ — การแข่งขันเดินทน";
  sub.font = { name: BASE_FONT, bold: true, size: 10, color: { argb: COLOR.ink } };
  sub.alignment = { vertical: "middle", horizontal: "center" };
  sub.border = ALL_BORDER;
  ws.getRow(2).height = 16;

  // ── info band (DATE | START TIME | EVENT | CHIEF JUDGE) ─────────────────────────
  const dateEnd = Math.min(6, LAST);
  const startEnd = Math.min(dateEnd + 4, LAST);
  const chiefStart = Math.max(startEnd + 2, LAST - 6);
  const eventEnd = chiefStart - 1;
  const eventStart = startEnd + 1;

  const infoLabel = (col1: number, col2: number, text: string) => {
    ws.mergeCells(3, col1, 3, col2);
    const cell = ws.getCell(3, col1);
    cell.value = text;
    cell.font = { name: BASE_FONT, bold: true, size: 8, color: { argb: COLOR.ink } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.headFill } };
    cell.border = ALL_BORDER;
  };
  const infoValue = (col1: number, col2: number, text: string, mono = false) => {
    ws.mergeCells(4, col1, 4, col2);
    const cell = ws.getCell(4, col1);
    cell.value = text;
    cell.font = { name: BASE_FONT, size: mono ? 10 : 9, color: { argb: COLOR.ink } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = ALL_BORDER;
  };

  infoLabel(C_ATH, dateEnd, "DATE / วันที่");
  infoLabel(dateEnd + 1, startEnd, "START TIME");
  infoLabel(eventStart, eventEnd, "รายการ");
  infoLabel(chiefStart, LAST, "CHIEF JUDGE / หัวหน้ากรรมการ");
  infoValue(C_ATH, dateEnd, thaiDate(ev.date));
  infoValue(dateEnd + 1, startEnd, round.startTime || "—", true);
  infoValue(
    eventStart,
    eventEnd,
    `${round.name}  •  ${ROUND_STATUS_TH[round.status]}`,
  );
  infoValue(chiefStart, LAST, round.chiefJudge || "—");
  ws.getRow(3).height = 16;
  ws.getRow(4).height = 18;

  // ── column headers (rows 5–8) ───────────────────────────────────────────────────
  const H1 = 5;
  const H4 = 8;
  ws.getRow(H1).height = 54; // tall enough for the vertical-text headers
  ws.getRow(6).height = 16;
  ws.getRow(7).height = 18;
  ws.getRow(8).height = 14;

  // Athlete identity column
  ws.mergeCells(H1, C_ATH, H4, C_ATH);
  head(H1, C_ATH, "หมายเลข\nBIB", { size: 8 });
  ws.getCell(H1, C_ATH).alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  // Judge columns
  for (let j = 0; j < J; j++) {
    const start = jcol(j);
    // name (row 5, tall)
    ws.mergeCells(H1, start, H1, start + 2);
    head(H1, start, judges[j]?.name ?? "", { size: 8 });
    ws.getCell(H1, start).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    // number (row 6)
    ws.mergeCells(6, start, 6, start + 2);
    head(6, start, j + 1, { size: 9 });
    // Yellow Paddle (row 7, over ~/<) + RC (rows 7–8)
    ws.mergeCells(7, start, 7, start + 1);
    head(7, start, "Yellow Paddle", { size: 7 });
    ws.mergeCells(7, start + 2, 8, start + 2);
    head(7, start + 2, "RC", { size: 8 });
    // ~ / < (row 8)
    head(8, start, "~", { size: 9 });
    head(8, start + 1, "<", { size: 9 });
  }

  // Right-side groups: label spans rows 5–6, sub spans rows 7–8.
  const group2 = (col1: number, col2: number, label: string) => {
    ws.mergeCells(H1, col1, 6, col2);
    head(H1, col1, label, { size: 7 });
  };
  const sub2 = (col: number, label: string, size = 8) => {
    ws.mergeCells(7, col, 8, col);
    head(7, col, label, { size });
  };
  // Vertical single-label header spanning all four header rows — mirrors the
  // PDF's rotated DQ / CHECK OF / YELLOW PADDLES / DISQUAL. columns.
  const vhead = (col: number, label: string) => {
    ws.mergeCells(H1, col, H4, col);
    const cell = ws.getCell(H1, col);
    cell.value = label;
    cell.font = { name: BASE_FONT, bold: true, size: 7, color: { argb: COLOR.ink } };
    cell.alignment = { vertical: "middle", horizontal: "center", textRotation: 90 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.headFill } };
    cell.border = ALL_BORDER;
  };
  group2(C_PEN_IN, C_PEN_OUT, "Penalty Zone");
  sub2(C_PEN_IN, "Entrance");
  sub2(C_PEN_OUT, "Exit");
  group2(C_CHIEF_T, C_CHIEF_O, "Chief Judge");
  sub2(C_CHIEF_T, "Time");
  sub2(C_CHIEF_O, "Offence");
  vhead(C_DQ_T, "DQ notif. Time");
  vhead(C_TOT_LIFT, "CHECK OF");
  vhead(C_TOT_BENT, "YELLOW PADDLES");
  vhead(C_TOT_RC, "DISQUAL. RC");

  // ── athlete rows ─────────────────────────────────────────────────────────────
  let r = H4 + 1;
  for (const a of round.athletes) {
    ws.getRow(r).height = 16;
    const isDq = a.status === "DQ";
    const isDnf = a.status === "DNF";
    const nonDqInk = isDnf ? COLOR.amber : COLOR.ink;
    const ink = isDq ? COLOR.red : nonDqInk;

    const cell = (col: number, value: ExcelJS.CellValue, align: "left" | "center" = "center") => {
      const cc = ws.getCell(r, col);
      cc.value = value;
      cc.font = { name: BASE_FONT, size: 9, color: { argb: ink } };
      cc.alignment = { vertical: "middle", horizontal: align };
      cc.border = ALL_BORDER;
      return cc;
    };

    const ath = cell(C_ATH, a.bib, "left");
    ath.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ath.font = { name: BASE_FONT, size: 9, bold: true, color: { argb: ink } };

    for (let j = 0; j < J; j++) {
      const start = jcol(j);
      const m = judges[j] ? a.marks[judges[j].id] : undefined;
      cell(start, m?.yellowLifted ? "✓" : "");
      cell(start + 1, m?.yellowBent ? "✓" : "");
      const rc = cell(start + 2, "");
      if (m?.red) {
        const { symbol, state } = m.red;
        if (state === "OVERRIDDEN") {
          rc.value = `(${symbol})`;
          rc.font = { name: BASE_FONT, size: 8, color: { argb: COLOR.muted }, strike: true };
        } else {
          rc.value = symbol;
          rc.font = {
            name: BASE_FONT,
            size: 10,
            bold: true,
            color: { argb: state === "CONFIRMED" ? COLOR.red : COLOR.pending },
          };
        }
      }
    }

    cell(C_PEN_IN, "");
    cell(C_PEN_OUT, "");
    cell(C_CHIEF_T, isDq ? a.dq?.time ?? "" : "");
    cell(C_CHIEF_O, isDq ? a.dq?.offence ?? "" : "");
    cell(C_DQ_T, isDq ? a.dq?.time ?? "" : "");
    cell(C_TOT_LIFT, a.totals.lifted || "");
    cell(C_TOT_BENT, a.totals.bent || "");
    const rcTot = cell(C_TOT_RC, a.totals.red || "");
    if (a.totals.red > 0)
      rcTot.font = { name: BASE_FONT, size: 10, bold: true, color: { argb: COLOR.red } };

    r++;
  }

  if (round.athletes.length === 0) {
    ws.mergeCells(r, 1, r, LAST);
    const empty = ws.getCell(r, 1);
    empty.value = "— ไม่มีนักกีฬาในรอบนี้ —";
    empty.font = { name: BASE_FONT, italic: true, size: 10, color: { argb: COLOR.muted } };
    empty.alignment = { vertical: "middle", horizontal: "center" };
    empty.border = ALL_BORDER;
    r++;
  }

  // ── CHECK / TOTAL row (per-judge column tallies + grand totals) ──────────────────
  const totalRow = r;
  ws.getRow(totalRow).height = 18;
  const totCell = (col: number, value: ExcelJS.CellValue) => {
    const cc = ws.getCell(totalRow, col);
    cc.value = value;
    cc.font = { name: BASE_FONT, bold: true, size: 9, color: { argb: COLOR.ink } };
    cc.alignment = { vertical: "middle", horizontal: "center" };
    cc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.headFill } };
    cc.border = ALL_BORDER;
    return cc;
  };
  totCell(C_ATH, "CHECK · TOTAL");
  ws.getCell(totalRow, C_ATH).alignment = { vertical: "middle", horizontal: "center" };
  for (let j = 0; j < J; j++) {
    const jd = judges[j];
    const lift = jd ? round.athletes.filter((a) => a.marks[jd.id]?.yellowLifted).length : 0;
    const bent = jd ? round.athletes.filter((a) => a.marks[jd.id]?.yellowBent).length : 0;
    const rc = jd
      ? round.athletes.filter((a) => a.marks[jd.id]?.red && a.marks[jd.id].red!.state !== "OVERRIDDEN").length
      : 0;
    totCell(jcol(j), lift || "");
    totCell(jcol(j) + 1, bent || "");
    totCell(jcol(j) + 2, rc || "");
  }
  totCell(C_PEN_IN, "");
  totCell(C_PEN_OUT, "");
  totCell(C_CHIEF_T, "");
  totCell(C_CHIEF_O, "");
  totCell(C_DQ_T, "");
  totCell(C_TOT_LIFT, round.athletes.reduce((n, a) => n + a.totals.lifted, 0) || "");
  totCell(C_TOT_BENT, round.athletes.reduce((n, a) => n + a.totals.bent, 0) || "");
  totCell(C_TOT_RC, round.athletes.reduce((n, a) => n + a.totals.red, 0) || "");
  r = totalRow + 1;

  // ── signatures ────────────────────────────────────────────────────────────────
  r += 2;
  const half = Math.floor(LAST / 2);
  const sigBlocks = [
    { label: "ASSISTANTS CHIEF JUDGE\nผู้ช่วยหัวหน้ากรรมการ", start: 1, end: half - 1 },
    { label: "RECORDERS\nผู้บันทึก", start: half + 1, end: LAST },
  ];
  for (const blk of sigBlocks) {
    const line = ws.getCell(r, blk.start);
    line.value = "____________________________";
    line.font = { name: BASE_FONT, size: 9, color: { argb: COLOR.muted } };
    line.alignment = { horizontal: "center" };
    if (blk.end > blk.start) ws.mergeCells(r, blk.start, r, blk.end);
    const cap = ws.getCell(r + 1, blk.start);
    cap.value = blk.label;
    cap.font = { name: BASE_FONT, size: 8, bold: true, color: { argb: COLOR.ink } };
    cap.alignment = { horizontal: "center", wrapText: true, vertical: "top" };
    if (blk.end > blk.start) ws.mergeCells(r + 1, blk.start, r + 1, blk.end);
  }
  ws.getRow(r + 1).height = 28;

  // ── view + print ───────────────────────────────────────────────────────────────
  ws.views = [{ state: "frozen", xSplit: C_ATH, ySplit: H4 }];
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    printTitlesRow: `1:${H4}`,
  };
}

/** Builds the full-event workbook: one worksheet per round. */
export async function buildSummaryWorkbook(summary: EventSummary): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Racewalk Tournament";
  wb.created = summary.date;

  const used = new Set<string>();
  if (summary.rounds.length === 0) {
    const ws = wb.addWorksheet("No rounds");
    ws.getCell(1, 1).value = `${summary.name} — ยังไม่มีรอบการแข่งขัน`;
    return wb;
  }

  for (const round of summary.rounds) {
    const ws = wb.addWorksheet(safeSheetName(round.name, used), {
      pageSetup: { orientation: "landscape", fitToPage: true },
    });
    buildRoundWorksheet(ws, summary, round);
  }

  return wb;
}
