import { describe, it, expect } from "vitest";
import {
  formatRoundActivityLog,
  type RoundActivityLogInput,
  type ActivityLogTextPart,
} from "@/lib/round-activity-log-display";

const fmt = (i: Partial<RoundActivityLogInput>) =>
  formatRoundActivityLog({ actionType: "x", actorName: "ช.", actorRole: "JUDGE", ...i });
const joined = (parts: ActivityLogTextPart[]) => parts.map((p) => p.text).join("");

describe("formatRoundActivityLog", () => {
  it("maps actor role to a Thai label and falls back to the raw role", () => {
    expect(fmt({ actorRole: "HEAD_JUDGE" }).actorRoleLabel).toBe("หัวหน้ากรรมการ");
    expect(fmt({ actorRole: "EVENT_LOGGER" }).actorRoleLabel).toBe("ผู้บันทึก Lap Time");
    expect(fmt({ actorRole: "WHATEVER" }).actorRoleLabel).toBe("WHATEVER");
  });

  it("formats a yellow card with target athlete + symbol detail line", () => {
    const r = fmt({
      actionType: "yellow_card",
      targetBib: "12",
      targetAthleteName: "สมชาย",
      details: "ยกเท้า",
    });
    expect(r.badge?.label).toBe("ใบเหลือง");
    expect(joined(r.parts)).toContain("ออก");
    expect(joined(r.parts)).toContain("ใบเหลือง");
    expect(joined(r.parts)).toContain("Bib 12");
    expect(joined(r.parts)).toContain("สมชาย");
    expect(r.detailLine).toBe("สัญลักษณ์: ยกเท้า");
  });

  it("formats a pending red card with the awaiting-confirmation note", () => {
    const r = fmt({ actionType: "red_card", targetBib: "7" });
    expect(r.badge?.label).toBe("ใบแดง");
    expect(joined(r.parts)).toContain("ขอออก");
    expect(joined(r.parts)).toContain("รอหัวหน้ากรรมการยืนยัน");
    expect(joined(r.parts)).toContain("Bib 7");
  });

  it("strips the leading 'DQ - ' from the disqualification detail line", () => {
    const r = fmt({ actionType: "athlete_dq", details: "DQ - ครบใบแดง 4 ใบ", targetBib: "3" });
    expect(joined(r.parts)).toContain("ตัดสิทธิ์");
    expect(r.detailLine).toBe("ครบใบแดง 4 ใบ");
  });

  it("uses a default DQ reason when none is provided", () => {
    expect(fmt({ actionType: "athlete_dq" }).detailLine).toBe("ครบใบแดงตามกติกา");
  });

  it("formats round start and end", () => {
    expect(joined(fmt({ actionType: "round_start" }).parts)).toContain("เริ่ม");
    expect(joined(fmt({ actionType: "round_end" }).parts)).toContain("จบ");
  });

  it("falls back gracefully for an unknown action type", () => {
    const r = fmt({ actionType: "mystery", actorRole: "ADMIN", details: "hello" });
    expect(r.actorRoleLabel).toBe("ผู้ดูแลระบบ");
    expect(r.badge?.label).toBe("mystery");
    expect(joined(r.parts)).toContain("hello");
  });

  it("omits the 'ให้ <target>' clause when there is no bib or name", () => {
    const r = fmt({ actionType: "red_card_confirm" });
    expect(joined(r.parts)).toContain("ยืนยัน");
    expect(joined(r.parts)).not.toContain("ให้");
  });
});
