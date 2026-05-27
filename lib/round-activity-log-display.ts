export type RoundActivityLogInput = {
  actionType: string;
  actorName: string;
  actorRole: string;
  targetBib?: string | null;
  targetAthleteName?: string | null;
  details?: string | null;
  lapNumber?: number | null;
};

export type ActivityLogTextPart = {
  text: string;
  bold?: boolean;
  className?: string;
};

export type FormattedRoundActivityLog = {
  actorRoleLabel: string;
  parts: ActivityLogTextPart[];
  detailLine?: string;
  badge?: { label: string; className: string };
};

const ACTOR_ROLE_LABELS: Record<string, string> = {
  JUDGE: "กรรมการ",
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  MODERATOR: "ผู้ดูแล",
  TIMEKEEPER: "ผู้จับเวลา",
  EVENT_LOGGER: "ผู้บันทึก",
  ADMIN: "ผู้ดูแลระบบ",
};

const ACTION_BADGES: Record<string, { label: string; className: string }> = {
  yellow_card: { label: "ใบเหลือง", className: "bg-amber-500/20 text-amber-300 ring-amber-500/40" },
  red_card: { label: "ใบแดง", className: "bg-red-500/20 text-red-300 ring-red-500/40" },
  red_card_confirm: { label: "ยืนยันใบแดง", className: "bg-red-500/20 text-red-300 ring-red-500/40" },
  red_card_override: { label: "ยกเลิกใบแดง", className: "bg-slate-500/20 text-slate-300 ring-slate-500/40" },
  athlete_dq: { label: "DQ", className: "bg-red-600/30 text-red-200 ring-red-500/50" },
  round_start: { label: "เริ่มรอบ", className: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40" },
  round_end: { label: "จบรอบ", className: "bg-slate-500/20 text-slate-300 ring-slate-500/40" },
  lap_time: { label: "Lap", className: "bg-sky-500/20 text-sky-300 ring-sky-500/40" },
  finish_time: { label: "เข้าเส้นชัย", className: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40" },
  moderator_delete_card: { label: "แก้ไข: ลบใบ", className: "bg-violet-500/20 text-violet-300 ring-violet-500/40" },
  moderator_override_status: { label: "แก้ไข: สถานะ", className: "bg-violet-500/20 text-violet-300 ring-violet-500/40" },
  moderator_edit_lap: { label: "แก้ไข: Lap", className: "bg-violet-500/20 text-violet-300 ring-violet-500/40" },
  moderator_delete_lap: { label: "แก้ไข: ลบ Lap", className: "bg-violet-500/20 text-violet-300 ring-violet-500/40" },
  moderator_edit_finish: { label: "แก้ไข: Finish", className: "bg-violet-500/20 text-violet-300 ring-violet-500/40" },
  moderator_delete_finish: { label: "แก้ไข: ลบ Finish", className: "bg-violet-500/20 text-violet-300 ring-violet-500/40" },
};

function athleteTargetParts(
  bib?: string | null,
  name?: string | null,
  bibClass = "text-slate-100",
): ActivityLogTextPart[] {
  if (!bib && !name) return [];
  const parts: ActivityLogTextPart[] = [{ text: "ให้ ", bold: false }];
  if (bib) {
    parts.push({ text: `Bib ${bib}`, bold: true, className: bibClass });
  }
  if (name) {
    if (bib) parts.push({ text: " ", bold: false });
    parts.push({ text: name, bold: true, className: bibClass });
  }
  return parts;
}

function symbolDetailLine(details?: string | null): string | undefined {
  if (!details) return undefined;
  if (details === "ยกเท้า" || details === "เข่างอ") {
    return `สัญลักษณ์: ${details}`;
  }
  return details;
}

/** แปลง actionType + ข้อมูล log เป็นข้อความภาษาไทยพร้อมส่วนที่เน้นสี/ตัวหนา */
export function formatRoundActivityLog(
  input: RoundActivityLogInput,
): FormattedRoundActivityLog {
  const roleLabel =
    ACTOR_ROLE_LABELS[input.actorRole] ?? input.actorRole;
  const badge = ACTION_BADGES[input.actionType];
  const target = athleteTargetParts(
    input.targetBib,
    input.targetAthleteName,
  );
  const symbolDetail = symbolDetailLine(input.details);

  switch (input.actionType) {
    case "yellow_card":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "ออก ", bold: false },
          { text: "ใบเหลือง", bold: true, className: "text-amber-400" },
          ...target,
        ],
        detailLine: symbolDetail,
      };
    case "red_card":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "ขอออก ", bold: false },
          { text: "ใบแดง", bold: true, className: "text-red-400" },
          ...target,
          { text: " (รอหัวหน้ากรรมการยืนยัน)", bold: false, className: "text-slate-400" },
        ],
        detailLine: symbolDetail,
      };
    case "red_card_confirm":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "ยืนยัน ", bold: false },
          { text: "ใบแดง", bold: true, className: "text-red-400" },
          ...target,
        ],
      };
    case "red_card_override":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "ยกเลิก ", bold: false },
          { text: "ใบแดง", bold: true, className: "text-slate-300" },
          ...target,
        ],
      };
    case "athlete_dq":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "ตัดสิทธิ์ ", bold: false },
          { text: "DQ", bold: true, className: "text-red-400" },
          ...target,
        ],
        detailLine:
          input.details?.replace(/^DQ\s*-\s*/i, "") ?? "ครบใบแดงตามกติกา",
      };
    case "round_start":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "เริ่ม", bold: false },
          { text: "รอบการแข่งขัน", bold: true, className: "text-emerald-400" },
        ],
        detailLine: input.details ?? undefined,
      };
    case "round_end":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "จบ", bold: false },
          { text: "รอบการแข่งขัน", bold: true, className: "text-slate-200" },
        ],
        detailLine: input.details ?? undefined,
      };
    case "lap_time":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "บันทึก ", bold: false },
          {
            text: `เวลา Lap ${input.lapNumber ?? "?"}`,
            bold: true,
            className: "text-sky-300",
          },
          ...target,
        ],
        detailLine: input.details?.replace(/^Lap\s+\d+\s*-\s*/i, "เวลา: ") ?? undefined,
      };
    case "finish_time":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "บันทึก ", bold: false },
          { text: "เข้าเส้นชัย", bold: true, className: "text-emerald-400" },
          ...target,
        ],
        detailLine: input.details ?? undefined,
      };
    case "moderator_delete_card":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [{ text: "ลบใบ (โหมดแก้ไข)", bold: true, className: "text-violet-300" }, ...target],
        detailLine: input.details ?? undefined,
      };
    case "moderator_override_status":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "แก้ไขสถานะนักกีฬา (โหมดแก้ไข)", bold: true, className: "text-violet-300" },
          ...target,
        ],
        detailLine: input.details ?? undefined,
      };
    case "moderator_edit_lap":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "แก้ไขเวลา Lap (โหมดแก้ไข)", bold: true, className: "text-violet-300" },
          ...target,
        ],
        detailLine: input.details ?? undefined,
      };
    case "moderator_delete_lap":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "ลบเวลา Lap (โหมดแก้ไข)", bold: true, className: "text-violet-300" },
          ...target,
        ],
        detailLine: input.details ?? undefined,
      };
    case "moderator_edit_finish":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "แก้ไขเวลาเข้าเส้นชัย (โหมดแก้ไข)", bold: true, className: "text-violet-300" },
          ...target,
        ],
        detailLine: input.details ?? undefined,
      };
    case "moderator_delete_finish":
      return {
        actorRoleLabel: roleLabel,
        badge,
        parts: [
          { text: "ลบเวลาเข้าเส้นชัย (โหมดแก้ไข)", bold: true, className: "text-violet-300" },
          ...target,
        ],
        detailLine: input.details ?? undefined,
      };
    default:
      return {
        actorRoleLabel: roleLabel,
        badge: badge ?? {
          label: input.actionType,
          className: "bg-slate-500/20 text-slate-300 ring-slate-500/40",
        },
        parts: [
          {
            text: input.details ?? input.actionType,
            bold: false,
          },
          ...target,
        ],
        detailLine: input.details && input.details !== input.actionType ? undefined : undefined,
      };
  }
}
