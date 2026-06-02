# Test Scenarios — Racewalk Tournament

คู่มือทดสอบครอบคลุมทุก lifecycle ของระบบ ใช้ร่วมกับ seed data ที่อยู่ใน [`prisma/seed.ts`](../prisma/seed.ts).

> **Setup:** รัน `npm run db:seed:reset` ก่อนเริ่ม เพื่อรีเซ็ตข้อมูลทั้งหมดเป็นสถานะที่เอกสารนี้บรรยาย

---

## 1. ข้อมูลที่ถูก seed

### Events

| Event ID | สถานะ | Rounds | Test target |
|----------|------|--------|-------------|
| `evt-empty` | DRAFT | 0 rounds | UX สำหรับ event ที่ยังไม่มีอะไรเลย |
| `evt-pre` | SCHEDULED | 1 (SCHEDULED) | Pre-race setup — judges join ก่อนเริ่ม |
| `evt-001` | ONGOING | 2 (FINISHED + ONGOING) | **หลัก — race-day live flow** |
| `evt-past` | FINISHED | 1 (FINISHED) | ผลลัพธ์ + ประวัติ |

### Users (Admin)

| Email | Password | Status | Title | ใช้ทดสอบ |
|------|----------|--------|-------|----------|
| `owner@racewalk.local` | `owner1234` | ACTIVE | Owner | login ปกติ + admin ทุกหน้า |
| `events@racewalk.local` | `events1234` | ACTIVE | Event Manager | login ปกติ |
| `score@racewalk.local` | `score1234` | ACTIVE | Score Officer | login ปกติ |
| `suspended@racewalk.local` | `suspended1234` | SUSPENDED | Former Admin | ทดสอบ **login block** |

### Secret codes (Round Officials)

> ⚠️ **เฉพาะ ONGOING round** เท่านั้นที่จะ login เข้า workspace ได้ — รหัสจาก FINISHED round จะถูกปฏิเสธ

#### `evt-001 / round-2` (ONGOING — รอบชิงชนะเลิศ) — ใช้ทดสอบหลัก

| Position | Judge | Secret Code | Zone | Redirect ไป |
|----------|-------|-------------|------|-------------|
| JUDGE | สมศักดิ์ กรรมการ | **`QR3456`** | Zone A | `/judge/events/evt-001` |
| JUDGE | วิชัย ตัดสิน | **`ST7892`** | Zone B | `/judge/events/evt-001` |
| JUDGE | ประเสริฐ มองทาง | **`UV3467`** | Zone C | `/judge/events/evt-001` |
| JUDGE | อนุชา ฟ้าใส | **`WX5678`** | Zone D | `/judge/events/evt-001` |
| HEAD_JUDGE | Head Judge Ref | **`YZ9234`** | – | `/head-judge/events/evt-001` |
| EVENT_LOGGER | Event Logger 1 | **`HJ4589`** | – | `/event-logger/events/evt-001` |
| TIMEKEEPER | Timekeeper 1 | **`KL6235`** | – | `/timekeeper/events/evt-001` |

#### `evt-pre / round-pre` (SCHEDULED — pre-race)

| Position | Judge | Secret Code |
|----------|-------|-------------|
| JUDGE | Coach E (jud-008) | `PA2345` |
| JUDGE | สมศักดิ์ กรรมการ | `PB3456` |
| HEAD_JUDGE | Head Judge Backup | `PC4567` |
| EVENT_LOGGER | Event Logger 1 | `PD5678` |
| TIMEKEEPER | Timekeeper Pre-race | `PE6789` |

#### `evt-001 / round-1` (FINISHED) + `evt-past / round-past` (FINISHED)

รหัสอยู่ในระบบ (ดูใน seed.ts) แต่จะถูก **ปฏิเสธ** ตอน join เพราะ round สถานะ FINISHED

---

## 2. สถานะนักกีฬาใน `round-2` (ONGOING — playground หลัก)

| BIB | นักกีฬา | สังกัด | Lap | Cards (ของจริง) | Status |
|-----|---------|--------|-----|----------------|--------|
| 01 | Somchai Rakdee (TH) | ชมรมเดินทนกรุงเทพฯ | 7/20 | _ไม่มี (clean leader)_ | OK |
| 02 | Jane Doe (TH) | Bangkok Road Runners | 7/20 | 2 yellow + **1 PENDING red** | OK (รอ Head Judge) |
| 03 | Chanida Runfast (TH) | ChiangMai Striders | 6/20 | 3 yellow + 1 CONFIRMED red | OK (ใกล้ trouble) |
| 04 | Luis Garcia (ES) | Hat Yai Athletic Club | 5/20 | **4 CONFIRMED reds** + 1 yellow | **DQ** |
| 05 | Siriwan Walkfast (TH) | ชมรมเดินทนกรุงเทพฯ | 6/20 | _ไม่มี (clean)_ | OK |

