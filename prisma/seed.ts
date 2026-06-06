/**
 * Database seed — generator-driven, correct-by-construction.
 *
 * Run:
 *   npm run db:seed           # idempotent — adds missing rows only
 *   npm run db:seed:reset     # wipes all tables and reseeds
 *
 * Design principles (so the data is realistic AND obeys business rules):
 *   1. Race-walk realism — pace 4:00–5:30 / km (NOT runner pace). 1 lap = 1 km
 *      for every round (distanceKm === lapCount), so paceSec is per-lap seconds.
 *   2. Internal consistency — lap times are cumulative. A finisher emits lap rows
 *      1..(N-1); the Nth (final) crossing IS the FinishTime (not a lap row),
 *      matching the live recorder. currentLap = lap rows + (finished ? 1 : 0) = N.
 *   3. Rule correctness — a DQ athlete has EXACTLY ≥4 CONFIRMED red cards from 4
 *      distinct judges (the generator throws if a DQ scenario violates this).
 *      Yellow: ≤1 per symbol per judge per athlete. Red: ≤1 (non-overridden) per
 *      judge per athlete. OVERRIDDEN reds never count toward DQ.
 *   4. Diversity — DRAFT / SCHEDULED / 2× ONGOING / 3× FINISHED events, men's &
 *      women's heats kept separate, national + international (Asian Junior) fields,
 *      3-letter ISO country codes (matches the admin forms). The "open meet" event
 *      stress-tests field sizes: a 50-athlete mass round, a 2-athlete duel and a
 *      1-athlete solo time trial (all generator-produced, same invariants).
 *
 * Secret codes are generated deterministically; the joinable (SCHEDULED/ONGOING)
 * ones are printed in the run summary.
 *
 * See docs/TEST_SCENARIOS.md for the walkthrough.
 */
import "./load-env";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { normalizePermissions } from "../lib/permissions";
import { dqReasonLabel } from "../lib/dq-reasons";

const RESET_FLAG = process.argv.includes("--reset");

// "Now" anchor for ONGOING rounds so elapsed time looks live.
const NOW = Date.now();
const minutes = (n: number) => n * 60_000;
const seconds = (n: number) => n * 1_000;

// Country codes are written as 3-letter ISO in this file; the app stores 2-letter.
const A3_TO_A2: Record<string, string> = {
  THA: "TH", VNM: "VN", MYS: "MY", MMR: "MM", KOR: "KR", LAO: "LA", USA: "US", JPN: "JP",
};
const toAlpha2 = (c: string) => A3_TO_A2[c] ?? c;
const splitName = (name: string): { firstName: string; lastName: string | null } => {
  const i = name.indexOf(" ");
  return i >= 0
    ? { firstName: name.slice(0, i), lastName: name.slice(i + 1) }
    : { firstName: name, lastName: null };
};

// ─── Auth users ───────────────────────────────────────────────────────────────

const SEED_USER_LAST_ACTIVE = new Date(NOW - 2 * 60 * 60 * 1000);

const SEED_USERS = [
  // Root Admin — bypasses all permission checks.
  { email: "owner@racewalk.local",     name: "ผู้ดูแลระบบหลัก",  title: "Owner",         password: "owner1234",     role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: SEED_USER_LAST_ACTIVE, isRoot: true,  permissions: normalizePermissions({}) },
  // Event Manager — manages events/athletes/judges/affiliations but not admins.
  { email: "events@racewalk.local",    name: "ผู้จัดการแข่งขัน",  title: "Event Manager", password: "events1234",    role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: new Date(NOW - 26 * 60 * 60 * 1000), isRoot: false, permissions: normalizePermissions({
      events: { view: true, create: true, edit: true, delete: true },
      athletes: { view: true, create: true, edit: true, delete: true },
      judges: { view: true, create: true, edit: true, delete: true },
      affiliations: { view: true, create: true, edit: true, delete: true },
      reports: { view: true },
    }) },
  // Score Officer — views rosters and moderates the race (corrects results live).
  { email: "score@racewalk.local",     name: "เจ้าหน้าที่คะแนน",  title: "Score Officer", password: "score1234",     role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: new Date(NOW - 3 * 24 * 60 * 60 * 1000), isRoot: false, permissions: normalizePermissions({
      events: { view: true },
      moderator: { view: true },
      athletes: { view: true },
      judges: { view: true },
      affiliations: { view: true },
      reports: { view: true },
    }) },
  // Moderator-only — sees the events list and can ONLY open the Moderator tool.
  { email: "moderator@racewalk.local", name: "ผู้ควบคุมการแข่ง",  title: "Moderator",     password: "moderator1234", role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: new Date(NOW - 5 * 60 * 60 * 1000), isRoot: false, permissions: normalizePermissions({
      moderator: { view: true },
    }) },
  // Reports-only — sees the events list and can ONLY open reports/exports (Excel/CSV/print).
  { email: "reports@racewalk.local",   name: "เจ้าหน้าที่รายงาน", title: "Reports",       password: "reports1234",   role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: new Date(NOW - 6 * 60 * 60 * 1000), isRoot: false, permissions: normalizePermissions({
      reports: { view: true },
    }) },
  { email: "suspended@racewalk.local", name: "อดีตผู้ดูแล",       title: "Former Admin",  password: "suspended1234", role: "ADMIN" as const, status: "SUSPENDED" as const, lastActiveAt: new Date("2024-08-01T00:00:00.000Z"), isRoot: false, permissions: normalizePermissions({ events: { view: true } }) },
];

// ─── Affiliations ─────────────────────────────────────────────────────────────

// headJudgeId references a seeded Judge (heads of affiliation are managed as Judges).
const SEED_AFFILIATIONS = [
  { id: "aff-bkk",   name: "ชมรมเดินทนกรุงเทพมหานคร", country: "THA", province: "กรุงเทพมหานคร", headJudgeId: "jud-03", joinedAt: new Date("2018-05-01"), note: "สโมสรหลักภาคกลาง" },
  { id: "aff-army",  name: "สโมสรกีฬากองทัพบก",       country: "THA", province: "กรุงเทพมหานคร", headJudgeId: "jud-11", joinedAt: new Date("2016-04-22"), note: "ทีมต้นสังกัดมีทุนสนับสนุน" },
  { id: "aff-ku",    name: "มหาวิทยาลัยเกษตรศาสตร์",  country: "THA", province: "กรุงเทพมหานคร", headJudgeId: null,     joinedAt: new Date("2019-08-10"), note: "ทีมนักกีฬามหาวิทยาลัย" },
  { id: "aff-cm",    name: "สโมสรเดินทนเชียงใหม่",     country: "THA", province: "เชียงใหม่",      headJudgeId: "jud-08", joinedAt: new Date("2020-01-10"), note: "ตัวแทนภาคเหนือ" },
  { id: "aff-kk",    name: "ขอนแก่นแอธเลติก",          country: "THA", province: "ขอนแก่น",        headJudgeId: "jud-09", joinedAt: new Date("2021-11-05"), note: "ตัวแทนภาคอีสาน" },
  { id: "aff-hy",    name: "หาดใหญ่แอธเลติกคลับ",      country: "THA", province: "สงขลา",          headJudgeId: "jud-10", joinedAt: new Date("2022-06-20"), note: "ตัวแทนภาคใต้" },
  { id: "aff-nat",   name: "ทีมชาติไทย (เดินทน)",       country: "THA", province: "กรุงเทพมหานคร", headJudgeId: "jud-05", joinedAt: new Date("2015-01-01"), note: "นักกีฬาทีมชาติ" },
  { id: "aff-vnm",   name: "Vietnam Athletics",        country: "VNM", province: null,             headJudgeId: null,     joinedAt: new Date("2023-02-01"), note: "คณะนักกีฬาเวียดนาม" },
  { id: "aff-mys",   name: "Malaysia Athletics",       country: "MYS", province: null,             headJudgeId: null,     joinedAt: new Date("2023-02-01"), note: "คณะนักกีฬามาเลเซีย" },
];

// ─── Organizations & Departments (Organization → Department hierarchy) ──────────

const SEED_ORGANIZATIONS = [
  { id: "org-aat",  name: "สมาคมกรีฑาแห่งประเทศไทย" },
  { id: "org-bkk",  name: "ชมรมเดินทนกรุงเทพฯ" },
  { id: "org-cm",   name: "สโมสรเดินทนเชียงใหม่" },
  { id: "org-kk",   name: "ขอนแก่นแอธเลติก" },
  { id: "org-hy",   name: "หาดใหญ่แอธเลติกคลับ" },
  { id: "org-army", name: "สโมสรกีฬากองทัพบก" },
  { id: "org-aaf",  name: "Asian Athletics Federation" },
  { id: "org-iaaf", name: "IAAF Thailand" },
];

const SEED_DEPARTMENTS = [
  { id: "dep-field-aat",  organizationId: "org-aat",  name: "ฝ่ายกรรมการสนาม" },
  { id: "dep-chief-aat",  organizationId: "org-aat",  name: "หัวหน้ากรรมการ" },
  { id: "dep-record-aat", organizationId: "org-aat",  name: "ฝ่ายบันทึกผล" },
  { id: "dep-timing-aat", organizationId: "org-aat",  name: "ฝ่ายจับเวลา" },
  { id: "dep-medic-aat",  organizationId: "org-aat",  name: "ฝ่ายแพทย์สนาม" },
  { id: "dep-field-bkk",  organizationId: "org-bkk",  name: "ฝ่ายกรรมการสนาม" },
  { id: "dep-field-cm",   organizationId: "org-cm",   name: "ฝ่ายกรรมการสนาม" },
  { id: "dep-field-kk",   organizationId: "org-kk",   name: "ฝ่ายกรรมการสนาม" },
  { id: "dep-youth-kk",   organizationId: "org-kk",   name: "ฝ่ายกรรมการเยาวชน" },
  { id: "dep-field-hy",   organizationId: "org-hy",   name: "ฝ่ายกรรมการสนาม" },
  { id: "dep-chief-army", organizationId: "org-army", name: "หัวหน้ากรรมการ" },
  { id: "dep-intl-aaf",   organizationId: "org-aaf",  name: "International Panel" },
  { id: "dep-intl-iaaf",  organizationId: "org-iaaf", name: "ฝ่ายกรรมการสากล" },
];

// ─── Athletes ─────────────────────────────────────────────────────────────────
// Grouped by pool so heats stay gender-consistent. Country = 3-letter ISO.

