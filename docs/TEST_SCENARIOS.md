# Test Scenarios — Racewalk Tournament

คู่มือทดสอบครอบคลุมทุก lifecycle ของระบบ ใช้ร่วมกับ seed data ที่อยู่ใน [`prisma/seed.ts`](../prisma/seed.ts).

> **Setup:** รัน `npm run db:seed:reset` ก่อนเริ่ม เพื่อรีเซ็ตข้อมูลทั้งหมดเป็นสถานะที่เอกสารนี้บรรยาย
>
> seed เป็นแบบ **generator-driven** — secret code ของกรรมการถูกสร้างแบบ deterministic และ
> **พิมพ์ออกมาใน run summary** ของ `db:seed` (เฉพาะรอบ SCHEDULED / ONGOING ที่ join ได้)
> ให้อ่านรหัสจาก output ของ seed ไม่ต้องเดาจากเอกสาร

---

## 1. ข้อมูลที่ถูก seed

### Events

| Event ID | สถานะ | Rounds | Test target |
|----------|------|--------|-------------|
| `evt-draft` | DRAFT | 0 rounds | UX สำหรับ event ที่ยังเป็นร่าง / ว่างเปล่า |
| `evt-sched` | SCHEDULED | 1 (SCHEDULED) | Pre-race setup — officials join ก่อนเริ่ม |
| `evt-live` | ONGOING | finished prelim + **LIVE final** | **หลัก — race-day live flow (ชาย 20k)** |
| `evt-live2` | ONGOING | LIVE final | Live flow รอง(หญิง 10k) |
| `evt-fin-nat` | FINISHED | FINISHED | ผลลัพธ์ + ประวัติ (ระดับชาติ) |
| `evt-fin-asia` | FINISHED | FINISHED | ผลลัพธ์ระดับนานาชาติ |
| `evt-open` | FINISHED | FINISHED | field sizes สุดขั้ว (50 / 2 / 1 คน) |

### Users (Admin)

| Email | Password | Status | Title | ใช้ทดสอบ |
|------|----------|--------|-------|----------|
| `owner@racewalk.local` | `owner1234` | ACTIVE | Owner (root) | login ปกติ + admin ทุกหน้า (bypass permission) |
| `events@racewalk.local` | `events1234` | ACTIVE | Event Manager | login ปกติ (events/athletes/judges/affiliations CRUD, ไม่มี admins) |
| `score@racewalk.local` | `score1234` | ACTIVE | Score Officer | login ปกติ (view + moderator only) |
| `suspended@racewalk.local` | `suspended1234` | SUSPENDED | Former Admin | ทดสอบ **login block** |

### Secret codes (Round Officials)

> ⚠️ **เฉพาะ SCHEDULED / ONGOING round** เท่านั้นที่จะ join เข้า workspace ได้ —
> รหัสจาก FINISHED round จะถูกปฏิเสธ
>
> รหัสจริงพิมพ์อยู่ใน seed output ภายใต้หัวข้อ `=== Joinable secret codes (SCHEDULED / ONGOING) ===`
> แต่ละรอบที่ join ได้จะมีตำแหน่ง: **JUDGE** (หลายคน, มี Zone), **HEAD_JUDGE** (1), **EVENT_LOGGER** (1)

> มีเพียง 3 ตำแหน่งใน `OfficialPosition`: `JUDGE` / `HEAD_JUDGE` / `EVENT_LOGGER`
> **ไม่มีตำแหน่ง/route ของ Timekeeper** — การจับ lap/finish ทำโดย **Event Logger**

#### join paths

| Position | Join URL (เช่น `evt-live`) | Redirect ไป |
|----------|----------------------------|-------------|
| JUDGE | `/judge/events/evt-live/join` | `/judge/events/evt-live` |
| HEAD_JUDGE | `/head-judge/events/evt-live/join` | `/head-judge/events/evt-live` |
| EVENT_LOGGER | `/event-logger/events/evt-live/join` | `/event-logger/events/evt-live` |

#### FINISHED rounds

