/**
 * Database seed — comprehensive lifecycle coverage.
 *
 * Run:
 *   npm run db:seed           # idempotent — adds missing rows only
 *   npm run db:seed:reset     # wipes all tables and reseeds
 *
 * Coverage:
 *   Events:    DRAFT (empty) / SCHEDULED (pre-race) / ONGOING (live) / FINISHED (past)
 *   Rounds:    SCHEDULED / ONGOING (mid-race) / FINISHED (with finish times)
 *   Cards:     YELLOW (both symbols) / RED PENDING / RED CONFIRMED / RED OVERRIDDEN
 *   Athletes:  clean / multi-yellow / pending-red / confirmed-red / DQ / DNF / finished
 *   Officials: JUDGE × 4 / HEAD_JUDGE / EVENT_LOGGER / TIMEKEEPER
 *   Users:     3 ACTIVE admins + 1 SUSPENDED admin (to test login block)
 *
 * See docs/TEST_SCENARIOS.md for the full walkthrough + secret codes.
 */
import "./load-env";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

const RESET_FLAG = process.argv.includes("--reset");

// ─── Auth users ───────────────────────────────────────────────────────────────

const SEED_USER_LAST_ACTIVE = new Date(Date.now() - 2 * 60 * 60 * 1000);

const SEED_USERS = [
  {
    email: "owner@racewalk.local",
    name: "Owner",
    title: "Owner",
    password: "owner1234",
    role: "ADMIN" as const,
    status: "ACTIVE" as const,
    lastActiveAt: SEED_USER_LAST_ACTIVE,
  },
  {
    email: "events@racewalk.local",
    name: "Event Manager",
    title: "Event Manager",
    password: "events1234",
    role: "ADMIN" as const,
    status: "ACTIVE" as const,
    lastActiveAt: new Date(SEED_USER_LAST_ACTIVE.getTime() - 24 * 60 * 60 * 1000),
  },
  {
    email: "score@racewalk.local",
    name: "Score Officer",
    title: "Score Officer",
    password: "score1234",
    role: "ADMIN" as const,
    status: "ACTIVE" as const,
    lastActiveAt: new Date(SEED_USER_LAST_ACTIVE.getTime() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    email: "suspended@racewalk.local",
    name: "Suspended Admin",
    title: "Former Admin",
    password: "suspended1234",
    role: "ADMIN" as const,
    status: "SUSPENDED" as const,
    lastActiveAt: new Date("2024-01-15T00:00:00.000Z"),
  },
];

// ─── Affiliations ─────────────────────────────────────────────────────────────

const SEED_AFFILIATIONS = [
  {
    id: "aff-001",
    name: "ชมรมเดินทนกรุงเทพฯ",
    country: "TH",
    province: "กรุงเทพมหานคร",
    headOfAffiliation: "นายสมชาย ใจดี",
    joinedAt: new Date("2020-05-01"),
    note: "สมาชิกหลักภาคกลาง",
  },
  {
    id: "aff-002",
    name: "Bangkok Road Runners",
    country: "TH",
    province: "กรุงเทพมหานคร",
    headOfAffiliation: "Jane Manager",
    joinedAt: new Date("2021-03-15"),
    note: "กลุ่มนักวิ่งและเดินทนกรุงเทพ",
  },
  {
    id: "aff-003",
    name: "ChiangMai Striders",
    country: "TH",
    province: "เชียงใหม่",
    headOfAffiliation: "คุณชนิดา วิ่งไว",
    joinedAt: new Date("2022-01-10"),
    note: "สโมสรภาคเหนือ",
  },
  {
    id: "aff-004",
    name: "Hat Yai Athletic Club",
    country: "TH",
    province: "สงขลา",
    headOfAffiliation: "Luis Garcia",
    joinedAt: new Date("2023-06-20"),
    note: "สโมสรภาคใต้ — รองรับนักกีฬาต่างชาติ",
  },
  {
    id: "aff-005",
    name: "ทีมชาติไทย (เดินทน)",
    country: "TH",
    province: "กรุงเทพมหานคร",
    headOfAffiliation: "พลเอก สมเกียรติ ใจกล้า",
    joinedAt: new Date("2019-01-01"),
    note: "ทีมตัวแทนประเทศไทย — National squad",
  },
  {
    id: "aff-006",
    name: "มหาวิทยาลัยเกษตรศาสตร์",
    country: "TH",
    province: "กรุงเทพมหานคร",
    headOfAffiliation: "ผศ.ดร.วรรณา ขยันดี",
    joinedAt: new Date("2020-08-10"),
    note: "ทีมนักกีฬามหาวิทยาลัย — Junior + Senior",
  },
  {
    id: "aff-007",
    name: "กองทัพบก สโมสรกีฬา",
    country: "TH",
    province: "กรุงเทพมหานคร",
    headOfAffiliation: "พันเอก ภาคภูมิ มั่นคง",
    joinedAt: new Date("2018-04-22"),
    note: "ทีมจากกองทัพ — มีทุนสนับสนุน",
  },
  {
    id: "aff-008",
    name: "ขอนแก่นวิ่งดี",
    country: "TH",
    province: "ขอนแก่น",
    headOfAffiliation: "นางพิมพา ใจเย็น",
    joinedAt: new Date("2022-11-05"),
    note: "ทีมตัวแทนภาคอีสาน",
  },
  {
    id: "aff-009",
    name: "Phuket Beach Walkers",
    country: "TH",
    province: "ภูเก็ต",
    headOfAffiliation: "Mr. Daniel Wong",
    joinedAt: new Date("2023-12-01"),
    note: "ชมรมเดินทนชายหาด — ฝึกซ้อมในสภาพอากาศร้อน",
  },
];

// ─── Athletes (12 total — variety of countries) ──────────────────────────────

const SEED_ATHLETES = [
  { id: "ath-001", name: "Somchai Rakdee",       country: "TH", province: "กรุงเทพมหานคร", club: "ชมรมเดินทนกรุงเทพฯ", note: "ตัวเต็งรอบชิง", affiliationId: "aff-001" },
  { id: "ath-002", name: "Jane Doe",             country: "TH", province: "กรุงเทพมหานคร", club: "Bangkok Road Runners", note: "มีใบแดงรอ Head Judge", affiliationId: "aff-002" },
  { id: "ath-003", name: "Chanida Runfast",      country: "TH", province: "เชียงใหม่",       club: "ChiangMai Striders", note: "ใกล้ครบใบเหลือง", affiliationId: "aff-003" },
  { id: "ath-004", name: "Luis Garcia",          country: "ES", province: "สงขลา",           club: "Hat Yai Athletic Club", note: "DQ ใน round-2", affiliationId: "aff-004" },
  { id: "ath-005", name: "Siriwan Walkfast",     country: "TH", province: "กรุงเทพมหานคร", club: "ชมรมเดินทนกรุงเทพฯ", note: "นักกีฬาใหม่รอบชิง", affiliationId: "aff-001" },
  { id: "ath-006", name: "John Smith",           country: "GB", province: "กรุงเทพมหานคร", club: "Bangkok Road Runners", note: "DQ ประวัติ evt-past", affiliationId: "aff-002" },
  { id: "ath-007", name: "Nattapong Citywalker", country: "TH", province: "กรุงเทพมหานคร", club: "Bangkok Road Runners", note: "แชมป์ evt-past", affiliationId: "aff-002" },
  { id: "ath-008", name: "Mai Tanaka",           country: "JP", province: "เชียงใหม่",       club: "ChiangMai Striders", note: "pre-race round-pre", affiliationId: "aff-003" },
  { id: "ath-009", name: "Peter Schmidt",        country: "DE", province: "กรุงเทพมหานคร", club: "Bangkok Road Runners", note: "DNF evt-past", affiliationId: "aff-002" },
  { id: "ath-010", name: "Anna Kowalski",        country: "PL", province: "สงขลา",           club: "Hat Yai Athletic Club", affiliationId: "aff-004" },
  { id: "ath-011", name: "Niran Stridefast",     country: "TH", province: "กรุงเทพมหานคร", club: "ชมรมเดินทนกรุงเทพฯ", affiliationId: "aff-001" },
  { id: "ath-012", name: "Maria Lopez",          country: "MX", province: "กรุงเทพมหานคร", club: "Bangkok Road Runners", note: "อันดับ 3 evt-past", affiliationId: "aff-002" },
  // Junior + International + Women — for evt-past-2 (Asian Junior Championship 2024)
  { id: "ath-013", name: "วิชัย วงศ์ไชย",         country: "TH", province: "กรุงเทพมหานคร", club: "ทีมชาติเยาวชน",          note: "Junior 18 ปี — แชมป์ Asian Junior 2024", affiliationId: "aff-005" },
  { id: "ath-014", name: "พงศกร ทองดี",          country: "TH", province: "กรุงเทพมหานคร", club: "ทีมมหาวิทยาลัย",         note: "Junior 19 ปี — นักกีฬามหาวิทยาลัย",       affiliationId: "aff-006" },
  { id: "ath-015", name: "Nguyen Van An",        country: "VN", province: null,             club: null,                       note: "Junior 18 — Vietnam delegation",            affiliationId: null     },
  { id: "ath-016", name: "อภิชาต ก้าวไกล",        country: "TH", province: "กรุงเทพมหานคร", club: "ทีมทหารบก",              note: "DQ ครบใบแดง 4 ใบ ใน evt-past-2",           affiliationId: "aff-007" },
  { id: "ath-017", name: "ธนพล วิ่งเร็ว",          country: "TH", province: "ขอนแก่น",        club: "ขอนแก่นวิ่งดี",          note: "DNF (ถอนตัว lap 7) ใน evt-past-2",          affiliationId: "aff-008" },
  { id: "ath-018", name: "Hassan Yusof",         country: "MY", province: null,             club: null,                       note: "Junior 19 — Malaysia delegation, อันดับ 3", affiliationId: null     },
  { id: "ath-019", name: "อรัญญา สวยใส",          country: "TH", province: "กรุงเทพมหานคร", club: "ทีมหญิงชาติ",            note: "Female junior — DNF (lap 4) ใน evt-past-2", affiliationId: "aff-005" },
  { id: "ath-020", name: "Soe Min Tun",          country: "MM", province: null,             club: null,                       note: "Junior 20 — Myanmar, red ถูก override",     affiliationId: null     },
  { id: "ath-021", name: "ภานุพงศ์ ทรหด",         country: "TH", province: "ภูเก็ต",          club: "Phuket Beach Walkers",   note: "นักกีฬาภาคใต้",                            affiliationId: "aff-009" },
  { id: "ath-022", name: "ปริญญา รุ่งโรจน์",       country: "TH", province: "กรุงเทพมหานคร", club: "ทีมมหาวิทยาลัย",         note: "Junior 19 — เกือบ DQ (2 red confirmed)",   affiliationId: "aff-006" },
];

// ─── Judges (10 total) ────────────────────────────────────────────────────────

const SEED_JUDGES = [
  { id: "jud-001", name: "สมศักดิ์ กรรมการ",   country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสนาม", organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", status: "ACTIVE"   as const, note: "Zone A — Coach A" },
  { id: "jud-002", name: "วิชัย ตัดสิน",         country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสนาม", organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", status: "ACTIVE"   as const, note: "Zone B — Coach B" },
  { id: "jud-003", name: "ประเสริฐ มองทาง",     country: "TH", province: "นนทบุรี",       department: "ฝ่ายกรรมการสนาม", organization: "ชมรมเดินทนกรุงเทพฯ",            status: "ACTIVE"   as const, note: "Zone C — Coach C" },
  { id: "jud-004", name: "อนุชา ฟ้าใส",          country: "TH", province: "ปทุมธานี",      department: "ฝ่ายกรรมการสนาม", organization: "Bangkok Road Runners",          status: "ACTIVE"   as const, note: "Zone D — Coach D" },
  { id: "jud-005", name: "Head Judge Ref",      country: "TH", province: "กรุงเทพมหานคร", department: "หัวหน้ากรรมการ",  organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", status: "ACTIVE"   as const, note: "Head Judge หลัก" },
  { id: "jud-006", name: "Event Logger 1",      country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายบันทึกผล",    organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", status: "ACTIVE"   as const, note: "Event Logger" },
  { id: "jud-007", name: "Timekeeper 1",        country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายจับเวลา",     organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", status: "ACTIVE"   as const, note: "Timekeeper" },
  { id: "jud-008", name: "Coach E",             country: "TH", province: "เชียงใหม่",     department: "ฝ่ายกรรมการสนาม", organization: "ChiangMai Striders",            status: "ACTIVE"   as const, note: "pre-race judge" },
  { id: "jud-009", name: "Head Judge Backup",   country: "TH", province: "เชียงใหม่",     department: "หัวหน้ากรรมการ",  organization: "ChiangMai Striders",            status: "INACTIVE" as const, note: "Head Judge สำรอง (ปิดใช้งานชั่วคราว)" },
  { id: "jud-010", name: "Timekeeper Pre-race", country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายจับเวลา",     organization: "Bangkok Road Runners",          status: "ACTIVE"   as const, note: "pre-race timekeeper" },
  // Senior + international + multi-role judges
  { id: "jud-011", name: "ดร.สมหวัง วินิจฉัย",    country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสากล", organization: "IAAF Thailand",                 status: "ACTIVE"   as const, note: "IAAF certified — international experience" },
  { id: "jud-012", name: "Coach Park Min-jun",   country: "KR", province: null,             department: "International Panel", organization: "Asian Athletics Federation",   status: "ACTIVE"   as const, note: "Visiting judge from Korea — Asian Junior" },
  { id: "jud-013", name: "นพ.ภานุวัฒน์ ใจดี",     country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายแพทย์สนาม",    organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", status: "ACTIVE"   as const, note: "แพทย์สนาม + กรรมการรอง" },
  { id: "jud-014", name: "พ.ต.อ.วิรัช ฟ้าใส",      country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสนาม",  organization: "กองทัพบก สโมสรกีฬา",            status: "ACTIVE"   as const, note: "อดีตนักกีฬาเดินทน — กรรมการอาวุโส" },
  { id: "jud-015", name: "ครูจิตรา รักดี",         country: "TH", province: "ขอนแก่น",        department: "ฝ่ายกรรมการเยาวชน", organization: "ขอนแก่นวิ่งดี",                 status: "ACTIVE"   as const, note: "ครูพละ — เชี่ยวชาญรุ่นเยาวชน" },
];

// ─── Events ───────────────────────────────────────────────────────────────────

const SEED_EVENTS = [
  {
    id:         "evt-001",
    name:       "Racewalk Championship 2025",
    date:       new Date("2025-03-15T00:00:00.000Z"),
    location:   "สนามกีฬาแห่งชาติ",
    distanceKm: "20",
    lapCount:   20,   // 1 km/lap stadium loop
    status:     "ONGOING" as const,
    isCurrent:  true,
  },
  {
    id:         "evt-empty",
    name:       "Songkran Race Walk Festival (Draft)",
    date:       new Date("2026-04-13T00:00:00.000Z"),
    location:   "Khao San Road",
    distanceKm: "10",
    lapCount:   1,    // default, admin not yet configured
    status:     "DRAFT" as const,
    isCurrent:  false,
  },
  {
    id:         "evt-pre",
    name:       "Bangkok City Racewalk 2026",
    date:       new Date("2026-06-20T00:00:00.000Z"),
    location:   "Bangkok City Route",
    distanceKm: "10",
    lapCount:   10,   // 1 km/lap city route
    status:     "SCHEDULED" as const,
    isCurrent:  false,
  },
  {
    id:         "evt-past",
    name:       "ChiangMai Open 2024",
    date:       new Date("2024-11-15T00:00:00.000Z"),
    location:   "Chiang Mai Sports Complex",
    distanceKm: "10",
    lapCount:   25,   // 400m track loop demo
    status:     "FINISHED" as const,
    isCurrent:  false,
  },
  {
    id:         "evt-past-2",
    name:       "Asian Junior Racewalk Championship 2024",
    date:       new Date("2024-09-15T00:00:00.000Z"),
    location:   "Suphachalasai Stadium, Bangkok",
    distanceKm: "10",
    lapCount:   10,   // 1 km/lap stadium loop
    status:     "FINISHED" as const,
    isCurrent:  false,
  },
];

// ─── Rounds ───────────────────────────────────────────────────────────────────

// Today's date for ONGOING round scheduledTime (so elapsed shows reasonable value)
const RECENT_RACE_START = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago

const SEED_ROUNDS = [
  // evt-001 — ONGOING championship, 2 rounds
  {
    id:              "round-1",
    eventId:         "evt-001",
    name:            "รอบคัดเลือก",
    status:          "FINISHED" as const,
    distanceKm:      "10",
    scheduledTime:   new Date("2025-03-15T08:00:00.000Z"),
    expectedEndTime: new Date("2025-03-15T10:30:00.000Z"),
    startedAt:       new Date("2025-03-15T08:00:30.000Z"),
    endedAt:         new Date("2025-03-15T08:55:00.000Z"),
    heatName:        "รุ่นทั่วไป ระยะ 10 กม.",
    lapCount:        10,
    currentLap:      10,
    note:            "รอบแรกสำหรับคัดเลือก",
  },
  {
    id:              "round-2",
    eventId:         "evt-001",
    name:            "รอบชิงชนะเลิศ",
    // ONGOING mid-race — populated with cards, pending reds, lap times, DQ for UI demo.
    // For "fresh start" testing, use evt-pre/round-pre (SCHEDULED + clean).
    status:          "ONGOING" as const,
    distanceKm:      "20",
    scheduledTime:   RECENT_RACE_START,
    expectedEndTime: new Date(RECENT_RACE_START.getTime() + 3 * 60 * 60 * 1000),
    startedAt:       RECENT_RACE_START,  // synced timer source — all roles see same elapsed
    endedAt:         null,
    heatName:        "รุ่นทั่วไป ระยะ 20 กม.",
    lapCount:        20,
    currentLap:      7,  // consistent with seeded lap times (leader at lap 7)
    note:            "รอบจริง — pending red รอ Head Judge ยืนยัน + 1 DQ จาก 4 confirmed reds",
  },

  // evt-pre — SCHEDULED, 1 round ready to start (no startedAt yet)
  {
    id:              "round-pre",
    eventId:         "evt-pre",
    name:            "รอบเดียว",
    status:          "SCHEDULED" as const,
    distanceKm:      "10",
    scheduledTime:   new Date("2026-06-20T08:00:00.000Z"),
    expectedEndTime: new Date("2026-06-20T10:00:00.000Z"),
    startedAt:       null,
    endedAt:         null,
    heatName:        "รุ่นทั่วไป ระยะ 10 กม.",
    lapCount:        10,
    currentLap:      0,
    note:            "Pre-race setup — รอ Admin กดเริ่มจับเวลา",
  },

  // evt-past — FINISHED, 1 round with results
  {
    id:              "round-past",
    eventId:         "evt-past",
    name:            "รอบชิงชนะเลิศ",
    status:          "FINISHED" as const,
    distanceKm:      "10",
    scheduledTime:   new Date("2024-11-15T08:00:00.000Z"),
    expectedEndTime: new Date("2024-11-15T10:00:00.000Z"),
    startedAt:       new Date("2024-11-15T08:00:30.000Z"),
    endedAt:         new Date("2024-11-15T09:00:00.000Z"),
    heatName:        "รุ่นทั่วไป ระยะ 10 กม.",
    lapCount:        10,
    currentLap:      10,
    note:            "การแข่งขันจบลงแล้ว",
  },

  // evt-past-2 — Asian Junior 2024, full scenario coverage
  {
    id:              "round-pj1",
    eventId:         "evt-past-2",
    name:            "Asian Junior 10km Final",
    status:          "FINISHED" as const,
    distanceKm:      "10",
    scheduledTime:   new Date("2024-09-15T08:00:00.000Z"),
    expectedEndTime: new Date("2024-09-15T09:30:00.000Z"),
    startedAt:       new Date("2024-09-15T08:00:30.000Z"),
    endedAt:         new Date("2024-09-15T09:00:00.000Z"),
    heatName:        "Junior Men/Women — 10 km",
    lapCount:        10,
    currentLap:      10,
    note:            "Comprehensive scenario: clean / yellow-only / overridden red / multi-red / DQ / DNF",
  },
];

// ─── Round athletes ───────────────────────────────────────────────────────────

const SEED_ROUND_ATHLETES: {
  roundId: string; athleteId: string; bib: string;
  status: "OK" | "DQ" | "DNF"; position?: number;
}[] = [
  // round-1 — 3 athletes, FINISHED
  { roundId: "round-1", athleteId: "ath-001", bib: "01", status: "OK", position: 1 },
  { roundId: "round-1", athleteId: "ath-002", bib: "02", status: "OK", position: 2 },
  { roundId: "round-1", athleteId: "ath-003", bib: "03", status: "OK", position: 3 },

  // round-2 — 5 athletes, ONGOING with diverse card states for UI demo
  { roundId: "round-2", athleteId: "ath-001", bib: "01", status: "OK" },              // clean leader, lap 7
  { roundId: "round-2", athleteId: "ath-002", bib: "02", status: "OK" },              // 2 yellow + 1 pending red (waiting for Head Judge)
  { roundId: "round-2", athleteId: "ath-003", bib: "03", status: "OK" },              // 3 yellow + 1 confirmed red
  { roundId: "round-2", athleteId: "ath-004", bib: "04", status: "DQ" },              // DQ — 4 confirmed reds from 4 different judges
  { roundId: "round-2", athleteId: "ath-005", bib: "05", status: "OK" },              // clean newcomer at lap 6

  // round-pre — 4 athletes, SCHEDULED
  { roundId: "round-pre", athleteId: "ath-008", bib: "11", status: "OK" },
  { roundId: "round-pre", athleteId: "ath-009", bib: "12", status: "OK" },
  { roundId: "round-pre", athleteId: "ath-010", bib: "13", status: "OK" },
  { roundId: "round-pre", athleteId: "ath-011", bib: "14", status: "OK" },

  // round-past — 5 athletes, FINISHED with positions + 1 DQ + 1 DNF
  { roundId: "round-past", athleteId: "ath-007", bib: "21", status: "OK",  position: 1 },
  { roundId: "round-past", athleteId: "ath-008", bib: "22", status: "OK",  position: 2 },
  { roundId: "round-past", athleteId: "ath-012", bib: "23", status: "OK",  position: 3 },
  { roundId: "round-past", athleteId: "ath-006", bib: "24", status: "DQ"  },   // historical DQ
  { roundId: "round-past", athleteId: "ath-009", bib: "25", status: "DNF" },   // historical DNF

  // round-pj1 — Asian Junior 2024 — 10 athletes with diverse scenarios
  { roundId: "round-pj1", athleteId: "ath-013", bib: "J01", status: "OK",  position: 1 },  // clean champion (1 yellow only)
  { roundId: "round-pj1", athleteId: "ath-015", bib: "J02", status: "OK",  position: 2 },  // 2 yellow from diff judges
  { roundId: "round-pj1", athleteId: "ath-018", bib: "J03", status: "OK",  position: 3 },  // perfectly clean
  { roundId: "round-pj1", athleteId: "ath-014", bib: "J04", status: "OK",  position: 4 },  // 3 yellow + 1 confirmed red
  { roundId: "round-pj1", athleteId: "ath-020", bib: "J05", status: "OK",  position: 5 },  // 2 yellow + 1 OVERRIDDEN red (saved!)
  { roundId: "round-pj1", athleteId: "ath-022", bib: "J06", status: "OK",  position: 6 },  // 4 yellow + 2 confirmed reds (close call)
  { roundId: "round-pj1", athleteId: "ath-021", bib: "J07", status: "OK",  position: 7 },  // clean
  { roundId: "round-pj1", athleteId: "ath-016", bib: "J08", status: "DQ"        },           // DQ — 4 confirmed reds
  { roundId: "round-pj1", athleteId: "ath-017", bib: "J09", status: "DNF"       },           // DNF — withdrew at lap 7
  { roundId: "round-pj1", athleteId: "ath-019", bib: "J10", status: "DNF"       },           // DNF — withdrew at lap 4
];

// ─── Round officials ──────────────────────────────────────────────────────────
// Codes use charset ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no I/O/0/1)

const SEED_ROUND_OFFICIALS: {
  roundId: string; judgeId: string;
  position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER" | "TIMEKEEPER";
  secretCode: string; zone?: string;
}[] = [
  // round-1 (FINISHED) — codes no longer valid for join (round status check rejects)
  { roundId: "round-1", judgeId: "jud-001", position: "JUDGE",        secretCode: "AB2345", zone: "Zone A" },
  { roundId: "round-1", judgeId: "jud-002", position: "JUDGE",        secretCode: "CD6789", zone: "Zone B" },
  { roundId: "round-1", judgeId: "jud-003", position: "JUDGE",        secretCode: "EF2356", zone: "Zone C" },
  { roundId: "round-1", judgeId: "jud-004", position: "JUDGE",        secretCode: "GH4567", zone: "Zone D" },
  { roundId: "round-1", judgeId: "jud-005", position: "HEAD_JUDGE",   secretCode: "JK8923" },
  { roundId: "round-1", judgeId: "jud-006", position: "EVENT_LOGGER", secretCode: "LM4578" },
  { roundId: "round-1", judgeId: "jud-007", position: "TIMEKEEPER",   secretCode: "NP6234" },

  // round-2 (ONGOING) — *** ACTIVE codes for testing race-day flow ***
  { roundId: "round-2", judgeId: "jud-001", position: "JUDGE",        secretCode: "QR3456", zone: "Zone A" },
  { roundId: "round-2", judgeId: "jud-002", position: "JUDGE",        secretCode: "ST7892", zone: "Zone B" },
  { roundId: "round-2", judgeId: "jud-003", position: "JUDGE",        secretCode: "UV3467", zone: "Zone C" },
  { roundId: "round-2", judgeId: "jud-004", position: "JUDGE",        secretCode: "WX5678", zone: "Zone D" },
  { roundId: "round-2", judgeId: "jud-005", position: "HEAD_JUDGE",   secretCode: "YZ9234" },
  { roundId: "round-2", judgeId: "jud-006", position: "EVENT_LOGGER", secretCode: "HJ4589" },
  { roundId: "round-2", judgeId: "jud-007", position: "TIMEKEEPER",   secretCode: "KL6235" },

  // round-pre (SCHEDULED) — codes valid for pre-race join testing
  { roundId: "round-pre", judgeId: "jud-008", position: "JUDGE",        secretCode: "PA2345", zone: "Zone A" },
  { roundId: "round-pre", judgeId: "jud-001", position: "JUDGE",        secretCode: "PB3456", zone: "Zone B" },
  { roundId: "round-pre", judgeId: "jud-009", position: "HEAD_JUDGE",   secretCode: "PC4567" },
  { roundId: "round-pre", judgeId: "jud-006", position: "EVENT_LOGGER", secretCode: "PD5678" },
  { roundId: "round-pre", judgeId: "jud-010", position: "TIMEKEEPER",   secretCode: "PE6789" },

  // round-past (FINISHED) — historical only
  { roundId: "round-past", judgeId: "jud-001", position: "JUDGE",        secretCode: "XA2345", zone: "Zone A" },
  { roundId: "round-past", judgeId: "jud-005", position: "HEAD_JUDGE",   secretCode: "XB3456" },
  { roundId: "round-past", judgeId: "jud-006", position: "EVENT_LOGGER", secretCode: "XC4567" },
  { roundId: "round-past", judgeId: "jud-007", position: "TIMEKEEPER",   secretCode: "XD5678" },

  // round-pj1 (FINISHED) — Asian Junior — 4 zone judges + international + head + logger + timekeeper
  { roundId: "round-pj1", judgeId: "jud-001", position: "JUDGE",        secretCode: "JA2345", zone: "Zone A" },
  { roundId: "round-pj1", judgeId: "jud-002", position: "JUDGE",        secretCode: "JB3456", zone: "Zone B" },
  { roundId: "round-pj1", judgeId: "jud-003", position: "JUDGE",        secretCode: "JC4567", zone: "Zone C" },
  { roundId: "round-pj1", judgeId: "jud-011", position: "JUDGE",        secretCode: "JD5678", zone: "Finish line (IAAF)" },
  { roundId: "round-pj1", judgeId: "jud-012", position: "JUDGE",        secretCode: "JE6789", zone: "Curve 2 (visiting KOR)" },
  { roundId: "round-pj1", judgeId: "jud-005", position: "HEAD_JUDGE",   secretCode: "JF7892" },
  { roundId: "round-pj1", judgeId: "jud-006", position: "EVENT_LOGGER", secretCode: "JG8923" },
  { roundId: "round-pj1", judgeId: "jud-007", position: "TIMEKEEPER",   secretCode: "JH9234" },
];

// ─── Cards — comprehensive coverage of all 4 states ──────────────────────────
// State semantics:
//   - YELLOW cards have state=null (yellow doesn't use state)
//   - RED + state=PENDING: judge issued, head judge hasn't reviewed
//   - RED + state=CONFIRMED: head judge approved, counts toward DQ threshold
//   - RED + state=OVERRIDDEN: head judge rejected (audit kept)

const SEED_CARDS: {
  id: string; roundId: string; athleteId: string; judgeId: string;
  color: "YELLOW" | "RED";
  symbol: "BENT_KNEE" | "LIFTED_FOOT";
  state?: "PENDING" | "CONFIRMED" | "OVERRIDDEN";
  decidedBy?: string;
  issuedAt: Date;
}[] = (() => {
  return [
    // round-1 (FINISHED prelim) — sparse cards from prelim
    { id: "card-r1-001", roundId: "round-1", athleteId: "ath-001", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2025-03-15T08:15:00.000Z") },
    { id: "card-r1-002", roundId: "round-1", athleteId: "ath-002", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: new Date("2025-03-15T08:20:00.000Z") },
    { id: "card-r1-003", roundId: "round-1", athleteId: "ath-002", judgeId: "jud-003",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2025-03-15T08:45:00.000Z") },
    // round-1 also has an OVERRIDDEN red — tests that overridden cards don't count
    { id: "card-r1-ovr", roundId: "round-1", athleteId: "ath-003", judgeId: "jud-002",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "OVERRIDDEN", decidedBy: "jud-005",
      issuedAt: new Date("2025-03-15T09:00:00.000Z") },

    // ─── round-2 (ONGOING) — comprehensive scenarios for UI demo ───────────
    // Timestamps relative to RECENT_RACE_START via inline math.
    // ath-002 — 2 yellow + 1 PENDING red (waiting for Head Judge to confirm/reject)
    { id: "card-r2-001", roundId: "round-2", athleteId: "ath-002", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 5 * 60_000) },
    { id: "card-r2-002", roundId: "round-2", athleteId: "ath-002", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 12 * 60_000) },
    { id: "card-r2-003", roundId: "round-2", athleteId: "ath-002", judgeId: "jud-001",
      color: "RED", symbol: "BENT_KNEE",
      state: "PENDING",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 20 * 60_000) },

    // ath-003 — 3 yellow (from 3 different judges) + 1 CONFIRMED red
    { id: "card-r2-004", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 8 * 60_000) },
    { id: "card-r2-005", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 14 * 60_000) },
    { id: "card-r2-006", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-003",
      color: "YELLOW", symbol: "BENT_KNEE",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 18 * 60_000) },
    { id: "card-r2-007", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-004",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 22 * 60_000) },

    // ath-004 — 1 early yellow + 4 CONFIRMED reds (one from each judge) → auto-DQ
    { id: "card-r2-008", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-001",
      color: "YELLOW", symbol: "LIFTED_FOOT",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 7 * 60_000) },
    { id: "card-r2-009", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-001",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 10 * 60_000) },
    { id: "card-r2-010", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-002",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 13 * 60_000) },
    { id: "card-r2-011", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-003",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 16 * 60_000) },
    { id: "card-r2-012", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-004",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date(RECENT_RACE_START.getTime() + 19 * 60_000) },  // 4th red → DQ

    // round-past — historical OVERRIDDEN red (audit trail demo)
    { id: "card-rp-ovr", roundId: "round-past", athleteId: "ath-007", judgeId: "jud-001",
      color: "RED", symbol: "BENT_KNEE",
      state: "OVERRIDDEN", decidedBy: "jud-005",
      issuedAt: new Date("2024-11-15T09:10:00.000Z") },
    // round-past — confirmed reds that contributed to ath-006 DQ (just 1 for demo, real DQ needs 4 — we set status DQ manually for historical clarity)
    { id: "card-rp-001", roundId: "round-past", athleteId: "ath-006", judgeId: "jud-001",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-11-15T09:20:00.000Z") },

    // ─── round-pj1 (Asian Junior 2024) — comprehensive card scenarios ───────
    // All timestamps relative to startedAt=2024-09-15T08:00:30
    // Business rule reminders:
    //   - YELLOW: max 2 per judge per athlete per round (2 symbols * 1 each)
    //   - RED: max 1 per judge per athlete per round
    //   - 4 CONFIRMED red → auto-DQ
    //   - OVERRIDDEN red doesn't count toward DQ

    // ath-013 (1st place) — single yellow, otherwise clean
    { id: "card-pj1-001", roundId: "round-pj1", athleteId: "ath-013", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:10:00.000Z") },

    // ath-015 (2nd) — 2 yellows from different judges (lifted foot warnings)
    { id: "card-pj1-002", roundId: "round-pj1", athleteId: "ath-015", judgeId: "jud-001",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: new Date("2024-09-15T08:12:00.000Z") },
    { id: "card-pj1-003", roundId: "round-pj1", athleteId: "ath-015", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: new Date("2024-09-15T08:25:00.000Z") },

    // ath-018 (3rd) — PERFECTLY clean, no cards

    // ath-014 (4th) — 3 yellows + 1 CONFIRMED red (warning then red)
    { id: "card-pj1-004", roundId: "round-pj1", athleteId: "ath-014", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:08:00.000Z") },
    { id: "card-pj1-005", roundId: "round-pj1", athleteId: "ath-014", judgeId: "jud-002",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:15:00.000Z") },
    { id: "card-pj1-006", roundId: "round-pj1", athleteId: "ath-014", judgeId: "jud-003",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:28:00.000Z") },
    { id: "card-pj1-007", roundId: "round-pj1", athleteId: "ath-014", judgeId: "jud-011",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:35:00.000Z") },

    // ath-020 (5th) — 2 yellows + 1 OVERRIDDEN red (Head Judge saved him)
    { id: "card-pj1-008", roundId: "round-pj1", athleteId: "ath-020", judgeId: "jud-001",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: new Date("2024-09-15T08:14:00.000Z") },
    { id: "card-pj1-009", roundId: "round-pj1", athleteId: "ath-020", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: new Date("2024-09-15T08:26:00.000Z") },
    { id: "card-pj1-010", roundId: "round-pj1", athleteId: "ath-020", judgeId: "jud-003",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "OVERRIDDEN", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:32:00.000Z") },

    // ath-022 (6th) — 4 yellows (max from 2 judges) + 2 CONFIRMED reds (close to DQ)
    { id: "card-pj1-011", roundId: "round-pj1", athleteId: "ath-022", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:10:30.000Z") },
    { id: "card-pj1-012", roundId: "round-pj1", athleteId: "ath-022", judgeId: "jud-001",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: new Date("2024-09-15T08:18:00.000Z") },
    { id: "card-pj1-013", roundId: "round-pj1", athleteId: "ath-022", judgeId: "jud-002",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:22:00.000Z") },
    { id: "card-pj1-014", roundId: "round-pj1", athleteId: "ath-022", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: new Date("2024-09-15T08:30:00.000Z") },
    { id: "card-pj1-015", roundId: "round-pj1", athleteId: "ath-022", judgeId: "jud-003",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:38:00.000Z") },
    { id: "card-pj1-016", roundId: "round-pj1", athleteId: "ath-022", judgeId: "jud-011",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:43:00.000Z") },

    // ath-021 (7th) — PERFECTLY clean, no cards

    // ath-016 (DQ) — 1 early yellow then 4 CONFIRMED reds (one per judge) → auto-DQ
    { id: "card-pj1-017", roundId: "round-pj1", athleteId: "ath-016", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:05:00.000Z") },
    { id: "card-pj1-018", roundId: "round-pj1", athleteId: "ath-016", judgeId: "jud-001",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:12:30.000Z") },
    { id: "card-pj1-019", roundId: "round-pj1", athleteId: "ath-016", judgeId: "jud-002",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:18:30.000Z") },
    { id: "card-pj1-020", roundId: "round-pj1", athleteId: "ath-016", judgeId: "jud-003",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:24:30.000Z") },
    { id: "card-pj1-021", roundId: "round-pj1", athleteId: "ath-016", judgeId: "jud-011",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: new Date("2024-09-15T08:30:00.000Z") }, // 4th confirmed → DQ triggered here

    // ath-017 (DNF) — 1 yellow before withdrew
    { id: "card-pj1-022", roundId: "round-pj1", athleteId: "ath-017", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: new Date("2024-09-15T08:20:00.000Z") },

    // ath-019 (DNF early) — no cards (withdrew at lap 4 due to issue)
  ];
})();

// ─── Lap times for round-1 (FINISHED) and round-2 (mid-race) ────────────────

// Round 1 — 10 laps complete for 3 athletes; ~5:15 per lap, 52-min total
const SEED_LAP_TIMES_R1: {
  id: string; roundId: string; athleteId: string;
  lapNumber: number; timeMs: number; recordedBy: string; source: string;
}[] = (() => {
  const out: typeof SEED_LAP_TIMES_R1 = [];
  const finishers = [
    { id: "ath-001", base: 5_12_000, jitter: 3_000 },   // 5:12 ± 3s avg = 52:00
    { id: "ath-002", base: 5_18_000, jitter: 5_000 },   // 5:18 ± 5s = 52:30
    { id: "ath-003", base: 5_28_000, jitter: 6_000 },   // 5:28 ± 6s = 54:40
  ];
  // ms convention: 5:12 = 5*60_000 + 12*1000 = 312_000
  for (const ath of finishers) {
    const baseMs = (Math.floor(ath.base / 100_000) * 60_000) + ((ath.base % 100_000) / 1000) * 1000;
    let cumulative = 0;
    for (let lap = 1; lap <= 10; lap++) {
      const lapMs = baseMs + (lap % 3 === 0 ? ath.jitter : 0);
      cumulative += lapMs;
      out.push({
        id: `lap-r1-${ath.id}-${lap}`,
        roundId: "round-1",
        athleteId: ath.id,
        lapNumber: lap,
        timeMs: cumulative,
        recordedBy: "jud-006",
        source: "EVENT_LOGGER",
      });
    }
  }
  return out;
})();

// Round 2 — mid-race; athletes at different lap counts (matches scenario)
// Round 2 mid-race — athletes at various lap counts (consistent with currentLap=7)
const SEED_LAP_TIMES_R2: {
  id: string; roundId: string; athleteId: string;
  lapNumber: number; timeMs: number; recordedBy: string; source: string;
}[] = (() => {
  const out: typeof SEED_LAP_TIMES_R2 = [];
  // (athlete, laps completed, per-lap base time in ms)
  const racers: { id: string; laps: number; baseMs: number }[] = [
    { id: "ath-001", laps: 7, baseMs: 134_000 }, // 2:14/lap — clean leader
    { id: "ath-002", laps: 7, baseMs: 138_000 }, // 2:18/lap — pending red
    { id: "ath-003", laps: 6, baseMs: 142_000 }, // 2:22/lap — has confirmed red
    { id: "ath-004", laps: 5, baseMs: 145_000 }, // 2:25/lap — DQ'd at lap 5
    { id: "ath-005", laps: 6, baseMs: 147_000 }, // 2:27/lap — clean newcomer
  ];
  for (const r of racers) {
    let cumulative = 0;
    for (let lap = 1; lap <= r.laps; lap++) {
      cumulative += r.baseMs + (lap === 1 ? 2_000 : 0); // first lap slightly slower
      out.push({
        id: `lap-r2-${r.id}-${lap}`,
        roundId: "round-2",
        athleteId: r.id,
        lapNumber: lap,
        timeMs: cumulative,
        recordedBy: "jud-006",
        source: "EVENT_LOGGER",
      });
    }
  }
  return out;
})();

// Round past — 10 laps for 3 finishers
const SEED_LAP_TIMES_PAST: {
  id: string; roundId: string; athleteId: string;
  lapNumber: number; timeMs: number; recordedBy: string; source: string;
}[] = (() => {
  const out: typeof SEED_LAP_TIMES_PAST = [];
  const racers = [
    { id: "ath-007", baseMs: 303_000 }, // 5:03 per lap → 50:30
    { id: "ath-008", baseMs: 306_000 }, // 5:06 → 51:00
    { id: "ath-012", baseMs: 315_000 }, // 5:15 → 52:30
  ];
  for (const r of racers) {
    let cumulative = 0;
    for (let lap = 1; lap <= 10; lap++) {
      cumulative += r.baseMs;
      out.push({
        id: `lap-rp-${r.id}-${lap}`,
        roundId: "round-past",
        athleteId: r.id,
        lapNumber: lap,
        timeMs: cumulative,
        recordedBy: "jud-006",
        source: "EVENT_LOGGER",
      });
    }
  }
  return out;
})();

// Round PJ1 (Asian Junior 2024) — diverse: 7 finishers + 1 DQ (6 laps) + 2 DNF (7, 4 laps)
const SEED_LAP_TIMES_PJ1: {
  id: string; roundId: string; athleteId: string;
  lapNumber: number; timeMs: number; recordedBy: string; source: string;
}[] = (() => {
  const out: typeof SEED_LAP_TIMES_PJ1 = [];
  // Each entry: athlete id, base lap time in ms, total laps to record
  const racers: { id: string; baseMs: number; laps: number }[] = [
    { id: "ath-013", baseMs: 300_000, laps: 10 }, // 5:00/lap → 50:00 (champion)
    { id: "ath-015", baseMs: 309_000, laps: 10 }, // 5:09/lap → 51:30
    { id: "ath-018", baseMs: 316_500, laps: 10 }, // 5:16.5 → 52:45
    { id: "ath-014", baseMs: 324_000, laps: 10 }, // 5:24 → 54:00
    { id: "ath-020", baseMs: 331_500, laps: 10 }, // 5:31.5 → 55:15
    { id: "ath-022", baseMs: 345_000, laps: 10 }, // 5:45 → 57:30
    { id: "ath-021", baseMs: 348_000, laps: 10 }, // 5:48 → 58:00
    { id: "ath-016", baseMs: 330_000, laps: 6  }, // DQ at lap 6, partial
    { id: "ath-017", baseMs: 318_000, laps: 7  }, // DNF withdrew lap 7
    { id: "ath-019", baseMs: 335_000, laps: 4  }, // DNF withdrew lap 4
  ];
  for (const r of racers) {
    let cumulative = 0;
    for (let lap = 1; lap <= r.laps; lap++) {
      cumulative += r.baseMs;
      out.push({
        id: `lap-pj1-${r.id}-${lap}`,
        roundId: "round-pj1",
        athleteId: r.id,
        lapNumber: lap,
        timeMs: cumulative,
        recordedBy: "jud-006",
        source: "EVENT_LOGGER",
      });
    }
  }
  return out;
})();

// ─── Finish times ─────────────────────────────────────────────────────────────

const SEED_FINISH_TIMES: {
  id: string; roundId: string; athleteId: string;
  timeMs: number; position: number;
}[] = [
  // round-1 (FINISHED prelim)
  { id: "ft-r1-001", roundId: "round-1", athleteId: "ath-001", timeMs: 52 * 60_000 + 30_000, position: 1 },
  { id: "ft-r1-002", roundId: "round-1", athleteId: "ath-002", timeMs: 53 * 60_000 + 15_000, position: 2 },
  { id: "ft-r1-003", roundId: "round-1", athleteId: "ath-003", timeMs: 54 * 60_000 + 40_000, position: 3 },

  // round-past (FINISHED)
  { id: "ft-rp-001", roundId: "round-past", athleteId: "ath-007", timeMs: 50 * 60_000 + 30_000, position: 1 },
  { id: "ft-rp-002", roundId: "round-past", athleteId: "ath-008", timeMs: 51 * 60_000 + 0,    position: 2 },
  { id: "ft-rp-003", roundId: "round-past", athleteId: "ath-012", timeMs: 52 * 60_000 + 30_000, position: 3 },

  // round-pj1 (Asian Junior 2024) — 7 finishers (positions 1-7), 3 did not finish
  { id: "ft-pj1-001", roundId: "round-pj1", athleteId: "ath-013", timeMs: 50 * 60_000 + 0,     position: 1 },
  { id: "ft-pj1-002", roundId: "round-pj1", athleteId: "ath-015", timeMs: 51 * 60_000 + 30_000, position: 2 },
  { id: "ft-pj1-003", roundId: "round-pj1", athleteId: "ath-018", timeMs: 52 * 60_000 + 45_000, position: 3 },
  { id: "ft-pj1-004", roundId: "round-pj1", athleteId: "ath-014", timeMs: 54 * 60_000 + 0,     position: 4 },
  { id: "ft-pj1-005", roundId: "round-pj1", athleteId: "ath-020", timeMs: 55 * 60_000 + 15_000, position: 5 },
  { id: "ft-pj1-006", roundId: "round-pj1", athleteId: "ath-022", timeMs: 57 * 60_000 + 30_000, position: 6 },
  { id: "ft-pj1-007", roundId: "round-pj1", athleteId: "ath-021", timeMs: 58 * 60_000 + 0,     position: 7 },
];

// ─── Round activity logs (non-card events) ───────────────────────────────────
// Card-related logs are derived from Card rows in the moderator view — don't seed them here.

const SEED_ACTIVITY_LOGS: {
  id: string; roundId: string; timestamp: Date;
  actorId: string; actorName: string; actorRole: string;
  actionType: string;
  targetAthleteId?: string; targetBib?: string;
  details?: string; canOverride?: boolean;
}[] = [
  // round-1 start/end
  { id: "log-r1-start", roundId: "round-1", timestamp: new Date("2025-03-15T08:00:30.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_start", details: "เริ่มรอบคัดเลือก ระยะ 10 กม." },
  { id: "log-r1-end", roundId: "round-1", timestamp: new Date("2025-03-15T08:55:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_end", details: "จบรอบคัดเลือก" },

  // round-2 (ONGOING)
  { id: "log-r2-start", roundId: "round-2", timestamp: new Date(RECENT_RACE_START.getTime() - 60_000),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_start", details: "เริ่มรอบชิงชนะเลิศ ระยะ 20 กม." },
  // ath-004 auto-DQ after 4th confirmed red (matches card-r2-012 timestamp)
  { id: "log-r2-dq-004", roundId: "round-2",
    timestamp: new Date(RECENT_RACE_START.getTime() + 19 * 60_000 + 30_000),
    actorId: "jud-005", actorName: "Head Judge Ref", actorRole: "HEAD_JUDGE",
    actionType: "athlete_dq", targetAthleteId: "ath-004", targetBib: "04",
    details: "DQ — ครบใบแดง 4 ใบ จาก 4 กรรมการ" },


  // round-past timeline
  { id: "log-rp-start", roundId: "round-past", timestamp: new Date("2024-11-15T08:00:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_start", details: "เริ่มรอบชิงชนะเลิศ ระยะ 10 กม." },
  { id: "log-rp-end", roundId: "round-past", timestamp: new Date("2024-11-15T09:30:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_end", details: "จบรอบ" },

  // round-pj1 timeline (Asian Junior 2024)
  { id: "log-pj1-start", roundId: "round-pj1", timestamp: new Date("2024-09-15T08:00:30.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_start", details: "เริ่ม Asian Junior Racewalk Championship 2024" },
  // Auto-DQ for ath-016 at lap 6 after 4th confirmed red
  { id: "log-pj1-dq-016", roundId: "round-pj1", timestamp: new Date("2024-09-15T08:30:30.000Z"),
    actorId: "jud-005", actorName: "Head Judge Ref", actorRole: "HEAD_JUDGE",
    actionType: "athlete_dq", targetAthleteId: "ath-016", targetBib: "J08",
    details: "DQ — ครบใบแดง 4 ใบ จาก 4 กรรมการ" },
  // Withdrew (DNF) — ath-019 at lap 4
  { id: "log-pj1-dnf-019", roundId: "round-pj1", timestamp: new Date("2024-09-15T08:22:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "other", targetAthleteId: "ath-019", targetBib: "J10",
    details: "นักกีฬาถอนตัว (DNF) — เหตุผล: ไม่สามารถแข่งต่อได้" },
  // Withdrew (DNF) — ath-017 at lap 7
  { id: "log-pj1-dnf-017", roundId: "round-pj1", timestamp: new Date("2024-09-15T08:37:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "other", targetAthleteId: "ath-017", targetBib: "J09",
    details: "นักกีฬาถอนตัว (DNF) — เหตุผล: บาดเจ็บที่ขา" },
  { id: "log-pj1-end", roundId: "round-pj1", timestamp: new Date("2024-09-15T09:00:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_end", details: "จบ Asian Junior 2024 — 7 athletes finished, 1 DQ, 2 DNF" },
];

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
  const user = await prisma.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      name: input.name,
      title: input.title,
      role: input.role,
      status: input.status,
      password: passwordHash,
      emailVerified: new Date(),
      lastActiveAt: input.lastActiveAt,
      suspendedAt: input.status === "SUSPENDED" ? new Date() : null,
    },
    update: {
      name: input.name,
      title: input.title,
      role: input.role,
      status: input.status,
      lastActiveAt: input.lastActiveAt,
      suspendedAt: input.status === "SUSPENDED" ? new Date() : null,
      ...(RESET_FLAG ? { password: passwordHash } : {}),
    },
  });
  return user;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (RESET_FLAG) await reset();

  // Users
  for (const u of SEED_USERS) {
    const user = await upsertUser(u);
    console.log(`[seed] user:        ${user.email} (${user.status})`);
  }

  // Affiliations
  for (const a of SEED_AFFILIATIONS) {
    await prisma.affiliation.upsert({
      where:  { id: a.id },
      create: a,
      update: {
        name: a.name,
        country: a.country,
        province: a.province ?? null,
        headOfAffiliation: a.headOfAffiliation ?? null,
        joinedAt: a.joinedAt ?? null,
        note: a.note ?? null,
      },
    });
  }
  console.log(`[seed] affiliations: ${SEED_AFFILIATIONS.length}`);

  // Athletes
  for (const a of SEED_ATHLETES) {
    await prisma.athlete.upsert({
      where:  { id: a.id },
      create: a,
      update: {
        name: a.name,
        country: a.country,
        province: a.province ?? null,
        club: a.club ?? null,
        note: a.note ?? null,
        affiliationId: a.affiliationId,
      },
    });
  }
  console.log(`[seed] athletes:    ${SEED_ATHLETES.length}`);

  // Judges
  for (const j of SEED_JUDGES) {
    await prisma.judge.upsert({
      where:  { id: j.id },
      create: j,
      update: {
        name: j.name,
        country: j.country,
        province: j.province ?? null,
        department: j.department ?? null,
        organization: j.organization ?? null,
        status: j.status,
        note: j.note ?? null,
      },
    });
  }
  console.log(`[seed] judges:      ${SEED_JUDGES.length}`);

  // Events
  for (const e of SEED_EVENTS) {
    await prisma.event.upsert({
      where:  { id: e.id },
      create: e,
      update: {
        name: e.name,
        status: e.status,
        isCurrent: e.isCurrent,
        date: e.date,
        location: e.location,
        distanceKm: e.distanceKm,
        lapCount: e.lapCount,
      },
    });
  }
  console.log(`[seed] events:      ${SEED_EVENTS.length}`);

  // Rounds
  for (const r of SEED_ROUNDS) {
    await prisma.round.upsert({
      where:  { id: r.id },
      create: r,
      update: {
        name: r.name, status: r.status, currentLap: r.currentLap,
        scheduledTime: r.scheduledTime, expectedEndTime: r.expectedEndTime,
        startedAt: r.startedAt, endedAt: r.endedAt,
        heatName: r.heatName, lapCount: r.lapCount, note: r.note,
        distanceKm: r.distanceKm,
      },
    });
  }
  console.log(`[seed] rounds:      ${SEED_ROUNDS.length}`);

  // Round athletes
  for (const ra of SEED_ROUND_ATHLETES) {
    await prisma.roundAthlete.upsert({
      where:  { roundId_athleteId: { roundId: ra.roundId, athleteId: ra.athleteId } },
      create: ra,
      update: { bib: ra.bib, status: ra.status, position: ra.position ?? null },
    });
  }
  console.log(`[seed] roundAthletes:  ${SEED_ROUND_ATHLETES.length}`);

  // Round officials
  for (const ro of SEED_ROUND_OFFICIALS) {
    await prisma.roundOfficial.upsert({
      where:  { roundId_judgeId: { roundId: ro.roundId, judgeId: ro.judgeId } },
      create: ro,
      update: { position: ro.position, secretCode: ro.secretCode, zone: ro.zone ?? null },
    });
  }
  console.log(`[seed] roundOfficials: ${SEED_ROUND_OFFICIALS.length}`);

  // Cards
  for (const c of SEED_CARDS) {
    await prisma.card.upsert({
      where:  { id: c.id },
      create: c,
      update: {
        color: c.color, symbol: c.symbol,
        state: c.state ?? null, decidedBy: c.decidedBy ?? null,
        decidedAt: c.state === "CONFIRMED" || c.state === "OVERRIDDEN" ? c.issuedAt : null,
        issuedAt: c.issuedAt,
      },
    });
  }
  console.log(`[seed] cards:       ${SEED_CARDS.length}`);

  // Lap times
  const allLaps = [...SEED_LAP_TIMES_R1, ...SEED_LAP_TIMES_R2, ...SEED_LAP_TIMES_PAST, ...SEED_LAP_TIMES_PJ1];
  for (const lap of allLaps) {
    await prisma.lapTime.upsert({
      where:  { id: lap.id },
      create: lap,
      update: { timeMs: lap.timeMs, recordedBy: lap.recordedBy, source: lap.source },
    });
  }
  console.log(`[seed] lapTimes:    ${allLaps.length}`);

  // Finish times
  for (const ft of SEED_FINISH_TIMES) {
    await prisma.finishTime.upsert({
      where:  { id: ft.id },
      create: ft,
      update: { timeMs: ft.timeMs, position: ft.position },
    });
  }
  console.log(`[seed] finishTimes: ${SEED_FINISH_TIMES.length}`);

  // Activity logs
  for (const log of SEED_ACTIVITY_LOGS) {
    await prisma.roundActivityLog.upsert({
      where:  { id: log.id },
      create: log,
      update: {
        actorName: log.actorName, actorRole: log.actorRole,
        actionType: log.actionType, details: log.details ?? null,
      },
    });
  }
  console.log(`[seed] activityLogs: ${SEED_ACTIVITY_LOGS.length}`);

  console.log("\n[seed] === Summary ===");
  console.log(`  Events:       ${SEED_EVENTS.length} (1 DRAFT, 1 SCHEDULED, 1 ONGOING, 2 FINISHED)`);
  console.log(`  Rounds:       ${SEED_ROUNDS.length}`);
  console.log(`  Affiliations: ${SEED_AFFILIATIONS.length}`);
  console.log(`  Athletes:     ${SEED_ATHLETES.length}  (incl. junior + international: VN/MY/MM)`);
  console.log(`  Judges:       ${SEED_JUDGES.length}  (incl. IAAF + visiting KR)`);
  console.log(`  Cards:        ${SEED_CARDS.length} (YELLOW + RED PENDING/CONFIRMED/OVERRIDDEN)`);
  console.log(`  Lap times:    ${allLaps.length}`);
  console.log(`  Finish times: ${SEED_FINISH_TIMES.length}`);
  console.log("\n  See docs/TEST_SCENARIOS.md for the full walkthrough.\n");
  console.log("[seed] done");
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