---

## 3. Walkthrough — Test Cases ตาม flow

### 3.1 Admin lifecycle

1. **Login** ที่ `localhost:3000/admin/login` ด้วย `owner@racewalk.local` / `owner1234`
2. **Suspended user blocked** — ลอง login ด้วย `suspended@racewalk.local` → ต้องถูกปฏิเสธ (ตรวจ `lib/user-status.ts` resolveUserStatus)
3. **Events list** ที่ `/admin/events`
   - เห็น 4 events
   - event ที่ `ONGOING` มี badge LIVE
   - ปุ่ม "Moderator" เห็นเฉพาะ event ที่ดำเนินการได้
4. **Create new event** — `/admin/events/new` → กรอกฟอร์ม → DB มี row ใหม่
5. **Add round** — เข้า event ใหม่ → `/admin/events/{id}/rounds/new` → เลือก athletes + judges → generate secret codes → save → ดู secret codes ที่ออกมาในตาราง

### 3.2 Pre-race join (evt-pre)

1. เปิด `/judge/events/evt-pre/join` (anonymous)
2. กรอกรหัส **`PA2345`** → ต้องถูก redirect ไป `/judge/events/evt-pre`
3. ใน workspace เห็นนักกีฬา 4 คน (BIB 11-14) — ทั้งหมด clean ไม่มี cards
4. **ทดสอบ logout** — กดออกจากระบบ → กลับ join page
5. กรอกรหัสผิด เช่น `XXXXXX` → ได้ error "รหัสกรรมการไม่ถูกต้องสำหรับ Event นี้"

### 3.3 Race-day Judge flow (evt-001 / round-2)

1. **Judge join:** `/judge/events/evt-001/join` → กรอก **`QR3456`** (Coach A, Zone A)
2. ใน workspace เห็น 5 นักกีฬา:
   - BIB 04 (Luis) แสดง **DQ** ribbon → ปุ่ม disable
   - BIB 01 (Somchai), 02 (Jane), 03 (Chanida), 05 (Siriwan) กดได้
3. **Yellow card flow:**
   - กดที่ BIB 01 → action bar ขึ้น → กด "งอเข่า" ใต้ใบเตือน → DB เพิ่ม card YELLOW BENT_KNEE
   - หลัง refresh ดูจุดเหลืองที่ BIB 01 จะมี filled
   - กดอีกครั้ง (yellow BENT_KNEE อีก) → ปุ่ม disable เพราะให้แล้ว
   - กด LIFTED_FOOT → ได้ครบ 2 yellow
   - กด LIFTED_FOOT อีก → ปุ่ม disable
4. **Try max yellow:** ลองออก yellow ที่ 3 → ปุ่มหายเพราะ disabled (max 2 per judge per athlete)
5. **Red card flow:**
   - กดที่ BIB 05 (clean newcomer) → กด "งอเข่า" ใต้ใบแดง → DB สร้าง card RED BENT_KNEE state=PENDING
   - ปุ่ม red ทั้งสองจะถูก disable หลังออก (max 1 red per judge per athlete)
6. **DQ athlete protection:** กดที่ BIB 04 → ทุกปุ่มถูก disable

### 3.4 Head Judge confirm/reject flow

1. **Head Judge join:** เปิด tab ใหม่ → `/head-judge/events/evt-001/join` → กรอก **`YZ9234`**
2. **Pending list:** ต้องเห็น 2 รายการ:
   - BIB 02 (Jane Doe) — pending red BENT_KNEE จาก Coach A (seed)
   - BIB 05 (Siriwan) — pending red BENT_KNEE จาก Coach A (ถ้าเพิ่งกดใน step 3.3.5)
3. **Confirm red:** กด "ยืนยัน" ของ BIB 02 → DB เปลี่ยน state=CONFIRMED, decidedBy=jud-005
   - Activity log มี `red_card_confirm` record
   - ดูที่ BIB 02 ในตารางนักกีฬาด้านล่าง — confirmedRed=1, pendingRed=0
4. **Reject red:** กด "ยกเลิก" ของ BIB 05 → DB เปลี่ยน state=OVERRIDDEN
   - Activity log มี `red_card_override` record
   - BIB 05 confirmedRed=0
5. **Test auto-DQ:** ออก red 3 ใบจาก 3 judges อื่นๆ ให้ BIB 02 (ใช้ `ST7892`, `UV3467`, `WX5678`) → confirm หมด → DB เปลี่ยน RoundAthlete.status เป็น DQ อัตโนมัติ

