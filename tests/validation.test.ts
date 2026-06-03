import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  isValidEmailFormat,
  validatePasswordLength,
  EMAIL_MAX_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_NAME_LENGTH,
} from "@/lib/validation";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
  it("leaves an already-normalized address untouched", () => {
    expect(normalizeEmail("a@b.co")).toBe("a@b.co");
  });
});

describe("isValidEmailFormat", () => {
  it.each(["a@b.co", "john.doe@example.com", "x+y@sub.domain.io"])(
    "accepts %s",
    (e) => expect(isValidEmailFormat(e)).toBe(true),
  );
  it.each(["", "noatsign", "a@b", "a b@c.com", "a@b c.com", "@b.com", "a@.com"])(
    "rejects %s",
    (e) => expect(isValidEmailFormat(e)).toBe(false),
  );
});

describe("validatePasswordLength", () => {
  it("rejects shorter than the minimum", () => {
    const r = validatePasswordLength("a".repeat(MIN_PASSWORD_LENGTH - 1));
    expect(r.ok).toBe(false);
    expect(r.error).toContain(String(MIN_PASSWORD_LENGTH));
  });
  it("accepts the exact minimum and maximum", () => {
    expect(validatePasswordLength("a".repeat(MIN_PASSWORD_LENGTH)).ok).toBe(true);
    expect(validatePasswordLength("a".repeat(MAX_PASSWORD_LENGTH)).ok).toBe(true);
  });
  it("rejects longer than the maximum", () => {
    const r = validatePasswordLength("a".repeat(MAX_PASSWORD_LENGTH + 1));
    expect(r.ok).toBe(false);
    expect(r.error).toContain(String(MAX_PASSWORD_LENGTH));
  });
});

describe("validation constants", () => {
  it("have the expected values", () => {
    expect(EMAIL_MAX_LENGTH).toBe(254);
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(MAX_PASSWORD_LENGTH).toBe(72);
    expect(MAX_NAME_LENGTH).toBe(100);
  });
});
