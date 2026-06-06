import { describe, it, expect } from "vitest";
import { composeName, PREFIX_OPTIONS } from "@/lib/person-name";

describe("composeName", () => {
  it("joins prefix + firstName + lastName", () => {
    expect(composeName({ prefix: "นาย", firstName: "สมชาย", lastName: "ใจดี" })).toBe(
      "นาย สมชาย ใจดี",
    );
  });
  it("inserts middleName between firstName and lastName", () => {
    expect(
      composeName({ prefix: "นาย", firstName: "สมชาย", middleName: "ชนะ", lastName: "ใจดี" }),
    ).toBe("นาย สมชาย ชนะ ใจดี");
    expect(composeName({ firstName: "สมชาย", middleName: "ชนะ" })).toBe("สมชาย ชนะ");
  });
  it("omits null / empty / whitespace-only parts", () => {
    expect(composeName({ firstName: "สมชาย" })).toBe("สมชาย");
    expect(composeName({ prefix: "นาย", firstName: "สมชาย", lastName: null })).toBe(
      "นาย สมชาย",
    );
    expect(composeName({ prefix: "  ", firstName: " สมชาย ", lastName: "" })).toBe("สมชาย");
    // null middleName is skipped (no double space)
    expect(
      composeName({ prefix: "นาย", firstName: "สมชาย", middleName: null, lastName: "ใจดี" }),
    ).toBe("นาย สมชาย ใจดี");
  });
  it("returns an empty string when every part is empty", () => {
    expect(composeName({})).toBe("");
  });
});

describe("PREFIX_OPTIONS", () => {
  it("contains the Thai presets", () => {
    expect(PREFIX_OPTIONS).toContain("นาย");
    expect(PREFIX_OPTIONS).toContain("นาง");
    expect(PREFIX_OPTIONS).toContain("นางสาว");
  });
});