รหัสอยู่ในระบบ (ดูใน seed.ts) แต่จะถูก **ปฏิเสธ** ตอน join เพราะ round สถานะ FINISHED
(error: `"รอบที่ใช้รหัสนี้จบการแข่งขันแล้ว"`)

---

## 2. สถานะนักกีฬาในรอบ LIVE final ของ `evt-live` (playground หลัก)

ข้อมูลนักกีฬา (ชื่อ / BIB / สังกัด / lap / cards) ถูก **generate** แบบ correct-by-construction
จึงไม่ระบุค่าตายตัวในเอกสารนี้ — เปิด `/admin/events/evt-live/moderator` หรือ scoreboard
`/events/evt-live` เพื่อดูค่าจริงหลัง seed สิ่งที่ seed รับประกันไว้ในรอบ LIVE:

- มี **leader ที่ clean** (lap สูงสุด, ไม่มี card)
- มีนักกีฬาที่มี **2 yellow + 1 PENDING red** (รอ Head Judge ตัดสิน)
- มีนักกีฬาที่มี **CONFIRMED red** อย่างน้อย 1 ใบ (ใกล้ trouble)
- มีนักกีฬา **DQ** ที่มี **≥4 CONFIRMED reds จาก 4 judges ที่ต่างกัน** (generator throws ถ้าไม่ครบ)
- lap times เป็น cumulative; final crossing เก็บเป็น `FinishTime` (ไม่ใช่ lap row),
  `currentLap = lap rows + (finished ? 1 : 0)`

> กฎ cards ที่ seed บังคับ: Yellow ≤1 ต่อ symbol ต่อ judge ต่อ athlete; Red ≤1 (non-overridden)
> ต่อ judge ต่อ athlete; OVERRIDDEN red ไม่ถูกนับเข้า DQ

---

## 3. Walkthrough — Test Cases ตาม flow

### 3.1 Admin lifecycle

1. **Login** ที่ `localhost:3000/admin/login` ด้วย `owner@racewalk.local` / `owner1234`
2. **Suspended user blocked** — ลอง login ด้วย `suspended@racewalk.local` → ต้องถูกปฏิเสธ
   (ตรวจ [`lib/user-status.ts`](../lib/user-status.ts) `resolveUserStatus`; login gate อยู่ใน [`auth.ts`](../auth.ts))
3. **Events list** ที่ `/admin/events`
   - เห็น events ทั้งหมด (DRAFT / SCHEDULED / ONGOING / FINISHED)
   - event ที่ `ONGOING` มี badge LIVE
   - ปุ่ม "Moderator" เห็นเฉพาะ event ที่ดำเนินการได้
4. **Create new event** — `/admin/events/new` → กรอกฟอร์ม → Server Action `createEvent`
   ([`app/actions/events.ts`](../app/actions/events.ts)) → DB มี row ใหม่ (ตรวจ BIB validation: age band + 3-digit seq, unique ต่อ event)
5. **Add round** — เข้า event ใหม่ → `/admin/events/{id}/rounds/new` → เลือก athletes + officials →
   generate secret codes → save (`createRound`, [`app/actions/rounds.ts`](../app/actions/rounds.ts)) →
   ดู secret codes ที่ออกมาในตาราง (สูงสุด 8 JUDGE + 1 HEAD_JUDGE + 1 EVENT_LOGGER)

### 3.2 Pre-race join (`evt-sched`)

1. เปิด `/judge/events/evt-sched/join` (anonymous)
2. กรอกรหัส JUDGE ของ `evt-sched` (ดูจาก seed output) → ต้องถูก redirect ไป `/judge/events/evt-sched`
3. ใน workspace เห็นนักกีฬาของรอบ — ทั้งหมด clean ไม่มี cards (รอบยังไม่เริ่ม)
4. **ทดสอบ logout** — กดออกจากระบบ (`logoutOfficial`) → กลับ join page
5. กรอกรหัสผิด เช่น `XXXXXX` → ได้ error `"รหัสกรรมการไม่ถูกต้องสำหรับ Event นี้"`

### 3.3 Race-day Judge flow (`evt-live`, รอบ LIVE final)