const SEED_ATHLETES = [
  // Senior men (national 20 km pool)
  { id: "ath-m01", name: "สมชาย รักดี",        country: "THA", province: "กรุงเทพมหานคร", club: "ทีมชาติ ชุดใหญ่",  note: "แชมป์เก่า — ตัวเต็ง", affiliationId: "aff-nat" },
  { id: "ath-m02", name: "ณรงค์ ก้าวหน้า",     country: "THA", province: "กรุงเทพมหานคร", club: "กองทัพบก",         note: null, affiliationId: "aff-army" },
  { id: "ath-m03", name: "ธนกร เร็วรุด",        country: "THA", province: "เชียงใหม่",      club: "เชียงใหม่",         note: null, affiliationId: "aff-cm" },
  { id: "ath-m04", name: "อภิวัฒน์ ทรนง",      country: "THA", province: "กรุงเทพมหานคร", club: "กรุงเทพฯ",          note: null, affiliationId: "aff-bkk" },
  { id: "ath-m05", name: "กิตติพงษ์ ใจเพชร",    country: "THA", province: "ขอนแก่น",        club: "ขอนแก่น",           note: null, affiliationId: "aff-kk" },
  { id: "ath-m06", name: "วีรชัย มุ่งมั่น",       country: "THA", province: "สงขลา",          club: "หาดใหญ่",           note: "ดาวรุ่งภาคใต้", affiliationId: "aff-hy" },
  { id: "ath-m07", name: "ปรเมศวร์ สู้ศึก",     country: "THA", province: "กรุงเทพมหานคร", club: "มหาวิทยาลัย",       note: null, affiliationId: "aff-ku" },
  { id: "ath-m08", name: "จักรพงษ์ ยืนหยัด",    country: "THA", province: "กรุงเทพมหานคร", club: "กองทัพบก",         note: "มักโดนเตือนเรื่องเข่างอ", affiliationId: "aff-army" },

  // Senior women (national pool)
  { id: "ath-w01", name: "สุนิสา ลมกรด",        country: "THA", province: "กรุงเทพมหานคร", club: "ทีมชาติ ชุดใหญ่",  note: "เจ้าของสถิติประเทศ", affiliationId: "aff-nat" },
  { id: "ath-w02", name: "กนกวรรณ ไวว่อง",     country: "THA", province: "เชียงใหม่",      club: "เชียงใหม่",         note: null, affiliationId: "aff-cm" },
  { id: "ath-w03", name: "พิมพ์ชนก ทะยาน",     country: "THA", province: "กรุงเทพมหานคร", club: "มหาวิทยาลัย",       note: null, affiliationId: "aff-ku" },
  { id: "ath-w04", name: "รุ่งทิวา แกร่งกล้า",     country: "THA", province: "ขอนแก่น",        club: "ขอนแก่น",           note: null, affiliationId: "aff-kk" },
  { id: "ath-w05", name: "ศิริพร เดินดี",         country: "THA", province: "กรุงเทพมหานคร", club: "กรุงเทพฯ",          note: null, affiliationId: "aff-bkk" },
  { id: "ath-w06", name: "อรอุมา ไม่ยอม",       country: "THA", province: "สงขลา",          club: "หาดใหญ่",           note: null, affiliationId: "aff-hy" },

  // Junior men (international — Asian Junior)
  { id: "ath-jm01", name: "วิชัย วงศ์ไชย",       country: "THA", province: "กรุงเทพมหานคร", club: "ทีมเยาวชนชาติ",    note: "แชมป์ Asian Junior 2024", affiliationId: "aff-nat" },
  { id: "ath-jm02", name: "Nguyen Van An",      country: "VNM", province: null,             club: "Vietnam U20",       note: null, affiliationId: "aff-vnm" },
  { id: "ath-jm03", name: "Hassan Yusof",       country: "MYS", province: null,             club: "Malaysia U20",      note: null, affiliationId: "aff-mys" },
  { id: "ath-jm04", name: "พงศกร ทองดี",        country: "THA", province: "กรุงเทพมหานคร", club: "มหาวิทยาลัย",       note: null, affiliationId: "aff-ku" },
  { id: "ath-jm05", name: "Soe Min Tun",        country: "MMR", province: null,             club: "Myanmar U20",       note: "เคยโดน red แต่ถูก override", affiliationId: null },
  { id: "ath-jm06", name: "อภิชาต ก้าวไกล",     country: "THA", province: "กรุงเทพมหานคร", club: "เยาวชนทหารบก",     note: "เคย DQ ที่ Asian Junior", affiliationId: "aff-army" },
  { id: "ath-jm07", name: "ธนพล วิ่งเร็ว",        country: "THA", province: "ขอนแก่น",        club: "ขอนแก่น",           note: null, affiliationId: "aff-kk" },

  // Junior women
  { id: "ath-jw01", name: "อรัญญา สวยใส",       country: "THA", province: "กรุงเทพมหานคร", club: "ทีมเยาวชนหญิง",    note: null, affiliationId: "aff-nat" },
  { id: "ath-jw02", name: "Le Thi Mai",         country: "VNM", province: null,             club: "Vietnam U20",       note: null, affiliationId: "aff-vnm" },
  { id: "ath-jw03", name: "Siti Aminah",        country: "MYS", province: null,             club: "Malaysia U20",      note: null, affiliationId: "aff-mys" },
  { id: "ath-jw04", name: "กมลชนก เบาเท้า",     country: "THA", province: "เชียงใหม่",      club: "เชียงใหม่",         note: null, affiliationId: "aff-cm" },
  { id: "ath-jw05", name: "ปาริชาต ลื่นไหล",     country: "THA", province: "กรุงเทพมหานคร", club: "มหาวิทยาลัย",       note: null, affiliationId: "aff-ku" },
];

// ─── Open-meet athletes (generated) — for large / edge field-size scenarios ────
// Deterministic names (stable across reseeds). Powers the "open" event below:
// a 50-athlete mass field, a 2-athlete duel and a 1-athlete solo time trial.

type AthleteSeed = {
  id: string; name: string; country: string; province: string | null;
  club: string | null; note: string | null; affiliationId: string | null;
};

