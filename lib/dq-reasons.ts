/**
 * Disqualification (DQ) reason catalog — World Athletics Competition & Technical
 * Rules applicable to in-competition disqualifications (2026 January Edition).
 *
 * Used by the moderator "DQ ภายหลัง" flow: the moderator picks a rule code from a
 * searchable list (with an "อื่น ๆ / Other" escape hatch for free text). The chosen
 * `code` is stored on RoundAthlete.dqReasonCode and shown in every export (CSV /
 * Excel / PDF) in place of the plain "DQ" mark — e.g. "TR54.7.5", "TR16.8".
 *
 * Scope: curated for an individual race-walking competition — Race Walking (TR54),
 * disciplinary/conduct (TR7.1), the start (TR16), the most relevant track lane/
 * border rules (TR17) and road-race distance rules (TR55). Field-event, throws,
 * relay, hurdle and steeplechase-specific infringements are intentionally omitted.
 *
 * `code` is the "Reference for Referee" form (it keeps the bracketed qualifier,
 * e.g. "TR54.7.3[E]") because that is what uniquely identifies the infringement
 * and what appears on the official summary sheet.
 */

export type DqReasonCategory =
  | "RACE_WALKING"
  | "CONDUCT"
  | "START"
  | "TRACK"
  | "ROAD";

export type DqReason = {
  /** Referee reference code, e.g. "TR54.7.5" or "TR7.1[TR6.3.1]". Stored + exported. */
  code: string;
  /** Thai description of the infringement (shown in the picker). */
  th: string;
  /** English description (from the WA rules — also matched by search). */
  en: string;
  category: DqReasonCategory;
};

export const DQ_CATEGORY_LABEL: Record<DqReasonCategory, string> = {
  RACE_WALKING: "การแข่งขันเดินทน (Race Walking)",
  CONDUCT: "ความประพฤติ / มารยาท (Conduct)",
  START: "การปล่อยตัว (Start)",
  TRACK: "ลู่วิ่ง (Track)",
  ROAD: "ถนน / ระยะไกล (Road)",
};

/** Sentinel value used by the picker for the free-text "Other" choice. */
export const DQ_REASON_OTHER = "OTHER";

/**
 * Ordered so the most likely race-walking reasons appear first. The picker keeps
 * this order when not searching, then pins the "อื่น ๆ / Other" entry last.
 */