> writes อยู่ใน [`app/actions/cards.ts`](../app/actions/cards.ts); workspace UI คือ
> [`components/judge/judge-workspace.tsx`](../components/judge/judge-workspace.tsx) → `JudgeCardMatrix`
> หลัง action จะเรียก `router.refresh()` และ workspace ยัง auto-refresh ทุก 2500 ms (2000 ms ถ้ารอบ SCHEDULED)

1. **Judge join:** `/judge/events/evt-live/join` → กรอกรหัส JUDGE (Zone A) จาก seed output
2. ใน workspace เห็นนักกีฬาของรอบ:
   - นักกีฬา **DQ** แสดง ribbon → ปุ่ม disable
   - นักกีฬาที่ยัง OK และยังไม่ finish → กดได้
3. **Yellow card flow:** (`issueYellowCard`)
   - กดที่นักกีฬา clean → action bar ขึ้น → กด "งอเข่า" (BENT_KNEE) ใต้ใบเตือน → DB เพิ่ม card YELLOW BENT_KNEE
   - หลัง refresh ดูจุดเหลืองจะ filled
   - กด BENT_KNEE อีกครั้ง → ปุ่ม disable (1 yellow ต่อ symbol ต่อ judge)
   - กด LIFTED_FOOT → ได้ครบ 2 yellow → ปุ่มทั้งสอง symbol disable
4. **Max yellow:** ออก yellow symbol เดิมซ้ำ → server throws `"ให้ใบเหลืองสัญลักษณ์นี้แก่นักกีฬาคนนี้แล้ว"`
   (max = 2 symbols × 1 = 2 ใบต่อ judge ต่อ athlete)
5. **Red card flow:** (`issueRedCard`)
   - กดที่นักกีฬา clean → กด "งอเข่า" ใต้ใบแดง → DB สร้าง card RED BENT_KNEE state=`PENDING`
   - ปุ่ม red ทั้งสองจะถูก disable หลังออก (max 1 red per judge per athlete)
6. **DQ athlete protection:** กดที่นักกีฬา DQ → ทุกปุ่มถูก disable
7. **Finished athlete protection:** นักกีฬาที่ finish แล้ว → ออก card ไม่ได้
   (`"นักกีฬาเข้าเส้นชัยแล้ว — ออกใบไม่ได้"`)

### 3.4 Head Judge confirm/reject flow

> writes: `confirmRedCard` / `rejectRedCard` ([`app/actions/cards.ts`](../app/actions/cards.ts));
> view: [`components/head-judge/head-judge-view.tsx`](../components/head-judge/head-judge-view.tsx)

1. **Head Judge join:** เปิด tab ใหม่ → `/head-judge/events/evt-live/join` → กรอกรหัส HEAD_JUDGE
2. **Pending list:** เห็นใบแดง state=PENDING ทั้งหมดของรอบ (รวมที่ seed ไว้ + ที่เพิ่งกดใน 3.3)
3. **Confirm red:** กด "ยืนยัน" → atomic `updateMany` PENDING→CONFIRMED (เซ็ต `decidedBy`/`decidedAt`)
   - RoundActivityLog มี `red_card_confirm`
   - double-click จะ idempotent (`{ ok: true, alreadyDecided: true }`)
4. **Reject red:** กด "ยกเลิก" → PENDING→OVERRIDDEN, log `red_card_override`; OVERRIDDEN ไม่นับ DQ
5. **Auto-DQ:** confirm ใบแดงจนนักกีฬาคนเดียวมี **≥4 CONFIRMED reds จาก 4 judges** →
   `RoundAthlete.status` เปลี่ยนเป็น DQ อัตโนมัติ + log `athlete_dq`
   (ถ้า DQ นั้นทำให้ไม่มีนักกีฬาเหลือในสนาม รอบจะ auto-end ด้วย)

### 3.5 Event Logger flow (lap / finish)

> writes: `recordLapTime` / `recordFinishTime` ([`app/actions/timing.ts`](../app/actions/timing.ts));
> UI: [`components/timekeeper/lap-recorder.tsx`](../components/timekeeper/lap-recorder.tsx) (ใช้ร่วมในหน้า event-logger)
> ต้องเป็น session position `EVENT_LOGGER` เท่านั้น

