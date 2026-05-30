/**
 * Excel (.xlsx) generator for the official Race Walking Judges Summary Sheet.
 * One worksheet per round (mirrors the sample workbook which has a sheet per race).
 *
 * Server-only — imports exceljs (Node runtime).
 */
import ExcelJS from "exceljs";
import {
  formatMs,
  type EventSummary,
  type RoundSummary,
} from "@/lib/report/summary-sheet";

const BASE_FONT = "Tahoma"; // ships with Windows, renders Thai cleanly

const COLOR = {
  ink: "FF0F172A",
  muted: "FF475569",
  label: "FF334155",
  headFill: "FFE2E8F0",
  titleFill: "FF0F172A",
  subFill: "FFF1F5F9",
  border: "FF94A3B8",
  red: "FFB91C1C",
  amber: "FFB45309",
  pending: "FFC2410C",
  zebra: "FFF8FAFC",
} as const;

const ROUND_STATUS_TH: Record<RoundSummary["status"], string> = {
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังแข่งขัน",
  FINISHED: "เสร็จสิ้น",
};

const THIN = { style: "thin" as const, color: { argb: COLOR.border } };
const ALL_BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function thaiDate(d: Date): string {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

/** Excel sheet names: ≤31 chars, no []*?/\ ; deduped by caller via `used`. */
function safeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[[\]*?/\\:]/g, " ").trim().slice(0, 28) || "Round";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 24)} (${i++})`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Distribute labelled key/value segments evenly across the full table width. */
function infoBand(
  ws: ExcelJS.Worksheet,
  row: number,
  lastCol: number,
  segments: { label: string; value: string }[],
) {
  const per = Math.max(1, Math.floor(lastCol / segments.length));
  let start = 1;
  segments.forEach((seg, i) => {
    const end = i === segments.length - 1 ? lastCol : start + per - 1;
    const cell = ws.getCell(row, start);
    cell.value = {
      richText: [
        { text: `${seg.label}:  `, font: { name: BASE_FONT, bold: true, size: 9, color: { argb: COLOR.label } } },
        { text: seg.value || "—", font: { name: BASE_FONT, size: 10, color: { argb: COLOR.ink } } },
      ],
    };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.subFill } };
    cell.border = ALL_BORDER;
    if (end > start) ws.mergeCells(row, start, row, end);
    start = end + 1;
  });
  ws.getRow(row).height = 20;
}

/**
 * Renders one round onto `ws` in the official Summary-Sheet layout and returns
 * the index of the last column used.
 */
export function buildRoundWorksheet(
  ws: ExcelJS.Worksheet,
  ev: Pick<EventSummary, "name" | "date" | "location">,
  round: RoundSummary,
): void {
  const judges = round.judges;

  // ── column map ─────────────────────────────────────────────────────────────
  let c = 1;
  const C = {
    bib: c++,
    name: c++,
    country: c++,
    judgeStart: c,
  };
  c = C.judgeStart + judges.length * 3;
  const COLS = {
    ...C,
    sumLifted: c++,
    sumBent: c++,
    sumRed: c++,
    rank: c++,
    finish: c++,
    status: c++,
    dqTime: c++,
    offence: c++,
  };
  const LAST = COLS.offence;
  const judgeCol = (j: number) => COLS.judgeStart + j * 3; // → lifted; +1 bent; +2 rc

  // ── column widths ────────────────────────────────────────────────────────────
  ws.getColumn(COLS.bib).width = 6;
  ws.getColumn(COLS.name).width = 24;
  ws.getColumn(COLS.country).width = 8;
  for (let j = 0; j < judges.length; j++) {
    ws.getColumn(judgeCol(j)).width = 4.5;
    ws.getColumn(judgeCol(j) + 1).width = 4.5;
    ws.getColumn(judgeCol(j) + 2).width = 5;
  }
  ws.getColumn(COLS.sumLifted).width = 5;
  ws.getColumn(COLS.sumBent).width = 5;
  ws.getColumn(COLS.sumRed).width = 5;
  ws.getColumn(COLS.rank).width = 6;
  ws.getColumn(COLS.finish).width = 12;
  ws.getColumn(COLS.status).width = 8;
  ws.getColumn(COLS.dqTime).width = 9;
  ws.getColumn(COLS.offence).width = 12;

  // ── title ────────────────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, LAST);
  const title = ws.getCell(1, 1);
  title.value = "RACE WALKING JUDGES SUMMARY SHEET";
  title.font = { name: BASE_FONT, bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.titleFill } };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, LAST);
  const sub = ws.getCell(2, 1);
  sub.value = "ใบสรุปผลการตัดสินของกรรมการ — การแข่งขันเดินทน";
  sub.font = { name: BASE_FONT, bold: true, size: 11, color: { argb: COLOR.ink } };
  sub.alignment = { vertical: "middle", horizontal: "center" };
  sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.subFill } };
  ws.getRow(2).height = 18;

  // ── info bands ───────────────────────────────────────────────────────────────
  infoBand(ws, 3, LAST, [
    { label: "รายการ / EVENT", value: `${ev.name} — ${round.name}${round.heatName ? ` (${round.heatName})` : ""}` },
  ]);
  infoBand(ws, 4, LAST, [
    { label: "วันที่ / DATE", value: thaiDate(ev.date) },
    { label: "เวลาเริ่ม / START", value: round.startTime || "—" },
    { label: "ระยะ / DISTANCE", value: round.distanceKm ? `${round.distanceKm} กม.` : "—" },
    { label: "สถานะ / STATUS", value: ROUND_STATUS_TH[round.status] },
  ]);
  infoBand(ws, 5, LAST, [
    { label: "สถานที่ / VENUE", value: ev.location },
    { label: "หัวหน้ากรรมการ / CHIEF JUDGE", value: round.chiefJudge },
    { label: "ผู้บันทึกเวลา / RECORDERS", value: round.recorders.join(", ") },
  ]);

  // ── table header (rows 6–7) ──────────────────────────────────────────────────
  const H1 = 6;
  const H2 = 7;
  ws.getRow(H1).height = 30;
  ws.getRow(H2).height = 16;

  const setHead = (cell: ExcelJS.Cell, text: string, opts: { size?: number; color?: string } = {}) => {
    cell.value = text;
    cell.font = { name: BASE_FONT, bold: true, size: opts.size ?? 9, color: { argb: opts.color ?? COLOR.ink } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.headFill } };
    cell.border = ALL_BORDER;
  };

  // left identity columns span both header rows
  ws.mergeCells(H1, COLS.bib, H2, COLS.bib);
  setHead(ws.getCell(H1, COLS.bib), "หมายเลข\nBIB");
  ws.mergeCells(H1, COLS.name, H2, COLS.name);
  setHead(ws.getCell(H1, COLS.name), "นักกีฬา / ATHLETE");
  ws.mergeCells(H1, COLS.country, H2, COLS.country);
  setHead(ws.getCell(H1, COLS.country), "ประเทศ");

  // judge group headers
  judges.forEach((j, idx) => {
    const start = judgeCol(idx);
    ws.mergeCells(H1, start, H1, start + 2);
    const label = `${idx + 1}. ${j.name}${j.zone ? `\n(${j.zone})` : ""}`;
    setHead(ws.getCell(H1, start), label, { size: 8 });
    setHead(ws.getCell(H2, start), "~");
    setHead(ws.getCell(H2, start + 1), "<");
    setHead(ws.getCell(H2, start + 2), "RC");
  });

  // totals group
  ws.mergeCells(H1, COLS.sumLifted, H1, COLS.sumRed);
  setHead(ws.getCell(H1, COLS.sumLifted), "รวม / TOTALS", { size: 8 });
  setHead(ws.getCell(H2, COLS.sumLifted), "~");
  setHead(ws.getCell(H2, COLS.sumBent), "<");
  setHead(ws.getCell(H2, COLS.sumRed), "RC");

  // result columns span both header rows
  const spanHead = (col: number, text: string) => {
    ws.mergeCells(H1, col, H2, col);
    setHead(ws.getCell(H1, col), text, { size: 8 });
  };
  spanHead(COLS.rank, "อันดับ\nRANK");
  spanHead(COLS.finish, "เวลาเข้าเส้นชัย\nFINISH");
  spanHead(COLS.status, "สถานะ");
  spanHead(COLS.dqTime, "เวลา DQ");
  spanHead(COLS.offence, "ความผิด\nOFFENCE");

  // ── athlete rows ─────────────────────────────────────────────────────────────
  let r = H2 + 1;
  for (const a of round.athletes) {
    const row = ws.getRow(r);
    row.height = 16;
    const isDq = a.status === "DQ";
    const isDnf = a.status === "DNF";
    const rowInk = isDq ? COLOR.red : isDnf ? COLOR.amber : COLOR.ink;

    const base = (col: number, value: ExcelJS.CellValue, align: "left" | "center" = "center", bold = false) => {
      const cell = ws.getCell(r, col);
      cell.value = value;
      cell.font = { name: BASE_FONT, size: 9, bold, color: { argb: rowInk } };
      cell.alignment = { vertical: "middle", horizontal: align };
      cell.border = ALL_BORDER;
      if (r % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.zebra } };
      return cell;
    };

    base(COLS.bib, a.bib, "center", true);
    base(COLS.name, a.name, "left");
    ws.getCell(r, COLS.name).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    base(COLS.country, a.country);

    judges.forEach((j, idx) => {
      const start = judgeCol(idx);
      const m = a.marks[j.id] ?? { yellowLifted: false, yellowBent: false, red: null };
      base(start, m.yellowLifted ? "~" : "");
      base(start + 1, m.yellowBent ? "<" : "");
      const rc = base(start + 2, "");
      if (m.red) {
        const { symbol, state } = m.red;
        if (state === "OVERRIDDEN") {
          rc.value = `(${symbol})`;
          rc.font = { name: BASE_FONT, size: 9, color: { argb: COLOR.muted }, strike: true };
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
    });

    base(COLS.sumLifted, a.totals.lifted || "");
    base(COLS.sumBent, a.totals.bent || "");
    const redTotal = base(COLS.sumRed, a.totals.red || "");
    if (a.totals.red > 0) redTotal.font = { name: BASE_FONT, size: 10, bold: true, color: { argb: COLOR.red } };

    base(COLS.rank, isDq || isDnf ? "" : a.position ?? "", "center", true);
    base(COLS.finish, formatMs(a.finishMs));
    base(COLS.status, isDq ? "DQ" : isDnf ? "DNF" : a.finishMs ? "จบ" : "", "center", isDq || isDnf);
    base(COLS.dqTime, a.dq?.time ?? "");
    base(COLS.offence, a.dq?.offence ?? "");

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

  // ── legend + signatures ──────────────────────────────────────────────────────
  r += 1;
  ws.mergeCells(r, 1, r, LAST);
  const legend = ws.getCell(r, 1);
  legend.value =
    'สัญลักษณ์:  ~ = ยกเท้า (loss of contact)   |   < = เข่างอ (bent knee)   |   RC = ใบแดง (Red Card)   |   ( ) = ใบแดงที่ถูกยกเลิก';
  legend.font = { name: BASE_FONT, size: 8, italic: true, color: { argb: COLOR.muted } };
  legend.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  r += 2;

  const sigCols = Math.max(1, Math.floor(LAST / 3));
  const sigs = ["หัวหน้ากรรมการ\nCHIEF JUDGE", "ผู้ช่วยหัวหน้ากรรมการ\nASSISTANT CHIEF JUDGE", "ผู้บันทึก\nRECORDERS"];
  sigs.forEach((label, i) => {
    const start = 1 + i * sigCols;
    const end = i === 2 ? LAST : start + sigCols - 1;
    const line = ws.getCell(r, start);
    line.value = "____________________________";
    line.font = { name: BASE_FONT, size: 9, color: { argb: COLOR.muted } };
    line.alignment = { horizontal: "center" };
    if (end > start) ws.mergeCells(r, start, r, end);
    const cap = ws.getCell(r + 1, start);
    cap.value = label;
    cap.font = { name: BASE_FONT, size: 8, bold: true, color: { argb: COLOR.label } };
    cap.alignment = { horizontal: "center", wrapText: true, vertical: "top" };
    if (end > start) ws.mergeCells(r + 1, start, r + 1, end);
  });
  ws.getRow(r + 1).height = 26;

  // ── view + print setup ───────────────────────────────────────────────────────
  ws.views = [{ state: "frozen", xSplit: COLS.country, ySplit: H2 }];
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    printTitlesRow: `${H1}:${H2}`,
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
