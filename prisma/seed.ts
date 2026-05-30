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
 *   4. Diversity — DRAFT / SCHEDULED / 2× ONGOING / 2× FINISHED events, men's &
 *      women's heats kept separate, national + international (Asian Junior) fields,
 *      3-letter ISO country codes (matches the admin forms).
 *
 * Secret codes are generated deterministically; the joinable (SCHEDULED/ONGOING)
 * ones are printed in the run summary.
 *
 * See docs/TEST_SCENARIOS.md for the walkthrough.
 */
import "./load-env";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

const RESET_FLAG = process.argv.includes("--reset");

// "Now" anchor for ONGOING rounds so elapsed time looks live.
const NOW = Date.now();
const minutes = (n: number) => n * 60_000;
const seconds = (n: number) => n * 1_000;

// ─── Auth users ───────────────────────────────────────────────────────────────

const SEED_USER_LAST_ACTIVE = new Date(NOW - 2 * 60 * 60 * 1000);

const SEED_USERS = [
  { email: "owner@racewalk.local",     name: "ผู้ดูแลระบบหลัก",  title: "Owner",         password: "owner1234",     role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: SEED_USER_LAST_ACTIVE },
  { email: "events@racewalk.local",    name: "ผู้จัดการแข่งขัน",  title: "Event Manager", password: "events1234",    role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: new Date(NOW - 26 * 60 * 60 * 1000) },
  { email: "score@racewalk.local",     name: "เจ้าหน้าที่คะแนน",  title: "Score Officer", password: "score1234",     role: "ADMIN" as const, status: "ACTIVE" as const,    lastActiveAt: new Date(NOW - 3 * 24 * 60 * 60 * 1000) },
  { email: "suspended@racewalk.local", name: "อดีตผู้ดูแล",       title: "Former Admin",  password: "suspended1234", role: "ADMIN" as const, status: "SUSPENDED" as const, lastActiveAt: new Date("2024-08-01T00:00:00.000Z") },
];

// ─── Affiliations ─────────────────────────────────────────────────────────────