1. **Event Logger join:** `/event-logger/events/evt-live/join` → กรอกรหัส EVENT_LOGGER
2. ใน workspace (รอบต้อง ONGOING + มี `startedAt`):
   - กดปุ่มที่นักกีฬา → ถ้ายังไม่ถึง lap สุดท้าย → `recordLapTime(nextLap, elapsedMs)` (bump `currentLap`)
   - ถ้า `nextLap >= lapCount` → `recordFinishTime` (สร้าง FinishTime + เขียน lap สุดท้ายให้ครบ N/N)
   - ปุ่มมี **cooldown 10 วินาที** ต่อนักกีฬา (COOLDOWN_MS = 10_000) — นักกีฬาคนอื่นยังกดได้
3. **Auto-positioning:** `position = (จำนวน finishTimes ที่ไม่ถูกลบ) + 1` → คนแรกที่จบได้ position=1
4. **Duplicate finish:** record finish ซ้ำของคนเดิม → **idempotent no-op** `{ ok: true, alreadyFinished: true }` (ไม่ใช่ error)
5. **Auto-finish round:** เมื่อ status-OK ทุกคน finish ครบ → รอบ auto-end (`roundEnded: true`)

### 3.6 Public scoreboard

> [`components/events/live-board.tsx`](../components/events/live-board.tsx) — client poll ทุก 5s
> ไปที่ route `/api/events/{eventId}/leaderboard` (CDN-cached);
> DTO สร้างจาก [`lib/leaderboard.ts`](../lib/leaderboard.ts)

1. เปิด `/events/evt-live` (anonymous)
2. ต้องเห็น:
   - ชื่อ event + รอบปัจจุบัน + elapsed time (live, `LiveTimer` อิง `startedAt`/`endedAt`)
   - ตารางนักกีฬา (display order = round start-list `sortOrder`, ไม่ reorder ตามผล)
   - **rank** คำนวณแยกบนสำเนาที่ sort ตาม finish (เฉพาะ OK && finished)
   - นักกีฬา DQ แสดง ribbon **DQ**
   - คอลัมน์ใบแดงแสดง **เฉพาะ CONFIRMED reds** (PENDING/OVERRIDDEN ไม่ขึ้น)
3. เปลี่ยน `?round=` → board adopt ค่า server-rendered ทันที (ไม่รอ poll รอบถัดไป)
4. ดู `/events/evt-fin-nat` (FINISHED) → finished athletes มี position, มี DQ/DNF
5. **Resilience:** ตัดเน็ตชั่วคราว → board คงค่าเดิม (ไม่ blank)

### 3.7 Moderator (Admin) live view

> [`/admin/events/{eventId}/moderator`](../app/admin/(pages)/events/[eventId]/moderator/page.tsx) —
> Server Component อ่าน Prisma ตรง; refresh ด้วย `revalidatePath`/`revalidateTag` เมื่อมี write
> (ผ่าน [`lib/revalidate-race-day.ts`](../lib/revalidate-race-day.ts))

1. Login admin (ต้องมีสิทธิ์ `moderator: view` — `owner` หรือ `score`) → `/admin/events/evt-live/moderator`
2. ต้องเห็น:
   - Round selector — สลับ prelim / final ได้
   - Athletes table — Y count + R count ถูกต้อง (R นับเฉพาะ CONFIRMED)
   - Judges table — กดขยายเห็น cards ที่แต่ละ judge ออก (`isFromThisJudge` ฯลฯ)
   - Pending red badge "X รอยืนยัน" ถ้ามี pending
   - Activity log — `round_start`, `athlete_dq` ฯลฯ ปรากฏ

### 3.8 Empty / draft event UX

1. เข้า `/admin/events/evt-draft` → เห็น event detail แต่ rounds list ว่าง
2. เปิด `/events/evt-draft` → scoreboard ต้องโชว์สถานะ "ยังไม่มีข้อมูล" gracefully (ไม่ crash)
3. ลอง join `/judge/events/evt-draft/join` → join action ต้อง return error (ไม่มี round เปิด)

