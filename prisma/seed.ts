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
    note: "สมาชิกหลักภาคกลาง",
  },
  {
    id: "aff-002",
    name: "Bangkok Road Runners",
    country: "TH",
    province: "กรุงเทพมหานคร",
    headOfAffiliation: "Jane Manager",
    note: "กลุ่มนักวิ่งและเดินทนกรุงเทพ",
  },
  {
    id: "aff-003",
    name: "ChiangMai Striders",
    country: "TH",
    province: "เชียงใหม่",
    headOfAffiliation: "คุณชนิดา วิ่งไว",
    note: "สโมสรภาคเหนือ",
  },
  {
    id: "aff-004",
    name: "Hat Yai Athletic Club",
    country: "TH",
    province: "สงขลา",
    headOfAffiliation: "Luis Garcia",
    note: "สโมสรภาคใต้ — รองรับนักกีฬาต่างชาติ",
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
];

// ─── Judges (10 total) ────────────────────────────────────────────────────────

const SEED_JUDGES = [
  { id: "jud-001", name: "สมศักดิ์ กรรมการ", country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสนาม", organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", note: "Zone A — Coach A" },
  { id: "jud-002", name: "วิชัย ตัดสิน", country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายกรรมการสนาม", organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", note: "Zone B — Coach B" },
  { id: "jud-003", name: "ประเสริฐ มองทาง", country: "TH", province: "นนทบุรี",       department: "ฝ่ายกรรมการสนาม", organization: "ชมรมเดินทนกรุงเทพฯ", note: "Zone C — Coach C" },
  { id: "jud-004", name: "อนุชา ฟ้าใส", country: "TH", province: "ปทุมธานี",     department: "ฝ่ายกรรมการสนาม", organization: "Bangkok Road Runners", note: "Zone D — Coach D" },
  { id: "jud-005", name: "Head Judge Ref", country: "TH", province: "กรุงเทพมหานคร", department: "หัวหน้ากรรมการ", organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", note: "Head Judge หลัก" },
  { id: "jud-006", name: "Event Logger 1", country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายบันทึกผล", organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", note: "Event Logger" },
  { id: "jud-007", name: "Timekeeper 1", country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายจับเวลา", organization: "สมาคมกรีฬาเดินทนแห่งประเทศไทย", note: "Timekeeper" },
  { id: "jud-008", name: "Coach E", country: "TH", province: "เชียงใหม่",       department: "ฝ่ายกรรมการสนาม", organization: "ChiangMai Striders", note: "pre-race judge" },
  { id: "jud-009", name: "Head Judge Backup", country: "TH", province: "เชียงใหม่", department: "หัวหน้ากรรมการ", organization: "ChiangMai Striders", note: "Head Judge สำรอง" },
  { id: "jud-010", name: "Timekeeper Pre-race", country: "TH", province: "กรุงเทพมหานคร", department: "ฝ่ายจับเวลา", organization: "Bangkok Road Runners", note: "pre-race timekeeper" },
];

// ─── Events ───────────────────────────────────────────────────────────────────

const SEED_EVENTS = [
  {
    id:         "evt-001",
    name:       "Racewalk Championship 2025",
    date:       new Date("2025-03-15T00:00:00.000Z"),
    location:   "สนามกีฬาแห่งชาติ",
    distanceKm: "20",
    status:     "ONGOING" as const,
    isCurrent:  true,
  },
  {
    id:         "evt-empty",
    name:       "Songkran Race Walk Festival (Draft)",
    date:       new Date("2026-04-13T00:00:00.000Z"),
    location:   "Khao San Road",
    distanceKm: "10",
    status:     "DRAFT" as const,
    isCurrent:  false,
  },
  {
    id:         "evt-pre",
    name:       "Bangkok City Racewalk 2026",
    date:       new Date("2026-06-20T00:00:00.000Z"),
    location:   "Bangkok City Route",
    distanceKm: "10",
    status:     "SCHEDULED" as const,
    isCurrent:  false,
  },
  {
    id:         "evt-past",
    name:       "ChiangMai Open 2024",
    date:       new Date("2024-11-15T00:00:00.000Z"),
    location:   "Chiang Mai Sports Complex",
    distanceKm: "10",
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
    status:          "ONGOING" as const,
    distanceKm:      "20",
    scheduledTime:   RECENT_RACE_START,
    expectedEndTime: new Date(RECENT_RACE_START.getTime() + 3 * 60 * 60 * 1000),
    startedAt:       RECENT_RACE_START,   // synced timer source — all roles share this
    endedAt:         null,
    heatName:        "รุ่นทั่วไป ระยะ 20 กม.",
    lapCount:        20,
    currentLap:      7,
    note:            "รอบสุดท้าย — มี pending red card รอ Head Judge",
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

  // round-2 — 5 athletes, ONGOING with various card states
  { roundId: "round-2", athleteId: "ath-001", bib: "01", status: "OK" },              // clean leader
  { roundId: "round-2", athleteId: "ath-002", bib: "02", status: "OK" },              // pending red
  { roundId: "round-2", athleteId: "ath-003", bib: "03", status: "OK" },              // 3 yellow + 1 confirmed red
  { roundId: "round-2", athleteId: "ath-004", bib: "04", status: "DQ" },              // DQ - 4 confirmed reds
  { roundId: "round-2", athleteId: "ath-005", bib: "05", status: "OK" },              // clean newcomer

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
  const r2Start = RECENT_RACE_START;
  const t = (mins: number) => new Date(r2Start.getTime() + mins * 60 * 1000);

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

    // round-2 (ONGOING) — full card spectrum

    // ath-002: 2 yellows + 1 PENDING red (waiting for head judge)
    { id: "card-r2-001", roundId: "round-2", athleteId: "ath-002", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: t(5) },
    { id: "card-r2-002", roundId: "round-2", athleteId: "ath-002", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: t(12) },
    { id: "card-r2-003", roundId: "round-2", athleteId: "ath-002", judgeId: "jud-001",
      color: "RED", symbol: "BENT_KNEE",
      state: "PENDING",
      issuedAt: t(20) },

    // ath-003: 3 yellows (from different judges) + 1 CONFIRMED red
    { id: "card-r2-004", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-001",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: t(8) },
    { id: "card-r2-005", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-002",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: t(14) },
    { id: "card-r2-006", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-003",
      color: "YELLOW", symbol: "BENT_KNEE", issuedAt: t(18) },
    { id: "card-r2-007", roundId: "round-2", athleteId: "ath-003", judgeId: "jud-004",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: t(22) },

    // ath-004: 4 CONFIRMED reds from all 4 judges → DQ
    { id: "card-r2-008", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-001",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: t(10) },
    { id: "card-r2-009", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-002",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: t(13) },
    { id: "card-r2-010", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-003",
      color: "RED", symbol: "BENT_KNEE",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: t(16) },
    { id: "card-r2-011", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-004",
      color: "RED", symbol: "LIFTED_FOOT",
      state: "CONFIRMED", decidedBy: "jud-005",
      issuedAt: t(19) },
    // ath-004 also has 1 yellow before the reds, for visual variety
    { id: "card-r2-012", roundId: "round-2", athleteId: "ath-004", judgeId: "jud-001",
      color: "YELLOW", symbol: "LIFTED_FOOT", issuedAt: t(7) },

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
const SEED_LAP_TIMES_R2: {
  id: string; roundId: string; athleteId: string;
  lapNumber: number; timeMs: number; recordedBy: string; source: string;
}[] = (() => {
  const out: typeof SEED_LAP_TIMES_R2 = [];
  // Lap structure: athlete → laps completed
  const racers = [
    { id: "ath-001", laps: 7, baseMs: 134_000 }, // 2:14 per lap → leader
    { id: "ath-002", laps: 7, baseMs: 138_000 }, // 2:18
    { id: "ath-003", laps: 6, baseMs: 142_000 }, // 2:22
    { id: "ath-004", laps: 5, baseMs: 145_000 }, // 2:25 — DQ'd at lap 5
    { id: "ath-005", laps: 6, baseMs: 147_000 }, // 2:27
  ];
  for (const r of racers) {
    let cumulative = 0;
    for (let lap = 1; lap <= r.laps; lap++) {
      cumulative += r.baseMs + (lap === 1 ? 2_000 : 0); // first lap a bit slower
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

  // round-2 start (ongoing)
  { id: "log-r2-start", roundId: "round-2", timestamp: new Date(RECENT_RACE_START.getTime() - 60_000),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_start", details: "เริ่มรอบชิงชนะเลิศ ระยะ 20 กม." },
  // ath-004 DQ event (from 4th confirmed red)
  { id: "log-r2-dq-004", roundId: "round-2",
    timestamp: new Date(RECENT_RACE_START.getTime() + 19 * 60_000 + 30_000),
    actorId: "jud-005", actorName: "Head Judge Ref", actorRole: "HEAD_JUDGE",
    actionType: "athlete_dq", targetAthleteId: "ath-004", targetBib: "04",
    details: "DQ — ครบใบแดง 4 ใบ" },

  // round-past timeline
  { id: "log-rp-start", roundId: "round-past", timestamp: new Date("2024-11-15T08:00:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_start", details: "เริ่มรอบชิงชนะเลิศ ระยะ 10 กม." },
  { id: "log-rp-end", roundId: "round-past", timestamp: new Date("2024-11-15T09:30:00.000Z"),
    actorId: "system", actorName: "Moderator", actorRole: "MODERATOR",
    actionType: "round_end", details: "จบรอบ" },
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
  const allLaps = [...SEED_LAP_TIMES_R1, ...SEED_LAP_TIMES_R2, ...SEED_LAP_TIMES_PAST];
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
  console.log(`  Events:     ${SEED_EVENTS.length} (1 DRAFT, 1 SCHEDULED, 1 ONGOING, 1 FINISHED)`);
  console.log(`  Rounds:     ${SEED_ROUNDS.length}`);
  console.log(`  Athletes:   ${SEED_ATHLETES.length}`);
  console.log(`  Judges:     ${SEED_JUDGES.length}`);
  console.log(`  Cards:      ${SEED_CARDS.length} (YELLOW + RED PENDING/CONFIRMED/OVERRIDDEN)`);
  console.log(`  Lap times:  ${allLaps.length}`);
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
