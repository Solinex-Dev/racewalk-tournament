import { describe, it, expect } from "vitest";
import { composeName, PREFIX_OPTIONS } from "@/lib/person-name";

describe("composeName", () => {
  it("joins prefix + firstName + lastName", () => {
    expect(composeName({ prefix: "นาย", firstName: "สมชาย", lastName: "ใจดี" })).toBe(
      "นาย สมชาย ใจดี",
    );
  });
  it("omits null / empty / whitespace-only parts", () => {
    expect(composeName({ firstName: "สมชาย" })).toBe("สมชาย");
    expect(composeName({ prefix: "นาย", firstName: "สมชาย", lastName: null })).toBe(
      "นาย สมชาย",
    );
    expect(composeName({ prefix: "  ", firstName: " สมชาย ", lastName: "" })).toBe("สมชาย");
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
