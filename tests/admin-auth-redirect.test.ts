import { describe, it, expect } from "vitest";
import { getSafeAdminRedirect, isAdminSession } from "@/lib/admin-auth-redirect";

describe("getSafeAdminRedirect", () => {
  it("returns the fallback for empty / nullish input", () => {
    expect(getSafeAdminRedirect(undefined)).toBe("/admin");
    expect(getSafeAdminRedirect(null)).toBe("/admin");
    expect(getSafeAdminRedirect("")).toBe("/admin");
  });
  it("allows safe same-origin paths (trimmed)", () => {
    expect(getSafeAdminRedirect("/admin/events")).toBe("/admin/events");
    expect(getSafeAdminRedirect("  /admin/judges  ")).toBe("/admin/judges");
  });
  it("blocks protocol-relative open redirects", () => {
    expect(getSafeAdminRedirect("//evil.com")).toBe("/admin");
    expect(getSafeAdminRedirect("https://evil.com")).toBe("/admin");
    expect(getSafeAdminRedirect("javascript:alert(1)")).toBe("/admin");
  });
  it("blocks backslash open-redirect tricks (RW-05)", () => {
    // "/\\evil.com" is the JS source for the single-backslash path /\evil.com,
    // which browsers normalize to //evil.com (an external origin).
    expect(getSafeAdminRedirect("/\\evil.com")).toBe("/admin");
    expect(getSafeAdminRedirect("/\\/evil.com")).toBe("/admin");
  });
  it("blocks the login page itself to avoid redirect loops", () => {
    expect(getSafeAdminRedirect("/admin/login")).toBe("/admin");
    expect(getSafeAdminRedirect("/admin/login/x")).toBe("/admin");
  });
  it("honours a custom fallback path", () => {
    expect(getSafeAdminRedirect(null, "/admin/dashboard")).toBe("/admin/dashboard");
  });
});

describe("isAdminSession", () => {
  it("is true only with both a userId and the ADMIN role", () => {
    expect(isAdminSession("ADMIN", "u1")).toBe(true);
    expect(isAdminSession("ADMIN", null)).toBe(false);
    expect(isAdminSession("ADMIN", undefined)).toBe(false);
    expect(isAdminSession("USER", "u1")).toBe(false);
    expect(isAdminSession(undefined, "u1")).toBe(false);
  });
});