---

## 4. ตรวจสอบเรื่อง security / edge cases

### Session (official JWT cookie)

> cookie `rw_official_session` (signed HS256 ด้วย `NEXTAUTH_SECRET`, TTL 12h);
> primitives ใน [`lib/official-jwt.ts`](../lib/official-jwt.ts) / [`lib/official-session.ts`](../lib/official-session.ts)

- **Cookie invalid** — ลบ cookie `rw_official_session` ใน DevTools → เข้า workspace → ต้อง redirect กลับ `/join`
- **Cross-event session** — join เป็น judge ใน `evt-live` → ลอง URL `/judge/events/evt-sched` → mismatch eventId → redirect ไป join
- **Wrong role** — join เป็น JUDGE → ลอง URL `/head-judge/events/evt-live` → mismatch position → redirect ไป join

### Card constraints ([`app/actions/cards.ts`](../app/actions/cards.ts))

- **Yellow ต่อ symbol ต่อ judge ต่อ athlete = 1** — ออก symbol เดิมซ้ำ → throws `"ให้ใบเหลืองสัญลักษณ์นี้แก่นักกีฬาคนนี้แล้ว"`
- **Max red ต่อ judge ต่อ athlete = 1** — ออก red ครั้งที่ 2 จาก judge เดียวกัน → throws `"ได้ออกใบแดงให้นักกีฬาคนนี้แล้ว"`
- **Athlete ไม่อยู่ในรอบ** — issue card ด้วย athleteId ที่ไม่ได้อยู่ในรอบ → throws `"นักกีฬาไม่อยู่ในรอบนี้"`
- **OVERRIDDEN red ไม่ block** — judge ที่ red ถูก override สามารถออก red ใหม่ได้

### Round status

- **FINISHED round** — รหัสจากรอบที่จบแล้ว → join ปฏิเสธ `"รอบที่ใช้รหัสนี้จบการแข่งขันแล้ว"`
- **ออก card นอก ONGOING** — รอบไม่ ONGOING → ออก card ไม่ได้ (`assertRoundOngoingForCards`)

### Rate limit (join)

- `joinAsOfficial` ([`app/actions/officials.ts`](../app/actions/officials.ts)): max **10 ครั้ง/นาที/IP/event**
  → เกินแล้ว return `"พยายามมากเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง"`

### DQ trigger

- **DQ threshold = 4 CONFIRMED reds** — ออก red 4 ใบจาก 4 judges ให้คนเดียวกัน → confirm หมด →
  status เปลี่ยน DQ อัตโนมัติ + RoundActivityLog `athlete_dq` ถูกสร้าง

---

## 5. Features (full rollout) — สถานะ Implemented

### 5.1 Race timer sync (synced across roles)
- Round มี `startedAt` / `endedAt` ใน schema — single source of truth
- Admin/Moderator กดปุ่ม **"▶ เริ่มจับเวลาการแข่งขัน"** ([`startRound`](../app/actions/round-timing.ts)) →
  status SCHEDULED → ONGOING + เซ็ต `startedAt` (gate: ต้องมี ≥1 ของแต่ละตำแหน่ง JUDGE/HEAD_JUDGE/EVENT_LOGGER)
- ทุก role (Judge/Head Judge/Event Logger/Public) เห็นเวลาเดียวกันแบบสด (`LiveTimer` อิง `startedAt`)
- กดปุ่ม **"■ จบการแข่งขัน"** ([`endRound`](../app/actions/round-timing.ts)) → status FINISHED + เซ็ต `endedAt`
- Seeded `evt-live` รอบ LIVE มี `startedAt` ในอดีต — timer เปิดมาเดินต่อทันที

### 5.2 Export (Report page)
- `/admin/events/{eventId}/report` มีปุ่ม:
  - **⬇ ดาวน์โหลด CSV / XLSX** — รวมทุกรอบ (ใช้ `papaparse` / `exceljs`; ใส่ BOM แก้ภาษาไทยใน CSV)
  - **🖨️ Print / Save as PDF** — เปิดหน้า print-friendly กด Ctrl+P
  - **รายรอบ** — ดาวน์โหลดแยกแต่ละรอบ