const SEED_AFFILIATIONS = [
  { id: "aff-bkk",   name: "ชมรมเดินทนกรุงเทพมหานคร", country: "THA", province: "กรุงเทพมหานคร", headOfAffiliation: "นายสมชาย ใจดี",     joinedAt: new Date("2018-05-01"), note: "สโมสรหลักภาคกลาง" },
  { id: "aff-army",  name: "สโมสรกีฬากองทัพบก",       country: "THA", province: "กรุงเทพมหานคร", headOfAffiliation: "พันเอก ภาคภูมิ มั่นคง", joinedAt: new Date("2016-04-22"), note: "ทีมต้นสังกัดมีทุนสนับสนุน" },
  { id: "aff-ku",    name: "มหาวิทยาลัยเกษตรศาสตร์",  country: "THA", province: "กรุงเทพมหานคร", headOfAffiliation: "ผศ.ดร.วรรณา ขยันดี",  joinedAt: new Date("2019-08-10"), note: "ทีมนักกีฬามหาวิทยาลัย" },
  { id: "aff-cm",    name: "สโมสรเดินทนเชียงใหม่",     country: "THA", province: "เชียงใหม่",      headOfAffiliation: "นางสาวชนิดา วิ่งไว",   joinedAt: new Date("2020-01-10"), note: "ตัวแทนภาคเหนือ" },
  { id: "aff-kk",    name: "ขอนแก่นแอธเลติก",          country: "THA", province: "ขอนแก่น",        headOfAffiliation: "นางพิมพา ใจเย็น",     joinedAt: new Date("2021-11-05"), note: "ตัวแทนภาคอีสาน" },
  { id: "aff-hy",    name: "หาดใหญ่แอธเลติกคลับ",      country: "THA", province: "สงขลา",          headOfAffiliation: "นายดนัย ทะเลใต้",     joinedAt: new Date("2022-06-20"), note: "ตัวแทนภาคใต้" },
  { id: "aff-nat",   name: "ทีมชาติไทย (เดินทน)",       country: "THA", province: "กรุงเทพมหานคร", headOfAffiliation: "สมาคมกรีฑาฯ",         joinedAt: new Date("2015-01-01"), note: "นักกีฬาทีมชาติ" },
  { id: "aff-vnm",   name: "Vietnam Athletics",        country: "VNM", province: null,             headOfAffiliation: "Mr. Tran Quoc",       joinedAt: new Date("2023-02-01"), note: "คณะนักกีฬาเวียดนาม" },
  { id: "aff-mys",   name: "Malaysia Athletics",       country: "MYS", province: null,             headOfAffiliation: "Mr. Lim Wei",         joinedAt: new Date("2023-02-01"), note: "คณะนักกีฬามาเลเซีย" },
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

// ─── Judges ───────────────────────────────────────────────────────────────────

const SEED_JUDGES = [
  { id: "jud-01", name: "สมศักดิ์ ตัดสิน",      country: "THA", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสนาม",   organization: "สมาคมกรีฑาแห่งประเทศไทย", status: "ACTIVE"   as const, note: "กรรมการอาวุโส โซน A" },
  { id: "jud-02", name: "วิชัย มองทาง",         country: "THA", province: "นนทบุรี",        department: "ฝ่ายกรรมการสนาม",   organization: "สมาคมกรีฑาแห่งประเทศไทย", status: "ACTIVE"   as const, note: "โซน B" },
  { id: "jud-03", name: "ประเสริฐ พินิจ",        country: "THA", province: "ปทุมธานี",       department: "ฝ่ายกรรมการสนาม",   organization: "ชมรมเดินทนกรุงเทพฯ",       status: "ACTIVE"   as const, note: "โซน C" },
  { id: "jud-04", name: "อนุชา ฟ้าใส",          country: "THA", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสนาม",   organization: "สมาคมกรีฑาแห่งประเทศไทย", status: "ACTIVE"   as const, note: "โซน D" },
  { id: "jud-05", name: "ดร.สมหวัง วินิจฉัย",    country: "THA", province: "กรุงเทพมหานคร", department: "หัวหน้ากรรมการ",    organization: "สมาคมกรีฑาแห่งประเทศไทย", status: "ACTIVE"   as const, note: "หัวหน้ากรรมการ (Chief)" },
  { id: "jud-06", name: "มานพ จดบันทึก",        country: "THA", province: "กรุงเทพมหานคร", department: "ฝ่ายบันทึกผล",      organization: "สมาคมกรีฑาแห่งประเทศไทย", status: "ACTIVE"   as const, note: "Event Logger" },
  { id: "jud-07", name: "สุรชัย จับเวลา",        country: "THA", province: "กรุงเทพมหานคร", department: "ฝ่ายจับเวลา",       organization: "สมาคมกรีฑาแห่งประเทศไทย", status: "ACTIVE"   as const, note: "Timekeeper" },
  { id: "jud-08", name: "เกรียงไกร เคี่ยวเข็ญ",   country: "THA", province: "เชียงใหม่",      department: "ฝ่ายกรรมการสนาม",   organization: "สโมสรเดินทนเชียงใหม่",     status: "ACTIVE"   as const, note: "แผงกรรมการชุดสอง" },
  { id: "jud-09", name: "ชัยวัฒน์ เฝ้าโค้ง",      country: "THA", province: "ขอนแก่น",        department: "ฝ่ายกรรมการสนาม",   organization: "ขอนแก่นแอธเลติก",          status: "ACTIVE"   as const, note: "แผงกรรมการชุดสอง" },
  { id: "jud-10", name: "ธีรพล สังเกต",         country: "THA", province: "สงขลา",          department: "ฝ่ายกรรมการสนาม",   organization: "หาดใหญ่แอธเลติกคลับ",      status: "ACTIVE"   as const, note: "แผงกรรมการชุดสอง" },
  { id: "jud-11", name: "พ.ต.อ.วิรัช ยุติธรรม",  country: "THA", province: "กรุงเทพมหานคร", department: "หัวหน้ากรรมการ",    organization: "สโมสรกีฬากองทัพบก",        status: "ACTIVE"   as const, note: "หัวหน้ากรรมการชุดสอง" },
  { id: "jud-12", name: "Park Min-jun",         country: "KOR", province: null,             department: "International Panel", organization: "Asian Athletics Federation", status: "ACTIVE" as const, note: "กรรมการรับเชิญจากเกาหลี" },
  { id: "jud-13", name: "ดร.อรพิน สากล",        country: "THA", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสากล",   organization: "IAAF Thailand",            status: "ACTIVE"   as const, note: "IAAF certified" },
  { id: "jud-14", name: "นพ.ภานุวัฒน์ ดูแล",     country: "THA", province: "กรุงเทพมหานคร", department: "ฝ่ายแพทย์สนาม",     organization: "สมาคมกรีฑาแห่งประเทศไทย", status: "ACTIVE"   as const, note: "แพทย์สนาม + กรรมการรอง" },
  { id: "jud-15", name: "ครูจิตรา เยาวชน",       country: "THA", province: "ขอนแก่น",        department: "ฝ่ายกรรมการเยาวชน",  organization: "ขอนแก่นแอธเลติก",          status: "INACTIVE" as const, note: "พักงานชั่วคราว (ทดสอบสถานะ INACTIVE)" },
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
    h ^= s.charCodeAt(i);
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

// ─── Events ───────────────────────────────────────────────────────────────────

const SEED_EVENTS = [
  { id: "evt-draft",    name: "เทศกาลเดินทนสงกรานต์ 2026 (ร่าง)", date: new Date("2026-04-13T00:00:00Z"), location: "ถนนข้าวสาร กรุงเทพฯ",          distanceKm: "5",  lapCount: 5,  status: "DRAFT"     as const, isCurrent: false },
  { id: "evt-sched",    name: "กรีฑาเดินทนเยาวชนชิงแชมป์ภาคกลาง 2026", date: new Date("2026-07-12T00:00:00Z"), location: "สนามกีฬาธรรมศาสตร์ รังสิต", distanceKm: "10", lapCount: 10, status: "SCHEDULED" as const, isCurrent: false },
  { id: "evt-live",     name: "เดินทนชิงแชมป์ประเทศไทย 2026",       date: new Date(NOW),                    location: "สนามกีฬาแห่งชาติ ศุภชลาศัย",  distanceKm: "20", lapCount: 20, status: "ONGOING"   as const, isCurrent: true  },
  { id: "evt-live2",    name: "เดินทนชิงแชมป์ประเทศไทย 2026 — รายการหญิง", date: new Date(NOW),             location: "สนามกีฬาแห่งชาติ ศุภชลาศัย",  distanceKm: "10", lapCount: 10, status: "ONGOING"   as const, isCurrent: false },
  { id: "evt-fin-nat",  name: "เดินทนชิงแชมป์ประเทศไทย 2025",       date: new Date("2025-03-15T00:00:00Z"), location: "สนามกีฬาแห่งชาติ ศุภชลาศัย",  distanceKm: "20", lapCount: 20, status: "FINISHED"  as const, isCurrent: false },
  { id: "evt-fin-asia", name: "Asian Junior Racewalk Championship 2024", date: new Date("2024-09-15T00:00:00Z"), location: "Suphachalasai Stadium, Bangkok", distanceKm: "10", lapCount: 10, status: "FINISHED" as const, isCurrent: false },
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
      // DQ mid-race — 4 confirmed reds from 4 distinct zone judges + an early yellow
      { athleteId: "ath-m08", bib: "8", outcome: "DQ", laps: 6, paceSec: 280,
        cards: [Y("F", "jud-01", 1),
                R("K", "jud-01", 2, "CONFIRMED"), R("F", "jud-02", 3, "CONFIRMED"),
                R("K", "jud-03", 4, "CONFIRMED"), R("F", "jud-04", 5, "CONFIRMED")] },
      { athleteId: "ath-m07", bib: "7", outcome: "FINISH", laps: 7, paceSec: 272, cards: [Y("K", "jud-03", 3), Y("F", "jud-04", 6)] },
      { athleteId: "ath-m06", bib: "6", outcome: "FINISH", laps: 8, paceSec: 266 },
    ],
  },

  // ── evt-live2 (ONGOING) — women's 10k final, simpler ───────────────────────
  {
    id: "rnd-live2", eventId: "evt-live2", name: "หญิง 10 กม. รอบชิงชนะเลิศ", heatName: "Women 10 km — Final",
    status: "ONGOING", distanceKm: 10, startedAt: live2Start, endedAt: null,
    scheduledTime: live2Start, note: "กำลังแข่ง ~รอบที่ 5 — มี pending red 1 ใบ (รายการที่สองทำงานพร้อมกัน)",
    officials: { zones: ["jud-08", "jud-09", "jud-10", "jud-13"], head: "jud-11", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-w01", bib: "21", outcome: "FINISH", laps: 5, paceSec: 270 },
      { athleteId: "ath-w02", bib: "22", outcome: "FINISH", laps: 5, paceSec: 276, cards: [Y("F", "jud-08", 3)] },
      { athleteId: "ath-w03", bib: "23", outcome: "FINISH", laps: 4, paceSec: 282,
        cards: [Y("K", "jud-08", 2), Y("F", "jud-09", 3), R("K", "jud-10", 4, "PENDING")] },
      { athleteId: "ath-w04", bib: "24", outcome: "FINISH", laps: 4, paceSec: 288 },
      { athleteId: "ath-w05", bib: "25", outcome: "FINISH", laps: 5, paceSec: 273, cards: [Y("K", "jud-09", 4)] },
      { athleteId: "ath-w06", bib: "26", outcome: "FINISH", laps: 4, paceSec: 291 },
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
    ],
  },
  {
    id: "rnd-fin-w", eventId: "evt-fin-nat", name: "หญิง 20 กม.", heatName: "Women 20 km — Final",
    status: "FINISHED", distanceKm: 20, startedAt: new Date("2025-03-15T11:00:30Z"), endedAt: new Date("2025-03-15T12:45:00Z"),
    scheduledTime: new Date("2025-03-15T11:00:00Z"), note: "ผลแชมป์หญิง 2025 — 5 จบ, 1 DNF",
    officials: { zones: ["jud-08", "jud-09", "jud-10", "jud-04"], head: "jud-11", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-w01", bib: "21", outcome: "FINISH", position: 1, laps: 20, paceSec: 276 },
      { athleteId: "ath-w03", bib: "23", outcome: "FINISH", position: 2, laps: 20, paceSec: 280, cards: [Y("F", "jud-08", 8)] },
      { athleteId: "ath-w02", bib: "22", outcome: "FINISH", position: 3, laps: 20, paceSec: 283 },
      { athleteId: "ath-w05", bib: "25", outcome: "FINISH", position: 4, laps: 20, paceSec: 287, cards: [Y("K", "jud-09", 6), R("K", "jud-10", 10, "OVERRIDDEN")] },
      { athleteId: "ath-w04", bib: "24", outcome: "FINISH", position: 5, laps: 20, paceSec: 292 },
      { athleteId: "ath-w06", bib: "26", outcome: "DNF", laps: 9, paceSec: 296, reason: "ถอนตัว — เป็นตะคริว" },
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
    ],
  },
  {
    id: "rnd-asia-jw", eventId: "evt-fin-asia", name: "Junior Women 10 km Final", heatName: "Asian Junior Women 10 km",
    status: "FINISHED", distanceKm: 10, startedAt: new Date("2024-09-15T09:30:30Z"), endedAt: new Date("2024-09-15T10:25:00Z"),
    scheduledTime: new Date("2024-09-15T09:30:00Z"), note: "4 จบ, 1 DNF",
    officials: { zones: ["jud-01", "jud-02", "jud-12", "jud-13"], head: "jud-05", logger: "jud-06" },
    scenarios: [
      { athleteId: "ath-jw01", bib: "11", outcome: "FINISH", position: 1, laps: 10, paceSec: 300, cards: [Y("F", "jud-02", 5)] },
      { athleteId: "ath-jw02", bib: "12", outcome: "FINISH", position: 2, laps: 10, paceSec: 305 },
      { athleteId: "ath-jw03", bib: "13", outcome: "FINISH", position: 3, laps: 10, paceSec: 309, cards: [Y("K", "jud-01", 4), Y("F", "jud-12", 8)] },
      { athleteId: "ath-jw05", bib: "15", outcome: "FINISH", position: 4, laps: 10, paceSec: 314 },
      { athleteId: "ath-jw04", bib: "14", outcome: "DNF", laps: 5, paceSec: 318, reason: "ถอนตัว — อ่อนเพลียจากความร้อน" },
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
type RoundAthleteRow = { roundId: string; athleteId: string; bib: string; status: "OK" | "DQ" | "DNF"; position: number | null };
type OfficialRow = { roundId: string; judgeId: string; position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER"; secretCode: string; zone: string | null };
type LogRow = {
  id: string; roundId: string; timestamp: Date; actorId: string; actorName: string; actorRole: string;
  actionType: string; targetAthleteId?: string; targetBib?: string; lapNumber?: number; details?: string; canOverride?: boolean;
};

const REVIEW_DELAY = seconds(75); // head judge takes ~75s to decide a red

function judgeName(id: string): string {
  return SEED_JUDGES.find((j) => j.id === id)?.name ?? id;
}

function buildAll() {
  const roundAthletes: RoundAthleteRow[] = [];
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
        secretCode: secretCodeFor(rc.id, jid), zone: `Zone ${String.fromCharCode(65 + i)}`,
      });
    });
    officials.push({ roundId: rc.id, judgeId: rc.officials.head, position: "HEAD_JUDGE", secretCode: secretCodeFor(rc.id, rc.officials.head), zone: null });
    officials.push({ roundId: rc.id, judgeId: rc.officials.logger, position: "EVENT_LOGGER", secretCode: secretCodeFor(rc.id, rc.officials.logger), zone: null });

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

    for (const sc of rc.scenarios) {
      // RoundAthlete row
      roundAthletes.push({
        roundId: rc.id, athleteId: sc.athleteId, bib: sc.bib,
        status: sc.outcome === "FINISH" ? "OK" : sc.outcome,
        position: sc.outcome === "FINISH" ? sc.position ?? null : null,
      });

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
          targetAthleteId: sc.athleteId, targetBib: sc.bib,
          details: SYMBOL_TH[card.sym], canOverride: isRed,
        });

        if (isRed && card.state === "OVERRIDDEN" && decidedAt) {
          logs.push({
            id: `log-${rc.id}-${sc.athleteId}-${card.judge}-ovr-${card.atLap}`,
            roundId: rc.id, timestamp: decidedAt,
            actorId: rc.officials.head, actorName: headName, actorRole: "HEAD_JUDGE",
            actionType: "red_card_override",
            targetAthleteId: sc.athleteId, targetBib: sc.bib,
            details: `ยกเลิกใบแดง (${SYMBOL_TH[card.sym]})`,
          });
        }
        if (isRed && card.state === "CONFIRMED" && decidedAt) {
          confirmedRedDecisions.push({ judge: card.judge, at: decidedAt.getTime() });
        }
      }

      // Rule check + DQ log: a DQ athlete must have ≥4 confirmed reds from 4 judges
      if (sc.outcome === "DQ") {
        const distinctJudges = new Set(confirmedRedDecisions.map((d) => d.judge));
        if (distinctJudges.size < 4) {
          throw new Error(
            `[seed] ${rc.id}/${sc.athleteId} is DQ but has ${distinctJudges.size} confirmed reds (need 4 distinct judges)`,
          );
        }
        const fourthAt = confirmedRedDecisions.map((d) => d.at).sort((a, b) => a - b)[3]!;
        logs.push({
          id: `log-${rc.id}-${sc.athleteId}-dq`, roundId: rc.id, timestamp: new Date(fourthAt),
          actorId: rc.officials.head, actorName: headName, actorRole: "HEAD_JUDGE",
          actionType: "athlete_dq", targetAthleteId: sc.athleteId, targetBib: sc.bib,
          details: "ตัดสิทธิ์ (DQ) — ครบใบแดง 4 ใบ จาก 4 กรรมการ",
        });
      }

      // DNF log
      if (sc.outcome === "DNF" && sc.laps > 0) {
        const atMs = startMs + lapCum[sc.laps] + seconds(20);
        logs.push({
          id: `log-${rc.id}-${sc.athleteId}-dnf`, roundId: rc.id, timestamp: new Date(atMs),
          actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
          actionType: "athlete_dnf", targetAthleteId: sc.athleteId, targetBib: sc.bib,
          details: `ไม่จบการแข่งขัน (DNF, รอบที่ ${sc.laps})${sc.reason ? ` — ${sc.reason}` : ""}`,
        });
      }
    }
  }

  return { roundAthletes, officials, cards, laps, finishes, logs };
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
  await prisma.round.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.judge.deleteMany({});
  await prisma.athlete.deleteMany({});
  await prisma.affiliation.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertUser(input: (typeof SEED_USERS)[number]) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email, name: input.name, title: input.title, role: input.role,
      status: input.status, password: passwordHash, emailVerified: new Date(),
      lastActiveAt: input.lastActiveAt, suspendedAt: input.status === "SUSPENDED" ? new Date() : null,
    },
    update: {
      name: input.name, title: input.title, role: input.role, status: input.status,
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

  for (const a of SEED_AFFILIATIONS) {
    await prisma.affiliation.upsert({
      where: { id: a.id }, create: a,
      update: { name: a.name, country: a.country, province: a.province ?? null, headOfAffiliation: a.headOfAffiliation ?? null, joinedAt: a.joinedAt ?? null, note: a.note ?? null },
    });
  }
  console.log(`[seed] affiliations: ${SEED_AFFILIATIONS.length}`);

  for (const a of SEED_ATHLETES) {
    await prisma.athlete.upsert({
      where: { id: a.id }, create: a,
      update: { name: a.name, country: a.country, province: a.province ?? null, club: a.club ?? null, note: a.note ?? null, affiliationId: a.affiliationId },
    });
  }
  console.log(`[seed] athletes:     ${SEED_ATHLETES.length}`);

  for (const j of SEED_JUDGES) {
    await prisma.judge.upsert({
      where: { id: j.id }, create: j,
      update: { name: j.name, country: j.country, province: j.province ?? null, department: j.department ?? null, organization: j.organization ?? null, status: j.status, note: j.note ?? null },
    });
  }
  console.log(`[seed] judges:       ${SEED_JUDGES.length}`);

  for (const e of SEED_EVENTS) {
    await prisma.event.upsert({
      where: { id: e.id }, create: e,
      update: { name: e.name, status: e.status, isCurrent: e.isCurrent, date: e.date, location: e.location, distanceKm: e.distanceKm, lapCount: e.lapCount },
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

  for (const ra of GEN.roundAthletes) {
    await prisma.roundAthlete.upsert({
      where: { roundId_athleteId: { roundId: ra.roundId, athleteId: ra.athleteId } },
      create: ra, update: { bib: ra.bib, status: ra.status, position: ra.position },
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
      console.log(`      ${ro.position.padEnd(13)} ${judgeName(ro.judgeId).padEnd(22)} ${ro.secretCode}${ro.zone ? `  ${ro.zone}` : ""}`);
    }
  }

  console.log("\n[seed] === Summary ===");
  console.log(`  Events:    ${SEED_EVENTS.length} (1 DRAFT, 1 SCHEDULED, 2 ONGOING, 2 FINISHED)`);
  console.log(`  Rounds:    ${ROUNDS.length}  |  Athletes: ${SEED_ATHLETES.length}  |  Judges: ${SEED_JUDGES.length}`);
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
