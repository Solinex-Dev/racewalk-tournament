# Glossary

Terms used across the system. Where a term has both a Thai and English form, both are listed because the UI is bilingual (see [architecture/i18n.md](../architecture/i18n.md)).

## Domain terms

| Term | Thai | Definition |
|------|------|------------|
| **Racewalk** | เดินทน / เดินเร็ว | A long-distance walking discipline with strict technique rules |
| **Bent knee** | งอเข่า | Technique fault — advancing knee was bent under the body. Card symbol: `>` |
| **Lifted foot** | ยกเท้า | Technique fault — loss of contact, both feet airborne. Card symbol: `~` |
| **Yellow card** | ใบเตือน | A judge's warning. Max 2 per judge per athlete. Non-disqualifying |
| **Red card** | ใบแดง | A judge's penalty call. Max 1 per judge per athlete. 4 total → DQ |
| **DQ** | ตัดสิทธิ์ | Disqualified — athlete received 4 red cards |
| **DNF** | ไม่จบการแข่งขัน | Did not finish |
| **Bib** | เบอร์เสื้อ | Athlete's race number |
| **Heat** | รุ่น | A categorized group within an event (e.g. age/distance class) |
| **Affiliation** | สังกัด / สโมสร | The club, school, or organization an athlete represents |

## Roles

| Role | Thai | Description |
|------|------|-------------|
| **Admin** | ผู้ดูแลระบบ | Configures events, generates secret codes |
| **Head Judge** | กรรมการหัวหน้า | Oversees judging panel; confirms/overrides red cards |
| **Judge** | กรรมการ | Issues yellow/red cards from the side of the course |
| **Event Logger** | ผู้บันทึกเหตุการณ์ | Records lap times and finish times manually |
| **Timekeeper** | ผู้จับเวลา | Records laps with a stopwatch |
| **Public Viewer** | ผู้ชม | Watches the live scoreboard, no authentication |

## System terms

| Term | Definition |
|------|------------|
| **Event** | A racewalk competition (one date, one location). Contains one or more rounds |
| **Round** | A single race within an event. Has its own distance, athletes, judges |
| **Secret code** | 6-character alphanumeric code generated per non-admin user per round. Used to join the live workspace |
| **Live scoreboard** | The public-facing real-time view of an ongoing event |
| **Activity log** | Append-only stream of actions taken during a round (cards issued, laps recorded, etc.) |
| **Pending red card** | A red card awaiting head-judge confirmation |
| **Override** | Head judge action to cancel a red card |

## Card system terms

| Term | Definition |
|------|------------|
| **Card matrix** | The grid UI showing each athlete's yellow and red cards as symbols. See [components/judge/card-matrix.tsx](../../components/judge/card-matrix.tsx) |
| **Card detail** | Per-card metadata: symbol, which judge issued it, whether it's from "this judge" (for highlighting) |
| **Per-judge limit** | Constraint enforced at one judge's interface (2 yellow, 1 red per athlete) |
| **Aggregate limit** | Constraint across all judges (4 red total → DQ) |

## Status enums

### Athlete status
`OK` | `DQ` | `DNF`

### Event status
`draft` | `scheduled` | `ongoing` | `finished`

### Round status
`scheduled` | `ongoing` | `finished`

### Admin status
`active` | `inactive`

### Activity log `actionType`
`yellow_card` | `red_card` | `red_card_confirm` | `red_card_override` | `round_start` | `round_end` | `lap_time` | `finish_time` | `other`