- Endpoints: `/api/events/{eventId}/export?round={roundId}` และ `/api/events/{eventId}/summary-xlsx` (admin auth required)

### 5.3 Moderator edit (correction mode)
- `/admin/events/{eventId}/moderator/edit?round={roundId}` — แก้ไขข้อมูลที่ผิดพลาด ([`app/actions/moderator.ts`](../app/actions/moderator.ts))
- จัดการได้: ลบ/แก้ card, confirm/reject red (head-judge fallback), override athlete status (OK/DQ/DNF),
  แก้ไข/ลบ lap time, แก้ไข/ลบ finish time, แก้ round info (`startedAt`/`endedAt`/`lapCount`/`distanceKm`/`name`)
- ทุก action บันทึกใน RoundActivityLog + ActivityLog (`logCurrentAdmin`)
- ถ้าลบใบแดง CONFIRMED ที่ทำให้นักกีฬา DQ — ระบบปลด DQ อัตโนมัติเมื่อ confirmed reds < 4

### 5.4 Real-time updates
- **Official workspaces** (Judge / Head Judge / Event Logger): `<AutoRefresh>` →
  `router.refresh()` ทุก **2000 ms** ถ้ารอบ SCHEDULED, **2500 ms** ถ้าไม่ใช่
  ([`components/common/auto-refresh.tsx`](../components/common/auto-refresh.tsx))
- **Public scoreboard:** client poll JSON route ทุก **5000 ms** (ไม่ใช่ `router.refresh`),
  CDN cache `s-maxage=4, stale-while-revalidate=10` → ผู้ชมส่วนใหญ่ถูกดูดที่ edge (0 Active CPU)
- **Home page** (`/`): `<AutoRefresh>` ทุก **15000 ms**
- **Moderator:** ไม่ใช้ AutoRefresh — เป็น Server Component, อัปเดตผ่าน `revalidatePath`/`revalidateTag` เมื่อมี write

### 5.5 CSV import (bulk add) — **ROOT ADMIN เท่านั้น**
- import แบบ 2 เฟส (preview → commit), all-or-nothing `$transaction` ([`app/actions/csv-import.ts`](../app/actions/csv-import.ts))
- Athlete (`name, country, affiliation_name`; affiliation auto-create), Judge, Affiliation
- limits: `MAX_ROWS = 5000`, `MAX_BYTES = 5MB`; รองรับ header row

### 5.6 Profile / password change
- `/admin/settings` — แก้ไขชื่อ/อีเมล + เปลี่ยนรหัสผ่าน ([`app/actions/profile.ts`](../app/actions/profile.ts))
- ต้องใส่รหัสผ่านปัจจุบันถึงจะเปลี่ยนได้, รหัสใหม่ ≥ 8 ตัวอักษร

### 5.7 Admin audit log
- ทุก mutation ของ admin (event/round/athlete/judge/affiliation/admin CRUD + moderator overrides)
  บันทึกใน `ActivityLog` table (`createActivityLog` กลืน error ไม่ให้ล้ม request)
- หมายเหตุ: ยังไม่มี UI แสดงเต็มรูปแบบ — ดูได้ผ่าน DB query (genuine TODO)

### 5.8 Rate limit (security)
- `joinAsOfficial`: max **10 ครั้ง/นาที/IP/event** — กัน brute-force secret codes (ดู §4)

### 5.9 Toast notifications
- ใช้ `sonner` — toast บน top-right พร้อม success/error/warning colors (mounted ใน `app/layout.tsx`)

---

## 6. Reset & Re-test

ถ้าทดสอบจนข้อมูลเลอะแล้ว — รีเซ็ตกลับสภาพ seed ด้วย:

```bash
npm run db:seed:reset
```

จะ:
1. ลบทุก row ในทุกตาราง (FK-safe order)
2. Reseed ทั้งหมดตามที่บรรยายไว้ในเอกสารนี้ (generator-driven)
3. รหัสผ่าน admin ถูกรีเซ็ตด้วย
4. พิมพ์ joinable secret codes + summary ออกมาใน console
