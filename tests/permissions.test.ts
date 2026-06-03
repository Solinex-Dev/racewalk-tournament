import { describe, it, expect } from "vitest";
import {
  RESOURCES,
  ACTIONS,
  resourceAllows,
  emptyPermissions,
  fullPermissions,
  normalizePermissions,
  hasPermission,
  canAccessResource,
} from "@/lib/permissions";

describe("resourceAllows", () => {
  it("reflects which actions are meaningful per resource", () => {
    expect(resourceAllows("events", "delete")).toBe(true);
    expect(resourceAllows("reports", "view")).toBe(true);
    expect(resourceAllows("reports", "delete")).toBe(false); // reports = view only
    expect(resourceAllows("moderator", "view")).toBe(true);
    expect(resourceAllows("moderator", "edit")).toBe(false); // moderator = view only
  });
});

describe("emptyPermissions / fullPermissions", () => {
  it("empty has every flag false", () => {
    const p = emptyPermissions();
    for (const r of RESOURCES) for (const a of ACTIONS) expect(p[r][a]).toBe(false);
  });
  it("full grants exactly the allowed actions per resource", () => {
    const p = fullPermissions();
    for (const r of RESOURCES) for (const a of ACTIONS) {
      expect(p[r][a]).toBe(resourceAllows(r, a));
    }
  });
});

describe("normalizePermissions", () => {
  it("coerces partial JSON and clamps to allowed actions", () => {
    const p = normalizePermissions({
      events: { view: true, delete: true },
      reports: { delete: true },
    });
    expect(p.events.view).toBe(true);
    expect(p.events.delete).toBe(true);
    expect(p.reports.view).toBe(false); // not granted
    expect(p.reports.delete).toBe(false); // reports has no delete → clamped off
  });
  it("returns an all-false matrix for null / non-object input", () => {
    expect(normalizePermissions(null).events.view).toBe(false);
    expect(normalizePermissions("nope" as unknown).admins.create).toBe(false);
  });
});

describe("hasPermission", () => {
  it("lets a Root admin bypass every check", () => {
    expect(hasPermission({ isRoot: true }, "admins", "delete")).toBe(true);
  });
  it("denies a null / undefined user", () => {
    expect(hasPermission(null, "events", "view")).toBe(false);
    expect(hasPermission(undefined, "events", "view")).toBe(false);
  });
  it("reads the matrix for a non-root admin", () => {
    const u = { isRoot: false, permissions: { events: { view: true } } };
    expect(hasPermission(u, "events", "view")).toBe(true);
    expect(hasPermission(u, "events", "delete")).toBe(false);
  });
});

describe("canAccessResource", () => {
  it("is true when any action on the resource is granted", () => {
    expect(
      canAccessResource({ isRoot: false, permissions: { judges: { edit: true } } }, "judges"),
    ).toBe(true);
    expect(canAccessResource({ isRoot: false, permissions: {} }, "judges")).toBe(false);
    expect(canAccessResource({ isRoot: true }, "judges")).toBe(true);
    expect(canAccessResource(null, "judges")).toBe(false);
  });
});