### 3.5 Event Logger / Timekeeper flow

1. **Event Logger join:** `/event-logger/events/evt-001/join` → กรอก **`HJ4589`**
2. หรือ **Timekeeper join:** `/timekeeper/events/evt-001/join` → กรอก **`KL6235`**
3. ใน workspace:
   - กดปุ่ม "เริ่ม" → stopwatch เริ่มเดิน
   - กดปุ่มที่ BIB 01 → DB เพิ่ม lap (lapNumber=8) ที่ timeMs = elapsed
   - กดต่อเนื่องจนถึง lap สุดท้าย (lap 20) → ปุ่มแสดง "เข้าเส้นชัย" → กดแล้วสร้าง FinishTime
4. **Auto-positioning:** ดูที่ DB หรือ scoreboard → FinishTime ของคนแรกที่จบจะมี position=1
5. **Duplicate finish:** ลอง record finish ซ้ำของคนเดิม → ต้องได้ error "บันทึกเวลาเข้าเส้นชัยของนักกีฬาคนนี้ไปแล้ว"

### 3.6 Public scoreboard

1. เปิด `/events/evt-001` (anonymous)
2. ต้องเห็น:
   - ชื่อ event + รอบปัจจุบัน + elapsed time (live computed)
   - ตารางนักกีฬา 5 คน
   - BIB 04 (Luis DQ) อยู่ล่างสุด ribbon **DQ**
   - BIB 01 (Somchai) อันดับ 1 (ไม่มี red, lap สูงสุด)
   - ใบแดง column แสดง 4 ใบสำหรับ BIB 04, 1 ใบสำหรับ BIB 03
3. ดู `/events/evt-past` → ต้องเห็น 5 นักกีฬา: 3 finished มี position, 1 DQ, 1 DNF

### 3.7 Moderator (Admin) live view

1. Login admin → `/admin/events/evt-001/moderator`
2. ต้องเห็น:
   - Round selector — กดเปลี่ยน round-1/round-2 ได้
   - Athletes table — Y count + R count ถูกต้อง (R นับเฉพาะ CONFIRMED)
   - Judges table — กดขยายเห็น cards ที่แต่ละ judge ออก
   - Pending red badge "X รอยืนยัน" ถ้ามี pending
   - Activity log — round_start, athlete_dq events ปรากฏ

### 3.8 Empty event UX

1. เข้า `/admin/events/evt-empty` → เห็น event detail แต่ rounds list ว่าง
2. เปิด `/events/evt-empty` → scoreboard ต้องโชว์ "ยังไม่มีข้อมูล" gracefully (ไม่ crash)
3. ลอง join `/judge/events/evt-empty/join` → join action ต้อง return error (ไม่มี round เปิด)

---

## 4. ตรวจสอบเรื่อง security / edge cases

### Session
- **Cookie invalid** — ลบ cookie `rw_official_session` ใน DevTools → เข้า workspace → ต้อง redirect กลับ `/join`
- **Cross-event session** — join เป็น judge ใน evt-001 → ลอง URL `/judge/events/evt-pre` → ต้อง redirect ไป join page (session.eventId mismatch)
- **Wrong role** — join เป็น JUDGE → ลอง URL `/head-judge/events/evt-001` → redirect ไป join (session.position mismatch)

### Card constraints
- **Max yellow ต่อ judge ต่อ athlete = 2** — ออก 3 จาก judge เดียวกัน → server throws "ให้ใบเหลืองครบ 2 ใบ"
- **Max red ต่อ judge ต่อ athlete = 1** — ออก red ครั้งที่ 2 จาก judge เดียวกัน → server throws "ได้ออกใบแดงให้นักกีฬาคนนี้แล้ว"
- **Athlete ไม่อยู่ในรอบ** — POST issueCard ด้วย athleteId ที่ไม่ได้อยู่ในรอบ → throws "นักกีฬาไม่อยู่ในรอบนี้"
- **OVERRIDDEN red ไม่ block** — judge ที่ red ถูก override สามารถออก red ใหม่ได้

### Round status
- **FINISHED round** — รหัสจาก round-1 (`AB2345`) → join action ปฏิเสธว่า "รอบที่ใช้รหัสนี้จบการแข่งขันแล้ว"

### DQ trigger
- **DQ threshold = 4 CONFIRMED reds** — Test: ออก red 4 ใบจาก 4 judges ให้คนเดียวกัน → confirm หมด → status เปลี่ยน DQ อัตโนมัติ + activity log `athlete_dq` ถูกสร้าง

