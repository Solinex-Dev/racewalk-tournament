import { describe, it, expect } from "vitest";
import {
  buildDeletedUserEmail,
  parseOriginalEmailFromDeletedPlaceholder,
} from "@/lib/deleted-email-placeholder";

describe("deleted-email placeholder", () => {
  it("builds and parses a round-trip with an original email", () => {
    const built = buildDeletedUserEmail("u1", "a@b.com");
    expect(built).toBe("deleted_u1_a@b.com");
    expect(parseOriginalEmailFromDeletedPlaceholder("u1", built)).toBe("a@b.com");
  });
  it("uses the noemail marker when the original is null", () => {
    const built = buildDeletedUserEmail("u1", null);
    expect(built).toBe("deleted_u1_noemail");
    expect(parseOriginalEmailFromDeletedPlaceholder("u1", built)).toBeNull();
  });
  it("returns null for non-matching email or a different user id", () => {
    expect(parseOriginalEmailFromDeletedPlaceholder("u1", null)).toBeNull();
    expect(parseOriginalEmailFromDeletedPlaceholder("u1", "a@b.com")).toBeNull();
    expect(parseOriginalEmailFromDeletedPlaceholder("u2", "deleted_u1_a@b.com")).toBeNull();
  });
});