const OPEN_FIRST = ["ก้องภพ", "ธีรเดช", "ปกรณ์", "อาทิตย์", "ชนาธิป", "ภูริช", "กิตติคุณ", "ณัฐวุฒิ", "ศุภชัย", "วีรพล", "พีรพัฒน์", "อนุสรณ์", "ฐิติพงศ์", "จิรายุ", "ธนดล", "ภาคิน", "สิทธิชัย", "ปรัชญา", "วรเมธ", "ธัญเทพ"];
const OPEN_LAST = ["ใจกล้า", "ก้าวไกล", "วิ่งสู้", "มุ่งมั่น", "อดทน", "เร่งรุด", "ฟ้าประทาน", "ทรงพล", "ศรีสุข", "พากเพียร", "ยืนยง", "สู้ไม่ถอย"];
const OPEN_PROVINCE = ["กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "สงขลา", "ชลบุรี", "นครราชสีมา"];
const OPEN_COUNTRY = ["THA", "THA", "THA", "THA", "THA", "THA", "THA", "VNM", "MYS", "LAO"];
const OPEN_AFF: (string | null)[] = ["aff-bkk", "aff-army", "aff-ku", "aff-cm", "aff-kk", "aff-hy", null];

function genOpenAthlete(i: number): AthleteSeed {
  const country = OPEN_COUNTRY[i % OPEN_COUNTRY.length];
  const isThai = country === "THA";
  return {
    id: `ath-open${String(i + 1).padStart(2, "0")}`,
    name: `${OPEN_FIRST[i % OPEN_FIRST.length]} ${OPEN_LAST[Math.floor(i / OPEN_FIRST.length) % OPEN_LAST.length]}`,
    country,
    province: isThai ? OPEN_PROVINCE[i % OPEN_PROVINCE.length] : null,
    club: null,
    note: null,
    affiliationId: isThai ? OPEN_AFF[i % OPEN_AFF.length] ?? null : null,
  };
}

const OPEN_ATHLETES: AthleteSeed[] = Array.from({ length: 53 }, (_, i) => genOpenAthlete(i));
const MASS_IDS = OPEN_ATHLETES.slice(0, 50).map((a) => a.id);
const DUEL_IDS = OPEN_ATHLETES.slice(50, 52).map((a) => a.id);
const SOLO_ID = OPEN_ATHLETES[52].id;

// Filler athlete pools — reused across heats so every round has a realistic
// 18–28-strong field. Distinct surname set from the open pool so names don't
// collide. Reuse across events is fine (same athlete competes year to year).
const FEMALE_FIRST = ["สุภาพร", "กาญจนา", "นภัสสร", "ปิยะดา", "วรรณภา", "อัจฉรา", "ธิดารัตน์", "พรทิพย์", "มณีรัตน์", "ศศิธร", "กมลทิพย์", "เบญจวรรณ", "อนงค์", "ชุติมา", "รัตนา", "สิริมา"];
const FILL_LAST = ["พลแสน", "ดงทอง", "นาเวศน์", "บุญมาก", "ทองแท้", "แดนไกล", "ภูผา", "สายลม", "คงทน", "รุ่งเรือง", "เกียรติยศ", "ชนะชัย", "เทพนิมิต", "มงคล"];

function genFillerAthlete(prefix: string, i: number, firsts: string[]): AthleteSeed {
  const country = OPEN_COUNTRY[i % OPEN_COUNTRY.length];
  const isThai = country === "THA";
  return {
    id: `${prefix}${String(i + 1).padStart(2, "0")}`,
    name: `${firsts[i % firsts.length]} ${FILL_LAST[Math.floor(i / firsts.length) % FILL_LAST.length]}`,
    country,
    province: isThai ? OPEN_PROVINCE[i % OPEN_PROVINCE.length] : null,
    club: null,
    note: null,
    affiliationId: isThai ? OPEN_AFF[i % OPEN_AFF.length] ?? null : null,
  };
}

const MEN_FILL = Array.from({ length: 24 }, (_, i) => genFillerAthlete("ath-mf", i, OPEN_FIRST));
const WOMEN_FILL = Array.from({ length: 20 }, (_, i) => genFillerAthlete("ath-wf", i, FEMALE_FIRST));
const menFill = (n: number) => MEN_FILL.slice(0, n).map((a) => a.id);
const womenFill = (n: number) => WOMEN_FILL.slice(0, n).map((a) => a.id);

// ─── Judges ───────────────────────────────────────────────────────────────────

// prefix/firstName/lastName feed the denormalized `name`; organizationId/departmentId
// link to SEED_ORGANIZATIONS / SEED_DEPARTMENTS. country is 2-letter ISO.
const SEED_JUDGES = [
  { id: "jud-01", name: "สมศักดิ์ ตัดสิน",      prefix: null,       firstName: "สมศักดิ์",  lastName: "ตัดสิน",    country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-aat",  departmentId: "dep-field-aat",  status: "ACTIVE"   as const, note: "กรรมการอาวุโส โซน A" },
  { id: "jud-02", name: "วิชัย มองทาง",         prefix: null,       firstName: "วิชัย",     lastName: "มองทาง",    country: "TH", province: "นนทบุรี",        organizationId: "org-aat",  departmentId: "dep-field-aat",  status: "ACTIVE"   as const, note: "โซน B" },
  { id: "jud-03", name: "ประเสริฐ พินิจ",        prefix: null,       firstName: "ประเสริฐ",  lastName: "พินิจ",     country: "TH", province: "ปทุมธานี",       organizationId: "org-bkk",  departmentId: "dep-field-bkk",  status: "ACTIVE"   as const, note: "โซน C" },
  { id: "jud-04", name: "อนุชา ฟ้าใส",          prefix: null,       firstName: "อนุชา",     lastName: "ฟ้าใส",     country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-aat",  departmentId: "dep-field-aat",  status: "ACTIVE"   as const, note: "โซน D" },
  { id: "jud-05", name: "ดร.สมหวัง วินิจฉัย",    prefix: "ดร.",      firstName: "สมหวัง",    lastName: "วินิจฉัย",   country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-aat",  departmentId: "dep-chief-aat",  status: "ACTIVE"   as const, note: "หัวหน้ากรรมการ (Chief)" },
  { id: "jud-06", name: "มานพ จดบันทึก",        prefix: null,       firstName: "มานพ",      lastName: "จดบันทึก",  country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-aat",  departmentId: "dep-record-aat", status: "ACTIVE"   as const, note: "Event Logger" },
  { id: "jud-07", name: "สุรชัย จับเวลา",        prefix: null,       firstName: "สุรชัย",    lastName: "จับเวลา",   country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-aat",  departmentId: "dep-timing-aat", status: "ACTIVE"   as const, note: "Timekeeper" },
  { id: "jud-08", name: "เกรียงไกร เคี่ยวเข็ญ",   prefix: null,       firstName: "เกรียงไกร", lastName: "เคี่ยวเข็ญ", country: "TH", province: "เชียงใหม่",      organizationId: "org-cm",   departmentId: "dep-field-cm",   status: "ACTIVE"   as const, note: "แผงกรรมการชุดสอง" },
  { id: "jud-09", name: "ชัยวัฒน์ เฝ้าโค้ง",      prefix: null,       firstName: "ชัยวัฒน์",  lastName: "เฝ้าโค้ง",   country: "TH", province: "ขอนแก่น",        organizationId: "org-kk",   departmentId: "dep-field-kk",   status: "ACTIVE"   as const, note: "แผงกรรมการชุดสอง" },
  { id: "jud-10", name: "ธีรพล สังเกต",         prefix: null,       firstName: "ธีรพล",     lastName: "สังเกต",    country: "TH", province: "สงขลา",          organizationId: "org-hy",   departmentId: "dep-field-hy",   status: "ACTIVE"   as const, note: "แผงกรรมการชุดสอง" },
  { id: "jud-11", name: "พ.ต.อ.วิรัช ยุติธรรม",  prefix: "พ.ต.อ.",   firstName: "วิรัช",     lastName: "ยุติธรรม",   country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-army", departmentId: "dep-chief-army", status: "ACTIVE"   as const, note: "หัวหน้ากรรมการชุดสอง" },
  { id: "jud-12", name: "Park Min-jun",         prefix: null,       firstName: "Park",      lastName: "Min-jun",   country: "KR", province: null,             organizationId: "org-aaf",  departmentId: "dep-intl-aaf",   status: "ACTIVE"   as const, note: "กรรมการรับเชิญจากเกาหลี" },
  { id: "jud-13", name: "ดร.อรพิน สากล",        prefix: "ดร.",      firstName: "อรพิน",     lastName: "สากล",     country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-iaaf", departmentId: "dep-intl-iaaf",  status: "ACTIVE"   as const, note: "IAAF certified" },
  { id: "jud-14", name: "นพ.ภานุวัฒน์ ดูแล",     prefix: "นพ.",      firstName: "ภานุวัฒน์", lastName: "ดูแล",     country: "TH", province: "กรุงเทพมหานคร", organizationId: "org-aat",  departmentId: "dep-medic-aat",  status: "ACTIVE"   as const, note: "แพทย์สนาม + กรรมการรอง" },
  { id: "jud-15", name: "ครูจิตรา เยาวชน",       prefix: "ครู",      firstName: "จิตรา",     lastName: "เยาวชน",   country: "TH", province: "ขอนแก่น",        organizationId: "org-kk",   departmentId: "dep-youth-kk",   status: "INACTIVE" as const, note: "พักงานชั่วคราว (ทดสอบสถานะ INACTIVE)" },
];

// ─── Scenario DSL ─────────────────────────────────────────────────────────────

type Sym = "K" | "F"; // K = BENT_KNEE (เข่างอ), F = LIFTED_FOOT (ยกเท้า)
const SYMBOL = { K: "BENT_KNEE", F: "LIFTED_FOOT" } as const;
const SYMBOL_TH = { K: "เข่างอ", F: "ยกเท้า" } as const;

type CardSpec = {
  color: "Y" | "R";
  sym: Sym;
  judge: string;
  atLap: number;
  state?: "PENDING" | "CONFIRMED" | "OVERRIDDEN";
};

const Y = (sym: Sym, judge: string, atLap: number): CardSpec => ({ color: "Y", sym, judge, atLap });
const R = (
  sym: Sym,
  judge: string,
  atLap: number,
  state: "PENDING" | "CONFIRMED" | "OVERRIDDEN",
): CardSpec => ({ color: "R", sym, judge, atLap, state });

type Outcome = "FINISH" | "DQ" | "DNF";

type AthleteScenario = {
  athleteId: string;
  bib: string;
  outcome: Outcome;
  position?: number;     // FINISH only
  laps: number;          // laps actually recorded
  paceSec: number;       // seconds per lap (= per km)
  cards?: CardSpec[];
  reason?: string;       // DNF reason
  // DQ rule code (WA reference, e.g. "TR54.13"). For a card-based DQ (4 reds) it
  // defaults to "TR54.7.5" (fourth red card); pass an explicit code for a
  // moderator post-race DQ (no 4-red requirement), or null for a plain DQ.
  dqCode?: string | null;
};

type Officials = {
  zones: string[];       // judgeIds for JUDGE positions (zone A, B, ...)
  head: string;
  logger: string;        // EVENT_LOGGER — records laps & finish times
};

type RoundConfig = {
  id: string;
  eventId: string;
  name: string;
  heatName: string;
  status: "SCHEDULED" | "ONGOING" | "FINISHED";
  distanceKm: number;    // === lapCount (1 km per lap)
  startedAt: Date | null;
  endedAt: Date | null;
  scheduledTime: Date;
  note: string;
  officials: Officials;
  scenarios: AthleteScenario[];
};

// ─── Deterministic secret-code generator ─────────────────────────────────────

const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

function secretCodeFor(roundId: string, judgeId: string): string {
  let h = 2166136261 >>> 0;
  const s = `${roundId}:${judgeId}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.codePointAt(i) ?? 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = "";
  let x = h;
  for (let i = 0; i < 6; i++) {
    out += SAFE_CHARS[x % SAFE_CHARS.length];
    x = (Math.floor(x / SAFE_CHARS.length) + (i + 1) * 7919) >>> 0;
  }
  return out;
}

// ─── Large-field scenario generator (mass open race) ──────────────────────────

const DNF_REASONS = ["บาดเจ็บกล้ามเนื้อน่อง", "เป็นตะคริว", "อ่อนเพลียจากความร้อน", "ถอนตัวตามคำแนะนำแพทย์", "หมดแรงช่วงท้าย"];

// 8 zone judges for the mass field — fills all 8 RWJS columns; ≥4 needed for DQ.
const OPEN_MASS_ZONES = ["jud-01", "jud-02", "jud-03", "jud-04", "jud-08", "jud-09", "jud-10", "jud-13"];

/** Sparse, deterministic cards for a mass-field finisher (never ≥4 reds → no DQ). */
function genSparseCards(i: number, zones: string[], lapCount: number): CardSpec[] | undefined {
  const z = (k: number) => zones[k % zones.length];
  const maxLap = Math.max(1, lapCount - 1);
  if (i === 0) return undefined; // clean leader
  if (i % 11 === 0) {
    // penalised survivor — 1 yellow + 2 CONFIRMED reds (still < 4, so NOT a DQ)
    return [Y("K", z(0), 2), R("F", z(1), Math.min(4, maxLap), "CONFIRMED"), R("K", z(2), Math.min(6, maxLap), "CONFIRMED")];
  }
  if (i % 13 === 0) return [R("F", z(0), Math.min(5, maxLap), "OVERRIDDEN")]; // overturned red
  if (i % 3 === 0) return [Y("F", z(i), 1 + (i % maxLap))];
  if (i % 5 === 0) return [Y("K", z(i + 1), 2 + (i % 3))];
  return undefined;
}

/**
 * Generate a full mass-field scenario list. Finishers get contiguous positions
 * (1..F) in list order with a gently slowing pace; DQ athletes carry exactly 4
 * CONFIRMED reds from 4 distinct zone judges; DNF athletes stop part-way.
 */
function genMassScenarios(opts: {
  ids: string[];
  zones: string[]; // ≥4 zone judges (needed for DQ)
  lapCount: number;
  bibStart: number;
  basePace: number; // sec/lap for the winner
  dqIdx?: number[];
  dnfIdx?: number[];
}): AthleteScenario[] {
  const { ids, zones, lapCount, bibStart, basePace } = opts;
  const dq = new Set(opts.dqIdx ?? []);
  const dnf = new Set(opts.dnfIdx ?? []);
  const out: AthleteScenario[] = [];
  let pos = 1;

  ids.forEach((id, i) => {
    const bib = String(bibStart + i);
    if (dq.has(i)) {
      const laps = Math.max(5, lapCount - 3 - (i % 2));
      out.push({
        athleteId: id, bib, outcome: "DQ", laps, paceSec: basePace + 34 + (i % 8),
        cards: [
          R("K", zones[0], laps - 3, "CONFIRMED"),
          R("F", zones[1], laps - 2, "CONFIRMED"),
          R("K", zones[2], laps - 1, "CONFIRMED"),
          R("F", zones[3], laps, "CONFIRMED"),
        ],
      });
      return;
    }
    if (dnf.has(i)) {
      const laps = Math.max(2, Math.floor(lapCount * 0.45) + (i % 4));
      out.push({
        athleteId: id, bib, outcome: "DNF", laps, paceSec: basePace + 28 + (i % 10),
        reason: DNF_REASONS[i % DNF_REASONS.length],
      });
      return;
    }
    const paceSec = Math.round(basePace + pos * 1.6 + (i % 5));
    out.push({ athleteId: id, bib, outcome: "FINISH", position: pos, laps: lapCount, paceSec, cards: genSparseCards(i, zones, lapCount) });
    pos++;
  });

  return out;
}

/** Cards for a mid-race (ONGOING) filler — incl. the occasional PENDING red. */
function ongoingFillerCards(i: number, zones: string[], laps: number): CardSpec[] | undefined {
  if (laps < 1) return undefined;
  const z = (k: number) => zones[k % zones.length];
  const at = (n: number) => Math.max(1, Math.min(laps, n));
  if (i % 9 === 0) return [Y("K", z(0), at(1)), R("F", z(1), at(laps), "PENDING")]; // red awaiting head judge
  if (i % 4 === 0) return [Y("F", z(i), at(laps))];
  if (i % 6 === 0) return [Y("K", z(i + 1), at(2))];
  return undefined;
}

/**
 * Filler athletes appended to a curated heat so each field is realistically deep.
 *   finished  → continue contiguous positions from `startPos`; sprinkle DQ / DNF.
 *   ongoing   → mid-race (partial laps, no finish); pending reds + maybe a DQ.
 *   scheduled → roster only (no laps / cards).
 * Bibs start at `bibStart` (keep ≥ 50 so they never collide with curated bibs).
 */
function genFillers(opts: {
  ids: string[];
  bibStart: number;
  startPos: number;
  zones: string[];
  lapCount: number;
  basePace: number;
  mode: "finished" | "ongoing" | "scheduled";
  ongoingMaxLap?: number;
  dqAt?: number[];
  dnfAt?: number[];
}): AthleteScenario[] {
  const { ids, bibStart, startPos, zones, lapCount, basePace, mode } = opts;
  const ongoingMaxLap = opts.ongoingMaxLap ?? Math.max(1, lapCount - 1);
  const dq = new Set(opts.dqAt ?? []);
  const dnf = new Set(opts.dnfAt ?? []);
  const dqCards = (laps: number): CardSpec[] => [
    R("K", zones[0], Math.max(1, laps - 3), "CONFIRMED"),
    R("F", zones[1], Math.max(1, laps - 2), "CONFIRMED"),
    R("K", zones[2], Math.max(1, laps - 1), "CONFIRMED"),
    R("F", zones[3], laps, "CONFIRMED"),
  ];
  const out: AthleteScenario[] = [];
  let pos = startPos;

  ids.forEach((id, i) => {
    const bib = String(bibStart + i);
    if (mode === "scheduled") {
      out.push({ athleteId: id, bib, outcome: "FINISH", laps: 0, paceSec: basePace + (i % 20) });
      return;
    }
    if (mode === "ongoing") {
      if (dq.has(i)) {
        const dl = Math.max(4, Math.min(ongoingMaxLap, 6));
        out.push({ athleteId: id, bib, outcome: "DQ", laps: dl, paceSec: basePace + 22 + (i % 8), cards: dqCards(dl) });
        return;
      }
      const laps = 1 + (i % ongoingMaxLap);
      out.push({ athleteId: id, bib, outcome: "FINISH", laps, paceSec: basePace + (i % 16), cards: ongoingFillerCards(i, zones, laps) });
      return;
    }
    // finished
    if (dq.has(i)) {
      const dl = Math.max(5, lapCount - 3 - (i % 2));
      out.push({ athleteId: id, bib, outcome: "DQ", laps: dl, paceSec: basePace + 30 + (i % 8), cards: dqCards(dl) });
      return;
    }
    if (dnf.has(i)) {
      const dl = Math.max(2, Math.floor(lapCount * 0.5) + (i % 4));
      out.push({ athleteId: id, bib, outcome: "DNF", laps: dl, paceSec: basePace + 24 + (i % 10), reason: DNF_REASONS[i % DNF_REASONS.length] });
      return;
    }
    const paceSec = Math.round(basePace + (pos - startPos) * 1.4 + (i % 5));
    out.push({ athleteId: id, bib, outcome: "FINISH", position: pos, laps: lapCount, paceSec, cards: genSparseCards(i + 2, zones, lapCount) });
    pos++;
  });

  return out;
}

// ─── Events ───────────────────────────────────────────────────────────────────

const SEED_EVENTS = [
  { id: "evt-draft",    name: "เทศกาลเดินทนสงกรานต์ 2026 (ร่าง)", date: new Date("2026-04-13T00:00:00Z"), location: "ถนนข้าวสาร กรุงเทพฯ",          distanceKm: "5",  lapCount: 5,  status: "DRAFT"     as const },
  { id: "evt-sched",    name: "กรีฑาเดินทนเยาวชนชิงแชมป์ภาคกลาง 2026", date: new Date("2026-07-12T00:00:00Z"), location: "สนามกีฬาธรรมศาสตร์ รังสิต", distanceKm: "10", lapCount: 10, status: "SCHEDULED" as const },
  { id: "evt-live",     name: "เดินทนชิงแชมป์ประเทศไทย 2026",       date: new Date(NOW),                    location: "สนามกีฬาแห่งชาติ ศุภชลาศัย",  distanceKm: "20", lapCount: 20, status: "ONGOING"   as const },
  { id: "evt-live2",    name: "เดินทนชิงแชมป์ประเทศไทย 2026 — รายการหญิง", date: new Date(NOW),             location: "สนามกีฬาแห่งชาติ ศุภชลาศัย",  distanceKm: "10", lapCount: 10, status: "ONGOING"   as const },
  { id: "evt-fin-nat",  name: "เดินทนชิงแชมป์ประเทศไทย 2025",       date: new Date("2025-03-15T00:00:00Z"), location: "สนามกีฬาแห่งชาติ ศุภชลาศัย",  distanceKm: "20", lapCount: 20, status: "FINISHED"  as const },
  { id: "evt-fin-asia", name: "Asian Junior Racewalk Championship 2024", date: new Date("2024-09-15T00:00:00Z"), location: "Suphachalasai Stadium, Bangkok", distanceKm: "10", lapCount: 10, status: "FINISHED" as const },
  { id: "evt-open",     name: "เดินทนโอเพ่นมหาชน 2025",               date: new Date("2025-06-21T00:00:00Z"), location: "สวนสาธารณะสวนลุมพินี กรุงเทพฯ", distanceKm: "10", lapCount: 10, status: "FINISHED" as const },
];

// ─── Rounds + scenarios ───────────────────────────────────────────────────────

// Pace tiers (seconds per km / per lap) — realistic race walk.
// Senior men ~4:15–4:50, senior women ~4:30–5:05, juniors ~4:40–5:30.

const liveStart = new Date(NOW - minutes(39));   // men's 20k final, ~lap 9
const live2Start = new Date(NOW - minutes(23));  // women's 10k final, ~lap 5
const livePrelimStart = new Date(NOW - minutes(150)); // men's prelim this morning

const ROUNDS: RoundConfig[] = [
  // ── evt-sched (SCHEDULED) — joinable pre-race; no laps/cards ───────────────
  {
    id: "rnd-sched-jm", eventId: "evt-sched", name: "ชายเยาวชน 10 กม.", heatName: "Junior Men 10 km",
    status: "SCHEDULED", distanceKm: 10, startedAt: null, endedAt: null,
    scheduledTime: new Date("2026-07-12T08:00:00Z"), note: "รอ Admin กดเริ่มจับเวลา — secret code พร้อมใช้",
    officials: { zones: ["jud-01", "jud-02", "jud-03", "jud-04"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-jm01", bib: "1", outcome: "FINISH", laps: 0, paceSec: 285 },
      { athleteId: "ath-jm04", bib: "2", outcome: "FINISH", laps: 0, paceSec: 290 },
      { athleteId: "ath-jm06", bib: "3", outcome: "FINISH", laps: 0, paceSec: 295 },
      { athleteId: "ath-jm07", bib: "4", outcome: "FINISH", laps: 0, paceSec: 300 },
      { athleteId: "ath-jm02", bib: "5", outcome: "FINISH", laps: 0, paceSec: 288 },
      { athleteId: "ath-jm03", bib: "6", outcome: "FINISH", laps: 0, paceSec: 292 },
      ...genFillers({ ids: menFill(18), bibStart: 50, startPos: 0, zones: ["jud-01", "jud-02", "jud-03", "jud-04"], lapCount: 10, basePace: 300, mode: "scheduled" }),
    ],
  },
  {
    id: "rnd-sched-jw", eventId: "evt-sched", name: "หญิงเยาวชน 10 กม.", heatName: "Junior Women 10 km",
    status: "SCHEDULED", distanceKm: 10, startedAt: null, endedAt: null,
    scheduledTime: new Date("2026-07-12T10:00:00Z"), note: "รอเริ่ม — ใช้ทดสอบ flow ตั้งแต่ต้น",
    officials: { zones: ["jud-08", "jud-09", "jud-10", "jud-15"], head: "jud-11", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-jw01", bib: "11", outcome: "FINISH", laps: 0, paceSec: 300 },
      { athleteId: "ath-jw04", bib: "12", outcome: "FINISH", laps: 0, paceSec: 305 },
      { athleteId: "ath-jw05", bib: "13", outcome: "FINISH", laps: 0, paceSec: 310 },
      { athleteId: "ath-jw02", bib: "14", outcome: "FINISH", laps: 0, paceSec: 302 },
      { athleteId: "ath-jw03", bib: "15", outcome: "FINISH", laps: 0, paceSec: 308 },
      // bibStart 100 (not 50): BIB is now event-scoped, and this event also has a
      // men's round whose fillers use 50+. Women fillers start at 100 to stay unique.
      ...genFillers({ ids: womenFill(18), bibStart: 100, startPos: 0, zones: ["jud-08", "jud-09", "jud-10", "jud-15"], lapCount: 10, basePace: 310, mode: "scheduled" }),
    ],
  },

  // ── evt-live (ONGOING) — men's 20k: a finished prelim + a LIVE final ───────
  {
    id: "rnd-live-prelim", eventId: "evt-live", name: "ชาย 20 กม. รอบคัดเลือก", heatName: "Men 20 km — Heat (qualifier)",
    status: "FINISHED", distanceKm: 20, startedAt: livePrelimStart, endedAt: new Date(livePrelimStart.getTime() + minutes(95)),
    scheduledTime: livePrelimStart, note: "รอบคัดเลือกเมื่อเช้า — ผ่านเข้ารอบชิง 8 คน",
    officials: { zones: ["jud-01", "jud-02", "jud-03", "jud-04"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-m01", bib: "1", outcome: "FINISH", position: 1, laps: 20, paceSec: 262, cards: [Y("F", "jud-02", 6)] },
      { athleteId: "ath-m03", bib: "3", outcome: "FINISH", position: 2, laps: 20, paceSec: 266 },
      { athleteId: "ath-m02", bib: "2", outcome: "FINISH", position: 3, laps: 20, paceSec: 268, cards: [Y("K", "jud-01", 4), Y("F", "jud-03", 12)] },
      { athleteId: "ath-m04", bib: "4", outcome: "FINISH", position: 4, laps: 20, paceSec: 271 },
      { athleteId: "ath-m07", bib: "7", outcome: "FINISH", position: 5, laps: 20, paceSec: 274 },
      { athleteId: "ath-m05", bib: "5", outcome: "FINISH", position: 6, laps: 20, paceSec: 277 },
      { athleteId: "ath-m08", bib: "8", outcome: "FINISH", position: 7, laps: 20, paceSec: 281, cards: [Y("K", "jud-04", 9)] },
      { athleteId: "ath-m06", bib: "6", outcome: "FINISH", position: 8, laps: 20, paceSec: 285 },
      // DQ/DNF only on fillers 16–19 (outside the final's 0–15 slice) so prelim
      // non-finishers don't reappear in the final.
      ...genFillers({ ids: menFill(20), bibStart: 50, startPos: 9, zones: ["jud-01", "jud-02", "jud-03", "jud-04"], lapCount: 20, basePace: 288, mode: "finished", dqAt: [18], dnfAt: [16, 19] }),
    ],
  },
  {
    id: "rnd-live-final", eventId: "evt-live", name: "ชาย 20 กม. รอบชิงชนะเลิศ", heatName: "Men 20 km — Final",
    status: "ONGOING", distanceKm: 20, startedAt: liveStart, endedAt: null,
    scheduledTime: liveStart, note: "กำลังแข่ง ~รอบที่ 9 — มี pending red รอ Head Judge + 1 DQ",
    officials: { zones: ["jud-01", "jud-02", "jud-03", "jud-04"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      // leader, almost clean
      { athleteId: "ath-m01", bib: "1", outcome: "FINISH", laps: 9, paceSec: 258, cards: [Y("F", "jud-03", 5)] },
      // PENDING red awaiting head judge (demo)
      { athleteId: "ath-m02", bib: "2", outcome: "FINISH", laps: 9, paceSec: 262,
        cards: [Y("K", "jud-01", 3), Y("F", "jud-02", 6), R("K", "jud-04", 8, "PENDING")] },
      // 3 confirmed reds — one away from DQ (tension)
      { athleteId: "ath-m03", bib: "3", outcome: "FINISH", laps: 8, paceSec: 268,
        cards: [Y("K", "jud-01", 2), Y("F", "jud-02", 4), Y("K", "jud-03", 5),
                R("F", "jud-01", 4, "CONFIRMED"), R("K", "jud-02", 6, "CONFIRMED"), R("F", "jud-03", 7, "CONFIRMED")] },
      { athleteId: "ath-m04", bib: "4", outcome: "FINISH", laps: 8, paceSec: 270 },
      { athleteId: "ath-m05", bib: "5", outcome: "FINISH", laps: 7, paceSec: 276, cards: [Y("K", "jud-02", 5)] },
      // DQ mid-race — 4 confirmed reds from 4 distinct zone judges + an early yellow.
      // dqCode:null → plain "DQ" (auto-DQ, no rule code) so the board/exports show
      // the un-coded case alongside the coded ones below.
      { athleteId: "ath-m08", bib: "8", outcome: "DQ", laps: 6, paceSec: 280, dqCode: null,
        cards: [Y("F", "jud-01", 1),
                R("K", "jud-01", 2, "CONFIRMED"), R("F", "jud-02", 3, "CONFIRMED"),
                R("K", "jud-03", 4, "CONFIRMED"), R("F", "jud-04", 5, "CONFIRMED")] },
      { athleteId: "ath-m07", bib: "7", outcome: "FINISH", laps: 7, paceSec: 272, cards: [Y("K", "jud-03", 3), Y("F", "jud-04", 6)] },
      { athleteId: "ath-m06", bib: "6", outcome: "FINISH", laps: 8, paceSec: 266 },
      ...genFillers({ ids: menFill(16), bibStart: 50, startPos: 0, zones: ["jud-01", "jud-02", "jud-03", "jud-04"], lapCount: 20, basePace: 290, mode: "ongoing", ongoingMaxLap: 8, dqAt: [9] }),
    ],
  },

  // ── evt-live2 (ONGOING) — women's 10k final, simpler ───────────────────────
  {
    id: "rnd-live2", eventId: "evt-live2", name: "หญิง 10 กม. รอบชิงชนะเลิศ", heatName: "Women 10 km — Final",
    status: "ONGOING", distanceKm: 10, startedAt: live2Start, endedAt: null,
    scheduledTime: live2Start, note: "กำลังแข่ง ~รอบที่ 5 — มี pending red 1 ใบ (รายการที่สองทำงานพร้อมกัน)",
    // logger = jud-07 (not jud-06) so no official is shared with evt-live on the same day.
    officials: { zones: ["jud-08", "jud-09", "jud-10", "jud-13"], head: "jud-11", logger: "jud-07" },
    scenarios: [
      { athleteId: "ath-w01", bib: "21", outcome: "FINISH", laps: 5, paceSec: 270 },
      { athleteId: "ath-w02", bib: "22", outcome: "FINISH", laps: 5, paceSec: 276, cards: [Y("F", "jud-08", 3)] },
      { athleteId: "ath-w03", bib: "23", outcome: "FINISH", laps: 4, paceSec: 282,
        cards: [Y("K", "jud-08", 2), Y("F", "jud-09", 3), R("K", "jud-10", 4, "PENDING")] },
      { athleteId: "ath-w04", bib: "24", outcome: "FINISH", laps: 4, paceSec: 288 },
      { athleteId: "ath-w05", bib: "25", outcome: "FINISH", laps: 5, paceSec: 273, cards: [Y("K", "jud-09", 4)] },
      { athleteId: "ath-w06", bib: "26", outcome: "FINISH", laps: 4, paceSec: 291 },
      ...genFillers({ ids: womenFill(15), bibStart: 50, startPos: 0, zones: ["jud-08", "jud-09", "jud-10", "jud-13"], lapCount: 10, basePace: 300, mode: "ongoing", ongoingMaxLap: 5 }),
    ],
  },

  // ── evt-fin-nat (FINISHED 2025) — men + women 20k full results ─────────────
  {
    id: "rnd-fin-m", eventId: "evt-fin-nat", name: "ชาย 20 กม.", heatName: "Men 20 km — Final",
    status: "FINISHED", distanceKm: 20, startedAt: new Date("2025-03-15T08:00:30Z"), endedAt: new Date("2025-03-15T09:40:00Z"),
    scheduledTime: new Date("2025-03-15T08:00:00Z"), note: "ผลแชมป์ชาย 2025 — 6 จบ, 1 DQ, 1 DNF",
    officials: { zones: ["jud-01", "jud-02", "jud-03", "jud-04"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-m01", bib: "1", outcome: "FINISH", position: 1, laps: 20, paceSec: 261, cards: [Y("F", "jud-02", 7)] },
      { athleteId: "ath-m02", bib: "2", outcome: "FINISH", position: 2, laps: 20, paceSec: 264 },
      { athleteId: "ath-m04", bib: "4", outcome: "FINISH", position: 3, laps: 20, paceSec: 267, cards: [Y("K", "jud-01", 5), Y("F", "jud-03", 14)] },
      { athleteId: "ath-m03", bib: "3", outcome: "FINISH", position: 4, laps: 20, paceSec: 270 },
      { athleteId: "ath-m07", bib: "7", outcome: "FINISH", position: 5, laps: 20, paceSec: 274,
        // finished but carried 2 confirmed reds (penalised, not DQ)
        cards: [Y("K", "jud-02", 6), R("K", "jud-01", 8, "CONFIRMED"), R("F", "jud-03", 13, "CONFIRMED")] },
      { athleteId: "ath-m05", bib: "5", outcome: "FINISH", position: 6, laps: 20, paceSec: 279 },
      // DQ — 4 confirmed reds
      { athleteId: "ath-m08", bib: "8", outcome: "DQ", laps: 14, paceSec: 283,
        cards: [R("K", "jud-01", 6, "CONFIRMED"), R("F", "jud-02", 9, "CONFIRMED"),
                R("K", "jud-03", 11, "CONFIRMED"), R("F", "jud-04", 14, "CONFIRMED")] },
      // DNF — withdrew
      { athleteId: "ath-m06", bib: "6", outcome: "DNF", laps: 12, paceSec: 286, reason: "บาดเจ็บกล้ามเนื้อน่อง" },
      ...genFillers({ ids: menFill(18), bibStart: 50, startPos: 7, zones: ["jud-01", "jud-02", "jud-03", "jud-04"], lapCount: 20, basePace: 282, mode: "finished", dqAt: [8], dnfAt: [3, 14] }),
    ],
  },
  {
    id: "rnd-fin-w", eventId: "evt-fin-nat", name: "หญิง 20 กม.", heatName: "Women 20 km — Final",
    status: "FINISHED", distanceKm: 20, startedAt: new Date("2025-03-15T11:00:30Z"), endedAt: new Date("2025-03-15T12:45:00Z"),
    scheduledTime: new Date("2025-03-15T11:00:00Z"), note: "ผลแชมป์หญิง 2025 — 5 จบ, 1 ตัดสิทธิ์ภายหลัง (DQ — ลดระยะทาง TR54.13)",
    officials: { zones: ["jud-08", "jud-09", "jud-10", "jud-04"], head: "jud-11", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-w01", bib: "21", outcome: "FINISH", position: 1, laps: 20, paceSec: 276 },
      { athleteId: "ath-w03", bib: "23", outcome: "FINISH", position: 2, laps: 20, paceSec: 280, cards: [Y("F", "jud-08", 8)] },
      { athleteId: "ath-w02", bib: "22", outcome: "FINISH", position: 3, laps: 20, paceSec: 283 },
      { athleteId: "ath-w05", bib: "25", outcome: "FINISH", position: 4, laps: 20, paceSec: 287, cards: [Y("K", "jud-09", 6), R("K", "jud-10", 10, "OVERRIDDEN")] },
      { athleteId: "ath-w04", bib: "24", outcome: "FINISH", position: 5, laps: 20, paceSec: 292 },
      // Post-race moderator DQ (rule found on review) — shortening the distance.
      { athleteId: "ath-w06", bib: "26", outcome: "DQ", laps: 18, paceSec: 296, dqCode: "TR54.13" },
      // bibStart 100 — event-scoped BIB; men's round (rnd-fin-m) fillers use 50+.
      ...genFillers({ ids: womenFill(16), bibStart: 100, startPos: 6, zones: ["jud-08", "jud-09", "jud-10", "jud-04"], lapCount: 20, basePace: 290, mode: "finished", dqAt: [10], dnfAt: [4] }),
    ],
  },

  // ── evt-fin-asia (FINISHED 2024) — international junior, men + women 10k ────
  {
    id: "rnd-asia-jm", eventId: "evt-fin-asia", name: "Junior Men 10 km Final", heatName: "Asian Junior Men 10 km",
    status: "FINISHED", distanceKm: 10, startedAt: new Date("2024-09-15T08:00:30Z"), endedAt: new Date("2024-09-15T08:56:00Z"),
    scheduledTime: new Date("2024-09-15T08:00:00Z"), note: "5 จบ, 1 DQ, 1 DNF — มี overridden red 1 ราย",
    officials: { zones: ["jud-01", "jud-02", "jud-12", "jud-13"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-jm01", bib: "1", outcome: "FINISH", position: 1, laps: 10, paceSec: 282, cards: [Y("K", "jud-01", 4)] },
      { athleteId: "ath-jm02", bib: "2", outcome: "FINISH", position: 2, laps: 10, paceSec: 286, cards: [Y("F", "jud-02", 3), Y("K", "jud-12", 7)] },
      { athleteId: "ath-jm03", bib: "3", outcome: "FINISH", position: 3, laps: 10, paceSec: 290 },
      { athleteId: "ath-jm04", bib: "4", outcome: "FINISH", position: 4, laps: 10, paceSec: 295,
        cards: [Y("K", "jud-01", 3), Y("F", "jud-02", 5), Y("K", "jud-12", 6), R("K", "jud-13", 8, "CONFIRMED")] },
      // overridden-red survivor — finished 5th
      { athleteId: "ath-jm05", bib: "5", outcome: "FINISH", position: 5, laps: 10, paceSec: 299,
        cards: [Y("F", "jud-01", 4), Y("F", "jud-02", 7), R("F", "jud-12", 8, "OVERRIDDEN")] },
      // DQ — 4 confirmed reds
      { athleteId: "ath-jm06", bib: "6", outcome: "DQ", laps: 6, paceSec: 300,
        cards: [Y("K", "jud-01", 1),
                R("K", "jud-01", 2, "CONFIRMED"), R("F", "jud-02", 3, "CONFIRMED"),
                R("K", "jud-12", 5, "CONFIRMED"), R("K", "jud-13", 6, "CONFIRMED")] },
      // DNF
      { athleteId: "ath-jm07", bib: "7", outcome: "DNF", laps: 7, paceSec: 305, reason: "บาดเจ็บข้อเท้า" },
      ...genFillers({ ids: menFill(14), bibStart: 50, startPos: 6, zones: ["jud-01", "jud-02", "jud-12", "jud-13"], lapCount: 10, basePace: 300, mode: "finished", dqAt: [9], dnfAt: [5] }),
    ],
  },
  {
    id: "rnd-asia-jw", eventId: "evt-fin-asia", name: "Junior Women 10 km Final", heatName: "Asian Junior Women 10 km",
    status: "FINISHED", distanceKm: 10, startedAt: new Date("2024-09-15T09:30:30Z"), endedAt: new Date("2024-09-15T10:25:00Z"),
    scheduledTime: new Date("2024-09-15T09:30:00Z"), note: "4 จบ, 1 ตัดสิทธิ์ภายหลัง (DQ — ใช้อุปกรณ์อิเล็กทรอนิกส์ TR7.1[TR6.3.2])",
    officials: { zones: ["jud-01", "jud-02", "jud-12", "jud-13"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-jw01", bib: "11", outcome: "FINISH", position: 1, laps: 10, paceSec: 300, cards: [Y("F", "jud-02", 5)] },
      { athleteId: "ath-jw02", bib: "12", outcome: "FINISH", position: 2, laps: 10, paceSec: 305 },
      { athleteId: "ath-jw03", bib: "13", outcome: "FINISH", position: 3, laps: 10, paceSec: 309, cards: [Y("K", "jud-01", 4), Y("F", "jud-12", 8)] },
      { athleteId: "ath-jw05", bib: "15", outcome: "FINISH", position: 4, laps: 10, paceSec: 314 },
      // Post-race moderator DQ (rule found on review) — use of an electronic device.
      { athleteId: "ath-jw04", bib: "14", outcome: "DQ", laps: 9, paceSec: 318, dqCode: "TR7.1[TR6.3.2]" },
      // bibStart 100 — event-scoped BIB; men's round (rnd-asia-jm) fillers use 50+.
      ...genFillers({ ids: womenFill(14), bibStart: 100, startPos: 5, zones: ["jud-01", "jud-02", "jud-12", "jud-13"], lapCount: 10, basePace: 308, mode: "finished", dnfAt: [7] }),
    ],
  },

  // ── evt-open (FINISHED) — large / edge field sizes (50 / 2 / 1 athletes) ────
  {
    id: "rnd-open-mass", eventId: "evt-open", name: "ชายมหาชน 10 กม.", heatName: "Open Mass Men 10 km",
    status: "FINISHED", distanceKm: 10,
    startedAt: new Date("2025-06-21T07:00:30Z"), endedAt: new Date("2025-06-21T08:12:00Z"),
    scheduledTime: new Date("2025-06-21T07:00:00Z"),
    note: "สนามใหญ่ 50 คน — 43 จบ, 3 DQ, 4 DNF (ทดสอบตาราง/รายงานสนามใหญ่ + กรรมการ 8 โซน)",
    officials: { zones: OPEN_MASS_ZONES, head: "jud-05", logger: "jud-06" },
    scenarios: genMassScenarios({
      ids: MASS_IDS, zones: OPEN_MASS_ZONES, lapCount: 10, bibStart: 101, basePace: 268,
      dqIdx: [13, 30, 47], dnfIdx: [6, 21, 38, 49],
    }),
  },
  {
    id: "rnd-open-duel", eventId: "evt-open", name: "ดวลชิงดำ ชาย 5 กม.", heatName: "Elite Duel Men 5 km",
    status: "FINISHED", distanceKm: 5,
    startedAt: new Date("2025-06-21T09:00:30Z"), endedAt: new Date("2025-06-21T09:23:00Z"),
    scheduledTime: new Date("2025-06-21T09:00:00Z"),
    note: "แมตช์ตัวต่อตัว 2 คน (ทดสอบสนามขนาดเล็กสุด)",
    officials: { zones: ["jud-01", "jud-02", "jud-03", "jud-04"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: DUEL_IDS[0], bib: "201", outcome: "FINISH", position: 1, laps: 5, paceSec: 254, cards: [Y("F", "jud-02", 3)] },
      { athleteId: DUEL_IDS[1], bib: "202", outcome: "FINISH", position: 2, laps: 5, paceSec: 259,
        cards: [Y("K", "jud-01", 2), R("F", "jud-03", 4, "CONFIRMED")] },
    ],
  },
  {
    id: "rnd-open-solo", eventId: "evt-open", name: "ทดสอบเวลาเดี่ยว 3 กม.", heatName: "Solo Time Trial 3 km",
    status: "FINISHED", distanceKm: 3,
    startedAt: new Date("2025-06-21T10:00:30Z"), endedAt: new Date("2025-06-21T10:14:00Z"),
    scheduledTime: new Date("2025-06-21T10:00:00Z"),
    note: "ทดสอบเวลาแบบเดี่ยว 1 คน (เคสสุดขั้ว — กรรมการ 3 โซน)",
    officials: { zones: ["jud-01", "jud-02", "jud-03"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: SOLO_ID, bib: "301", outcome: "FINISH", position: 1, laps: 3, paceSec: 268 },
    ],
  },
];

// ─── Generator — turn RoundConfig[] into consistent DB rows ───────────────────

type LapRow = { id: string; roundId: string; athleteId: string; lapNumber: number; timeMs: number; recordedBy: string; source: string };
type FinishRow = { id: string; roundId: string; athleteId: string; timeMs: number; position: number };
type CardRow = {
  id: string; roundId: string; athleteId: string; judgeId: string;
  color: "YELLOW" | "RED"; symbol: "BENT_KNEE" | "LIFTED_FOOT";
  state: "PENDING" | "CONFIRMED" | "OVERRIDDEN" | null; decidedBy: string | null; decidedAt: Date | null; issuedAt: Date;
};
type RoundAthleteRow = { roundId: string; athleteId: string; sortOrder: number; status: "OK" | "DQ" | "DNF"; position: number | null; dqReasonCode: string | null };
type EventAthleteRow = { eventId: string; athleteId: string; bib: string };
type OfficialRow = { roundId: string; judgeId: string; position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER"; secretCode: string; zone: string | null };
type LogRow = {
  id: string; roundId: string; timestamp: Date; actorId: string; actorName: string; actorRole: string;
  actionType: string; targetAthleteId?: string; targetBib?: string; lapNumber?: number; details?: string; canOverride?: boolean;
};

const REVIEW_DELAY = seconds(75); // head judge takes ~75s to decide a red

function judgeName(id: string): string {
  return SEED_JUDGES.find((j) => j.id === id)?.name ?? id;
}

// Masters/senior 5-year age bands. BIBs are generated as [band][3-digit seq], so
// they always match the required format (5 digits for 35-95, 6 for 100/105) and
// showcase the age-group feature. Athletes are spread round-robin across bands.
const AGE_BANDS = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105];

function masterBib(nthInEvent: number): string {
  const band = AGE_BANDS[nthInEvent % AGE_BANDS.length];
  const seq = Math.floor(nthInEvent / AGE_BANDS.length) + 1;
  return `${band}${String(seq).padStart(3, "0")}`;
}

function buildAll() {
  const roundAthletes: RoundAthleteRow[] = [];
  // eventAthlete is keyed by "eventId|athleteId" for dedup across rounds.
  const eventAthleteMap = new Map<string, EventAthleteRow>();
  // "eventId|athleteId" → generated BIB, reused for activity-log targetBib.
  const bibByEventAthlete = new Map<string, string>();
  // eventId → count of distinct athletes seen so far (drives BIB generation).
  const eventAthleteSeq = new Map<string, number>();
  const officials: OfficialRow[] = [];
  const cards: CardRow[] = [];
  const laps: LapRow[] = [];
  const finishes: FinishRow[] = [];
  const logs: LogRow[] = [];

  for (const rc of ROUNDS) {
    const headName = judgeName(rc.officials.head);

    // Officials (zones → JUDGE, plus head judge + event logger)
    rc.officials.zones.forEach((jid, i) => {
      officials.push({
        roundId: rc.id, judgeId: jid, position: "JUDGE",
        secretCode: secretCodeFor(rc.id, jid), zone: `Zone ${String.fromCodePoint(65 + i)}`,
      });
    });
    officials.push(
      { roundId: rc.id, judgeId: rc.officials.head, position: "HEAD_JUDGE", secretCode: secretCodeFor(rc.id, rc.officials.head), zone: null },
      { roundId: rc.id, judgeId: rc.officials.logger, position: "EVENT_LOGGER", secretCode: secretCodeFor(rc.id, rc.officials.logger), zone: null },
    );

    // Round start/end logs (only when the race has actually run)
    if (rc.startedAt) {
      logs.push({
        id: `log-${rc.id}-start`, roundId: rc.id, timestamp: rc.startedAt,
        actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
        actionType: "round_start", details: `เริ่ม ${rc.heatName}`,
      });
    }
    if (rc.endedAt) {
      logs.push({
        id: `log-${rc.id}-end`, roundId: rc.id, timestamp: rc.endedAt,
        actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
        actionType: "round_end", details: `จบ ${rc.heatName}`,
      });
    }

    // Start-list order within the round = scenario order (drives Lap Time numbering).
    let raSeq = 0;
    for (const sc of rc.scenarios) {
      // EventAthlete row (deduplicated — BIB is event-level, not round-level).
      // The same athlete may appear in several rounds of one event (e.g. prelim →
      // final) and keeps one BIB; we record it once, on first sighting.
      const eaKey = `${rc.eventId}|${sc.athleteId}`;
      if (!eventAthleteMap.has(eaKey)) {
        // Generate a valid masters BIB: [age band][3-digit seq], unique per event.
        const n = eventAthleteSeq.get(rc.eventId) ?? 0;
        const bib = masterBib(n);
        eventAthleteSeq.set(rc.eventId, n + 1);
        bibByEventAthlete.set(eaKey, bib);
        eventAthleteMap.set(eaKey, { eventId: rc.eventId, athleteId: sc.athleteId, bib });
      }
      const athleteBib = bibByEventAthlete.get(eaKey) ?? "";

      // RoundAthlete row (no bib — bib lives on EventAthlete). Keep a reference so
      // the DQ block below can stamp the resolved dqReasonCode onto it.
      const raRow: RoundAthleteRow = {
        roundId: rc.id, athleteId: sc.athleteId,
        sortOrder: raSeq++,
        status: sc.outcome === "FINISH" ? "OK" : sc.outcome,
        position: sc.outcome === "FINISH" ? sc.position ?? null : null,
        dqReasonCode: null,
      };
      roundAthletes.push(raRow);

      // No timing/cards for not-yet-started rounds
      if (!rc.startedAt) continue;
      const startMs = rc.startedAt.getTime();

      // Cumulative lap times (deterministic small jitter, always monotonic).
      // A finisher's LAST crossing IS the finish — stored as a FinishTime, NOT as
      // a lap row — so a finisher emits lap rows 1..(N-1) plus a finish, exactly
      // like the live flow (recordLapTime ×(N-1) + recordFinishTime for the Nth).
      const isFinisher = sc.outcome === "FINISH" && sc.position != null && sc.laps > 0;
      const lapRowCount = isFinisher ? sc.laps - 1 : sc.laps;
      const lapCum: number[] = [0];
      for (let lap = 1; lap <= sc.laps; lap++) {
        const jitter = (((lap * 37) % 11) - 5) * 1000; // ±5s
        const firstLapPenalty = lap === 1 ? 3000 : 0;   // settle-in
        lapCum[lap] = lapCum[lap - 1] + sc.paceSec * 1000 + jitter + firstLapPenalty;
        if (lap <= lapRowCount) {
          laps.push({
            id: `lap-${rc.id}-${sc.athleteId}-${lap}`,
            roundId: rc.id, athleteId: sc.athleteId, lapNumber: lap,
            timeMs: lapCum[lap], recordedBy: rc.officials.logger, source: "EVENT_LOGGER",
          });
        }
      }

      // FinishTime = final lap's cumulative time (the last crossing IS the finish)
      if (sc.outcome === "FINISH" && sc.position != null && sc.laps > 0) {
        finishes.push({
          id: `ft-${rc.id}-${sc.athleteId}`, roundId: rc.id, athleteId: sc.athleteId,
          timeMs: lapCum[sc.laps], position: sc.position,
        });
      }

      // Cards — issued mid-lap; reds reviewed ~75s later
      const confirmedRedDecisions: { judge: string; at: number }[] = [];
      for (const card of sc.cards ?? []) {
        const lapStart = lapCum[Math.max(0, card.atLap - 1)];
        const issuedMs = startMs + lapStart + Math.floor(sc.paceSec * 500); // mid-lap
        const issuedAt = new Date(issuedMs);
        const isRed = card.color === "R";
        const decided = isRed && (card.state === "CONFIRMED" || card.state === "OVERRIDDEN");
        const decidedAt = decided ? new Date(issuedMs + REVIEW_DELAY) : null;
        cards.push({
          id: `card-${rc.id}-${sc.athleteId}-${card.judge}-${card.color}-${card.atLap}`,
          roundId: rc.id, athleteId: sc.athleteId, judgeId: card.judge,
          color: isRed ? "RED" : "YELLOW", symbol: SYMBOL[card.sym],
          state: isRed ? card.state ?? "PENDING" : null,
          decidedBy: decided ? rc.officials.head : null,
          decidedAt, issuedAt,
        });

        // Card-issuance activity log (judge → field)
        logs.push({
          id: `log-${rc.id}-${sc.athleteId}-${card.judge}-${card.color}-${card.atLap}`,
          roundId: rc.id, timestamp: issuedAt,
          actorId: card.judge, actorName: judgeName(card.judge), actorRole: "JUDGE",
          actionType: isRed ? "red_card" : "yellow_card",
          targetAthleteId: sc.athleteId, targetBib: athleteBib,
          details: SYMBOL_TH[card.sym], canOverride: isRed,
        });

        if (isRed && card.state === "OVERRIDDEN" && decidedAt) {
          logs.push({
            id: `log-${rc.id}-${sc.athleteId}-${card.judge}-ovr-${card.atLap}`,
            roundId: rc.id, timestamp: decidedAt,
            actorId: rc.officials.head, actorName: headName, actorRole: "HEAD_JUDGE",
            actionType: "red_card_override",
            targetAthleteId: sc.athleteId, targetBib: athleteBib,
            details: `ยกเลิกใบแดง (${SYMBOL_TH[card.sym]})`,
          });
        }
        if (isRed && card.state === "CONFIRMED" && decidedAt) {
          confirmedRedDecisions.push({ judge: card.judge, at: decidedAt.getTime() });
        }
      }

      // DQ handling — two realistic paths:
      //   • card-based: ≥4 confirmed reds from 4 distinct judges → auto-DQ. The WA
      //     code is TR54.7.5 (fourth red card) by default; pass dqCode:null for a
      //     plain "DQ" (no code).
      //   • moderator post-race: an explicit dqCode with <4 reds → the new
      //     "ตัดสิทธิ์ภายหลัง" flow (rule found after the race). No 4-red requirement.
      if (sc.outcome === "DQ") {
        const distinctJudges = new Set(confirmedRedDecisions.map((d) => d.judge));
        const cardBased = distinctJudges.size >= 4;
        if (cardBased) {
          raRow.dqReasonCode = sc.dqCode === undefined ? "TR54.7.5" : sc.dqCode;
          const fourthAt = confirmedRedDecisions.map((d) => d.at).sort((a, b) => a - b)[3];
          const codeSuffix = raRow.dqReasonCode ? ` [${dqReasonLabel(raRow.dqReasonCode)}]` : "";
          logs.push({
            id: `log-${rc.id}-${sc.athleteId}-dq`, roundId: rc.id, timestamp: new Date(fourthAt),
            actorId: rc.officials.head, actorName: headName, actorRole: "HEAD_JUDGE",
            actionType: "athlete_dq", targetAthleteId: sc.athleteId, targetBib: athleteBib,
            details: `ตัดสิทธิ์ (DQ) — ครบใบแดง 4 ใบ จาก 4 กรรมการ${codeSuffix}`,
          });
        } else if (sc.dqCode) {
          raRow.dqReasonCode = sc.dqCode;
          const atMs = startMs + lapCum[sc.laps] + seconds(45);
          logs.push({
            id: `log-${rc.id}-${sc.athleteId}-dq`, roundId: rc.id, timestamp: new Date(atMs),
            actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
            actionType: "moderator_override_status", targetAthleteId: sc.athleteId, targetBib: athleteBib,
            details: `ตัดสิทธิ์ภายหลังการแข่งขัน (DQ) — ${dqReasonLabel(sc.dqCode)}`,
          });
        } else {
          throw new Error(
            `[seed] ${rc.id}/${sc.athleteId} is DQ but has ${distinctJudges.size} confirmed reds and no dqCode (need 4 distinct judges or an explicit dqCode)`,
          );
        }
      }

      // DNF log
      if (sc.outcome === "DNF" && sc.laps > 0) {
        const atMs = startMs + lapCum[sc.laps] + seconds(20);
        const dnfReasonSuffix = sc.reason ? ` — ${sc.reason}` : "";
        logs.push({
          id: `log-${rc.id}-${sc.athleteId}-dnf`, roundId: rc.id, timestamp: new Date(atMs),
          actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
          actionType: "athlete_dnf", targetAthleteId: sc.athleteId, targetBib: athleteBib,
          details: `ไม่จบการแข่งขัน (DNF, รอบที่ ${sc.laps})${dnfReasonSuffix}`,
        });
      }
    }
  }

  return { roundAthletes, eventAthletes: [...eventAthleteMap.values()], officials, cards, laps, finishes, logs };
}

const GEN = buildAll();

// currentLap per round = furthest recorded lap (0 for not-started)
const CURRENT_LAP = new Map<string, number>();
for (const rc of ROUNDS) {
  const maxLap = rc.scenarios.reduce((m, s) => (rc.startedAt ? Math.max(m, s.laps) : 0), 0);
  CURRENT_LAP.set(rc.id, maxLap);
}

// ─── Reset ────────────────────────────────────────────────────────────────────

async function reset() {
  console.log("[seed] --reset: clearing all tables");
  await prisma.roundActivityLog.deleteMany({});
  await prisma.finishTime.deleteMany({});
  await prisma.lapTime.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.roundOfficial.deleteMany({});
  await prisma.roundAthlete.deleteMany({});
  await prisma.eventAthlete.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.athlete.deleteMany({});
  await prisma.affiliation.deleteMany({});
  await prisma.judge.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertUser(input: (typeof SEED_USERS)[number]) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const nameFields = { name: input.name, prefix: null, firstName: input.name, lastName: null };
  return prisma.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email, ...nameFields, title: input.title, role: input.role,
      status: input.status, isRoot: input.isRoot, permissions: input.permissions,
      password: passwordHash, emailVerified: new Date(),
      lastActiveAt: input.lastActiveAt, suspendedAt: input.status === "SUSPENDED" ? new Date() : null,
    },
    update: {
      ...nameFields, title: input.title, role: input.role, status: input.status,
      isRoot: input.isRoot, permissions: input.permissions,
      lastActiveAt: input.lastActiveAt, suspendedAt: input.status === "SUSPENDED" ? new Date() : null,
      ...(RESET_FLAG ? { password: passwordHash } : {}),
    },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (RESET_FLAG) await reset();

  for (const u of SEED_USERS) await upsertUser(u);
  console.log(`[seed] users:        ${SEED_USERS.length}`);

  // Attribute seed records to the Root owner for the created/updated-by audit.
  const ownerRow = await prisma.user.findUnique({
    where: { email: "owner@racewalk.local" },
    select: { id: true },
  });
  const ownerId = ownerRow?.id ?? null;

  // Organizations → Departments → Judges → Affiliations → Athletes
  // (ordered so foreign keys always resolve: dept→org, judge→org/dept,
  //  affiliation→judge(head), athlete→affiliation).
  for (const o of SEED_ORGANIZATIONS) {
    await prisma.organization.upsert({
      where: { id: o.id },
      create: { ...o, createdById: ownerId, updatedById: ownerId },
      update: { name: o.name, updatedById: ownerId },
    });
  }
  console.log(`[seed] organizations: ${SEED_ORGANIZATIONS.length}`);

  for (const d of SEED_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: d.id }, create: { ...d, createdById: ownerId, updatedById: ownerId },
      update: { name: d.name, organizationId: d.organizationId, updatedById: ownerId },
    });
  }
  console.log(`[seed] departments:  ${SEED_DEPARTMENTS.length}`);

  for (const j of SEED_JUDGES) {
    const payload = {
      name: j.name, prefix: j.prefix ?? null, firstName: j.firstName, lastName: j.lastName ?? null,
      country: toAlpha2(j.country), province: j.province ?? null,
      organizationId: j.organizationId ?? null, departmentId: j.departmentId ?? null,
      status: j.status, note: j.note ?? null,
      createdById: ownerId, updatedById: ownerId,
    };
    await prisma.judge.upsert({ where: { id: j.id }, create: { id: j.id, ...payload }, update: payload });
  }
  console.log(`[seed] judges:       ${SEED_JUDGES.length}`);

  for (const a of SEED_AFFILIATIONS) {
    const payload = {
      name: a.name, country: toAlpha2(a.country), province: a.province ?? null,
      headJudgeId: a.headJudgeId ?? null, joinedAt: a.joinedAt ?? null, note: a.note ?? null,
      createdById: ownerId, updatedById: ownerId,
    };
    await prisma.affiliation.upsert({ where: { id: a.id }, create: { id: a.id, ...payload }, update: payload });
  }
  console.log(`[seed] affiliations: ${SEED_AFFILIATIONS.length}`);

  for (const a of [...SEED_ATHLETES, ...OPEN_ATHLETES, ...MEN_FILL, ...WOMEN_FILL]) {
    const { firstName, lastName } = splitName(a.name);
    const payload = {
      name: a.name, prefix: null, firstName, lastName,
      country: toAlpha2(a.country), province: a.province ?? null,
      club: a.club ?? null, note: a.note ?? null, affiliationId: a.affiliationId,
      createdById: ownerId, updatedById: ownerId,
    };
    await prisma.athlete.upsert({ where: { id: a.id }, create: { id: a.id, ...payload }, update: payload });
  }
  console.log(`[seed] athletes:     ${SEED_ATHLETES.length + OPEN_ATHLETES.length + MEN_FILL.length + WOMEN_FILL.length}`);

  for (const e of SEED_EVENTS) {
    await prisma.event.upsert({
      where: { id: e.id }, create: { ...e, createdById: ownerId, updatedById: ownerId },
      update: { name: e.name, status: e.status, date: e.date, location: e.location, distanceKm: e.distanceKm, lapCount: e.lapCount, updatedById: ownerId },
    });
  }
  console.log(`[seed] events:       ${SEED_EVENTS.length}`);

  for (const rc of ROUNDS) {
    const data = {
      eventId: rc.eventId, name: rc.name, status: rc.status, distanceKm: String(rc.distanceKm),
      lapCount: rc.distanceKm, currentLap: CURRENT_LAP.get(rc.id) ?? 0,
      scheduledTime: rc.scheduledTime,
      expectedEndTime: new Date(rc.scheduledTime.getTime() + minutes(rc.distanceKm * 5)),
      startedAt: rc.startedAt, endedAt: rc.endedAt, heatName: rc.heatName, note: rc.note,
    };
    await prisma.round.upsert({ where: { id: rc.id }, create: { id: rc.id, ...data }, update: data });
  }
  console.log(`[seed] rounds:       ${ROUNDS.length}`);

  for (const ea of GEN.eventAthletes) {
    await prisma.eventAthlete.upsert({
      where: { eventId_athleteId: { eventId: ea.eventId, athleteId: ea.athleteId } },
      create: ea, update: { bib: ea.bib, deletedAt: null },
    });
  }
  console.log(`[seed] eventAthletes: ${GEN.eventAthletes.length}`);

  for (const ra of GEN.roundAthletes) {
    await prisma.roundAthlete.upsert({
      where: { roundId_athleteId: { roundId: ra.roundId, athleteId: ra.athleteId } },
      create: ra,
      update: { sortOrder: ra.sortOrder, status: ra.status, position: ra.position, dqReasonCode: ra.dqReasonCode },
    });
  }
  console.log(`[seed] roundAthletes:  ${GEN.roundAthletes.length}`);

  for (const ro of GEN.officials) {
    await prisma.roundOfficial.upsert({
      where: { roundId_judgeId: { roundId: ro.roundId, judgeId: ro.judgeId } },
      create: ro, update: { position: ro.position, secretCode: ro.secretCode, zone: ro.zone },
    });
  }
  console.log(`[seed] roundOfficials: ${GEN.officials.length}`);

  for (const c of GEN.cards) {
    await prisma.card.upsert({
      where: { id: c.id }, create: c,
      update: { color: c.color, symbol: c.symbol, state: c.state, decidedBy: c.decidedBy, decidedAt: c.decidedAt, issuedAt: c.issuedAt },
    });
  }
  console.log(`[seed] cards:        ${GEN.cards.length}`);

  for (const lap of GEN.laps) {
    await prisma.lapTime.upsert({
      where: { id: lap.id }, create: lap,
      update: { timeMs: lap.timeMs, recordedBy: lap.recordedBy, source: lap.source },
    });
  }
  console.log(`[seed] lapTimes:     ${GEN.laps.length}`);

  for (const ft of GEN.finishes) {
    await prisma.finishTime.upsert({
      where: { id: ft.id }, create: ft, update: { timeMs: ft.timeMs, position: ft.position },
    });
  }
  console.log(`[seed] finishTimes:  ${GEN.finishes.length}`);

  for (const log of GEN.logs) {
    await prisma.roundActivityLog.upsert({
      where: { id: log.id }, create: log,
      update: { actorName: log.actorName, actorRole: log.actorRole, actionType: log.actionType, details: log.details ?? null },
    });
  }
  console.log(`[seed] activityLogs: ${GEN.logs.length}`);

  // Joinable secret codes (SCHEDULED / ONGOING rounds)
  console.log("\n[seed] === Joinable secret codes (SCHEDULED / ONGOING) ===");
  for (const rc of ROUNDS) {
    if (rc.status === "FINISHED") continue;
    console.log(`  ${rc.id} — ${rc.name} (${rc.status})`);
    for (const ro of GEN.officials.filter((o) => o.roundId === rc.id)) {
      const zoneSuffix = ro.zone ? `  ${ro.zone}` : "";
      console.log(`      ${ro.position.padEnd(13)} ${judgeName(ro.judgeId).padEnd(22)} ${ro.secretCode}${zoneSuffix}`);
    }
  }

  console.log("\n[seed] === Summary ===");
  console.log(`  Events:    ${SEED_EVENTS.length} (1 DRAFT, 1 SCHEDULED, 2 ONGOING, 3 FINISHED)`);
  console.log(`  Rounds:    ${ROUNDS.length}  |  Athletes: ${SEED_ATHLETES.length + OPEN_ATHLETES.length + MEN_FILL.length + WOMEN_FILL.length}  |  Judges: ${SEED_JUDGES.length}`);
  console.log(`  Field sizes: every heat is padded to a realistic 18–28; open meet adds a 50 / 2 / 1 field`);
  console.log(`  Cards:     ${GEN.cards.length}  |  Laps: ${GEN.laps.length}  |  Finishes: ${GEN.finishes.length}  |  Logs: ${GEN.logs.length}`);
  console.log("\n[seed] done");
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