---

## 5. New features (full rollout)

### 5.1 Race timer sync (synced across roles)
- Round มี `startedAt` / `endedAt` ใน schema — single source of truth
- Admin/Moderator กดปุ่ม **"▶ เริ่มจับเวลาการแข่งขัน"** ที่หน้า moderator → status SCHEDULED → ONGOING + เซ็ต `startedAt = now()`
- ทุก role (Judge/Head Judge/Event Logger/Timekeeper/Public) เห็นเวลาเดียวกันแบบสด
- กดปุ่ม **"■ จบการแข่งขัน"** → status FINISHED + เซ็ต `endedAt = now()`
- Seeded `evt-001/round-2` มี `startedAt` 30 นาทีก่อน — timer เปิดมาเดิน 30:00 เลย

### 5.2 Export (Report page)
- `/admin/events/{eventId}/report` มีปุ่ม:
  - **⬇ ดาวน์โหลด CSV** — รวมทุกรอบในไฟล์เดียว (เปิด Excel ได้ตรงๆ ใส่ BOM แก้ปัญหาภาษาไทย)
  - **🖨️ Print / Save as PDF** — เปิดหน้า print-friendly ที่ `/admin/events/{eventId}/report/print` กด Ctrl+P
  - **CSV รายรอบ** — ดาวน์โหลดแยกแต่ละรอบ
- Endpoint: `/api/events/{eventId}/export?round={roundId}` (admin auth required)

### 5.3 Moderator edit (correction mode)
- `/admin/events/{eventId}/moderator/edit?round={roundId}` — แก้ไขข้อมูลที่ผิดพลาด
- จัดการได้: ลบ card (ใบเหลือง/แดง), override athlete status (OK/DQ/DNF), แก้ไข/ลบ lap time, แก้ไข/ลบ finish time
- ทุก action ต้องระบุ **เหตุผล** ผ่าน prompt → บันทึกใน RoundActivityLog + ActivityLog
- ถ้าลบใบแดง CONFIRMED ที่ทำให้นักกีฬา DQ — ระบบปลด DQ อัตโนมัติเมื่อ confirmed reds < 4

### 5.4 Real-time polling
- หน้า Workspaces มี `<AutoRefresh>` poll ทุก:
  - Head Judge: **5 วินาที** (เห็น pending reds เร็ว)
  - Public scoreboard: **10 วินาที**
  - Event Logger / Timekeeper: **10 วินาที** (สำหรับ race state)
  - Judge: **15 วินาที** (น้อยกว่าเพราะ judge ส่วนใหญ่เป็นคนออก ไม่ใช่รอรับ)
  - Moderator: **10 วินาที**

### 5.5 CSV import (bulk add)
- `/admin/athletes` มีปุ่ม **⬆ Import CSV** — คอลัมน์: `name, country, affiliation_name`
  - Affiliation ถูกสร้างอัตโนมัติถ้ายังไม่มี
- `/admin/judges` มีปุ่ม **⬆ Import CSV** — คอลัมน์: `name`
- รองรับ header row (ระบบจะ skip ให้)

### 5.6 Password change
- `/admin/settings` — แก้ไขชื่อ/อีเมล/บทบาท + เปลี่ยนรหัสผ่าน
- ต้องใส่รหัสผ่านปัจจุบันถึงจะเปลี่ยนได้, รหัสใหม่ต้องไม่ซ้ำ + ≥ 8 ตัวอักษร

### 5.7 Admin audit log
- ทุก mutation ของ admin (event/round/athlete/judge/affiliation/admin CRUD + moderator overrides) บันทึกใน `ActivityLog` table
- ดูได้ผ่าน DB query (ยังไม่มี UI แสดง — Future enhancement)

### 5.8 Rate limit (security)
- `joinAsOfficial` action: max **10 ครั้ง/นาที/IP/event** — กัน brute-force secret codes
- เกิน → return `"พยายามมากเกินไป กรุณารอสักครู่"`

### 5.9 Toast notifications
- ใช้ `sonner` — toast บน top-right พร้อม success/error/warning colors
- แทนที่ inline error message เดิม (ไม่ต้อง refresh เห็นทันที)

---

## 6. Reset & Re-test

ถ้าทดสอบจนข้อมูลเลอะแล้ว — รีเซ็ตกลับสภาพ seed ด้วย:

```bash
npm run db:seed:reset
```

จะ:
1. ลบทุก row ในทุกตาราง (FK-safe order)
2. Reseed ทั้งหมดตามที่บรรยายไว้ในเอกสารนี้
3. รหัสผ่าน admin ถูกรีเซ็ตด้วย
