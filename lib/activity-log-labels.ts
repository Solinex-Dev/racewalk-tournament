/** Thai labels for the system ActivityLog (audit trail) display. */

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  PAGE_VIEW: "เข้าดูหน้า",
  USER_REGISTERED: "ลงทะเบียนผู้ใช้",
  USER_LOGGED_IN: "เข้าสู่ระบบ",
  USER_LOGGED_OUT: "ออกจากระบบ",
  USER_PROFILE_UPDATED: "แก้ไขโปรไฟล์",
  USER_PASSWORD_CHANGED: "เปลี่ยนรหัสผ่าน",
  USER_PASSWORD_RESET_REQUESTED: "ขอรีเซ็ตรหัสผ่าน",
  USER_EMAIL_VERIFIED: "ยืนยันอีเมล",
  SESSION_REVOKED: "ยกเลิก session",
  ACCOUNT_DEACTIVATE: "ระงับบัญชี",
  ACCOUNT_RESTORE: "กู้คืนบัญชี",
  ACCOUNT_DELETED: "ลบบัญชี",
  EVENT_CREATED: "สร้างกิจกรรม",
  EVENT_UPDATED: "แก้ไขกิจกรรม",
  EVENT_DELETED: "ลบกิจกรรม",
  ROUND_CREATED: "สร้างรอบแข่ง",
  ROUND_UPDATED: "แก้ไขรอบแข่ง",
  ROUND_DELETED: "ลบรอบแข่ง",
  ROUND_STARTED: "เริ่มรอบแข่ง",
  ROUND_ENDED: "จบรอบแข่ง",
  ATHLETE_CREATED: "เพิ่มนักกีฬา",
  ATHLETE_UPDATED: "แก้ไขนักกีฬา",
  ATHLETE_DELETED: "ลบนักกีฬา",
  ATHLETES_BULK_IMPORTED: "นำเข้านักกีฬาหลายรายการ",
  JUDGE_CREATED: "เพิ่มกรรมการ",
  JUDGE_UPDATED: "แก้ไขกรรมการ",
  JUDGE_DELETED: "ลบกรรมการ",
  JUDGES_BULK_IMPORTED: "นำเข้ากรรมการหลายรายการ",
  AFFILIATION_CREATED: "เพิ่มสังกัด",
  AFFILIATION_UPDATED: "แก้ไขสังกัด",
  AFFILIATION_DELETED: "ลบสังกัด",
  ORGANIZATION_CREATED: "เพิ่มองค์กร",
  ORGANIZATION_UPDATED: "แก้ไของค์กร",
  ORGANIZATION_DELETED: "ลบองค์กร",
  DEPARTMENT_CREATED: "เพิ่มแผนก",
  DEPARTMENT_UPDATED: "แก้ไขแผนก",
  DEPARTMENT_DELETED: "ลบแผนก",
  ADMIN_CREATED: "สร้างผู้ดูแล",
  ADMIN_UPDATED: "แก้ไขผู้ดูแล",
  ADMIN_DELETED: "ลบผู้ดูแล",
  MODERATOR_DELETE_CARD: "ลบใบ (โหมดแก้ไข)",
  MODERATOR_OVERRIDE_STATUS: "แก้สถานะนักกีฬา (โหมดแก้ไข)",
  MODERATOR_EDIT_LAP: "แก้เวลา Lap (โหมดแก้ไข)",
  MODERATOR_DELETE_LAP: "ลบ Lap (โหมดแก้ไข)",
  MODERATOR_EDIT_FINISH: "แก้เวลาเข้าเส้นชัย (โหมดแก้ไข)",
  MODERATOR_DELETE_FINISH: "ลบเวลาเข้าเส้นชัย (โหมดแก้ไข)",
  MODERATOR_CONFIRM_RED: "ยืนยันใบแดง (โหมดแก้ไข)",
  MODERATOR_REJECT_RED: "ยกเลิกใบแดง (โหมดแก้ไข)",
  MODERATOR_EDIT_CARD: "แก้ไขใบ (โหมดแก้ไข)",
  MODERATOR_EDIT_FINISH_POSITION: "แก้อันดับ (โหมดแก้ไข)",
  MODERATOR_EDIT_ROUND: "แก้ข้อมูลรอบ (โหมดแก้ไข)",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Athlete: "นักกีฬา",
  Judge: "กรรมการ",
  Affiliation: "สังกัด",
  Organization: "องค์กร",
  Department: "แผนก",
  Event: "กิจกรรม",
  Round: "รอบแข่ง",
  User: "ผู้ดูแล",
  Card: "ใบเตือน",
  LapTime: "เวลา Lap",
  FinishTime: "เวลาเข้าเส้นชัย",
  RoundAthlete: "นักกีฬาในรอบ",
  Page: "หน้า",
};

export function activityActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] ?? action;
}

export function entityTypeLabel(t: string | null | undefined): string {
  if (!t) return "";
  return ENTITY_TYPE_LABELS[t] ?? t;
}

/** A short human note pulled from the JSON `details` (e.g. the record's name). */
export function activityDetailText(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  const name = typeof d.name === "string" ? d.name : "";
  const email = typeof d.email === "string" ? d.email : "";
  const reason = typeof d.reason === "string" ? d.reason : "";
  const title = typeof d.title === "string" ? d.title : "";
  return [name || email || title, reason].filter(Boolean).join(" — ");
}

/** Thai label for a CRUD operation. */
export const OPERATION_LABELS: Record<string, string> = {
  CREATE: "เพิ่ม",
  READ: "เข้าดู",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
  ACTION: "ดำเนินการ",
};

export function operationLabel(op: string | null | undefined): string {
  if (!op) return "";
  return OPERATION_LABELS[op] ?? op;
}

/**
 * Best-effort short label for a User-Agent string, e.g. "Chrome • Windows".
 * Falls back to a trimmed raw string for unknown agents.
 */
export function formatUserAgent(ua: string | null | undefined): string {
  if (!ua) return "";
  let browser: string;
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  else browser = "";
  let os: string;
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  else os = "";
  const parts = [browser, os].filter(Boolean);
  return parts.length ? parts.join(" • ") : ua.slice(0, 40);
}