export const DQ_REASONS: DqReason[] = [
  // ── Race Walking (TR54) ──────────────────────────────────────────────────
  {
    code: "TR54.7.5",
    th: "ได้รับใบแดงครบ 4 ใบ",
    en: "Fourth red card",
    category: "RACE_WALKING",
  },
  {
    code: "TR54.4.1",
    th: "ตัดสิทธิ์โดยหัวหน้ากรรมการเดิน",
    en: "Disqualification by the Chief Race Walking Judge",
    category: "RACE_WALKING",
  },
  {
    code: "TR54.7.1",
    th: "ฝ่าฝืนนิยามการเดินซ้ำหลายครั้ง",
    en: "Repeated failure to comply with the definition of Race Walking",
    category: "RACE_WALKING",
  },
  {
    code: "TR54.7.3[E]",
    th: "ไม่เข้าโซนลงโทษ (Penalty Zone)",
    en: "Failing to enter the Penalty Zone",
    category: "RACE_WALKING",
  },
  {
    code: "TR54.7.3[L]",
    th: "ออกจากโซนลงโทษก่อนกำหนด",
    en: "Leaving the Penalty Zone early",
    category: "RACE_WALKING",
  },
  {
    code: "TR54.13",
    th: "เดินลัด / ลดระยะทาง",
    en: "Shortening the distance",
    category: "RACE_WALKING",
  },
  {
    code: "TR7.1[TR54.7.6]",
    th: "นักกีฬาที่ถูกตัดสิทธิ์ไม่ออกจากเส้นทาง/ลู่",
    en: "Disqualified athlete failing to leave the track/course",
    category: "RACE_WALKING",
  },
  {
    code: "TR7.1[TR54.10.8]",
    th: "รับน้ำ/เครื่องดื่มนอกจุดบริการ หรือของผู้อื่น",
    en: "Taking refreshment/water outside the official station (or another's)",
    category: "RACE_WALKING",
  },

  // ── Conduct / disciplinary (TR7.1) ───────────────────────────────────────
  {
    code: "TR7.1[C]",
    th: "ประพฤติตัวไม่เหมาะสม",
    en: "Improper conduct",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[M]",
    th: "มารยาทไม่สมศักดิ์ศรีนักกีฬา",
    en: "Unsporting manner",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[CR6.1Note(ii)]",
    th: "ไม่ปฏิบัติตามคำสั่งของแพทย์สนาม",
    en: "Not complying with the order of the Medical Delegate",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR5.1]",
    th: "ไม่ปฏิบัติตามกติกาเครื่องแต่งกาย",
    en: "Not complying with the clothing rules",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR5.2]",
    th: "ไม่ปฏิบัติตามกติการองเท้า",
    en: "Not complying with the shoe rules",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR5.7]",
    th: "ไม่ปฏิบัติตามกติกาหมายเลขประจำตัว (BIB)",
    en: "Not complying with the bib rules",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR6.2]",
    th: "ให้หรือรับความช่วยเหลือ",
    en: "Giving or receiving assistance",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR6.3.1]",
    th: "มีผู้กำหนดจังหวะการเดิน (pacing)",
    en: "Pacing",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR6.3.2]",
    th: "ครอบครอง/ใช้อุปกรณ์อิเล็กทรอนิกส์",
    en: "Possession or use of an electronic device",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR6.3.3]",
    th: "ใช้เทคโนโลยี/อุปกรณ์ช่วย",
    en: "Use of technology or an appliance",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR6.3.4]",
    th: "ใช้อุปกรณ์กลไกช่วย (mechanical aid)",
    en: "Use of a mechanical aid",
    category: "CONDUCT",
  },
  {
    code: "TR7.1[TR6.3.6]",
    th: "รับการพยุงจากนักกีฬาคนอื่น",
    en: "Receiving physical support from another athlete",
    category: "CONDUCT",
  },

  // ── Start (TR16) ─────────────────────────────────────────────────────────
  {
    code: "TR16.8",
    th: "ออกตัวผิดกติกา (False start)",
    en: "False start",
    category: "START",
  },
  {
    code: "TR7.1[TR16.5.1]",
    th: "ทำให้การปล่อยตัวเสียโดยไม่มีเหตุผลอันควร",
    en: "Causing the abortion of the start without valid reason",
    category: "START",
  },
  {
    code: "TR7.1[TR16.5.2]",
    th: "ไม่ทำตามคำสั่งผู้ปล่อยตัว / ถ่วงเวลาการปล่อยตัว",
    en: "Failing to comply with the starter's commands / delaying the start",
    category: "START",
  },
  {
    code: "TR7.1[TR16.5.3]",
    th: "รบกวนการปล่อยตัว",
    en: "Disturbing the start",
    category: "START",
  },

  // ── Track lane / border (TR17) ───────────────────────────────────────────
  {
    code: "TR17.1.2",
    th: "เบียด/กีดขวางนักกีฬาคนอื่น",
    en: "Jostling or obstruction",
    category: "TRACK",
  },
  {
    code: "TR17.2.4",
    th: "ล้ำเส้นขอบในของลู่",
    en: "Infringement of the inside border",
    category: "TRACK",
  },
  {
    code: "TR17.6",
    th: "กลับเข้าแข่งหลังออกจากลู่โดยสมัครใจ",
    en: "Re-entering the race after voluntarily leaving the track",
    category: "TRACK",
  },

  // ── Road / long distance (TR55) ──────────────────────────────────────────
  {
    code: "TR55.10",
    th: "ลดระยะทาง (การแข่งขันบนถนน)",
    en: "Shortening the distance (road race)",
    category: "ROAD",
  },
];

const BY_CODE = new Map(DQ_REASONS.map((r) => [r.code, r]));

export function findDqReason(code: string | null | undefined): DqReason | null {
  if (!code) return null;
  return BY_CODE.get(code) ?? null;
}

/** A valid catalog code, the free-text sentinel, or null. */
export function isKnownDqCode(code: string | null | undefined): boolean {
  return !!code && BY_CODE.has(code);
}

/** Human label for logs / tooltips: "TR54.7.5 — ได้รับใบแดงครบ 4 ใบ". */
export function dqReasonLabel(code: string | null | undefined): string {
  const r = findDqReason(code);
  return r ? `${r.code} — ${r.th}` : (code ?? "");
}
