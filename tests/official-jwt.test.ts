import { describe, it, expect, beforeAll } from "vitest";
import {
  signOfficialSession,
  verifyOfficialSession,
  defaultRouteForPosition,
  type OfficialSessionPayload,
} from "@/lib/official-jwt";

beforeAll(() => {
  // getKey() reads NEXTAUTH_SECRET at call time, so setting it here is enough.
  process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-characters-long-0123456789";
});

const payload: OfficialSessionPayload = {
  officialId: "o1",
  judgeId: "j1",
  judgeName: "สมชาย",
  roundId: "r1",
  eventId: "e1",
  position: "JUDGE",
  zone: "Zone A",
};

describe("official session JWT", () => {
  it("signs and verifies a valid payload (round-trip)", async () => {
    const token = await signOfficialSession(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
    const out = await verifyOfficialSession(token);
    expect(out).toMatchObject(payload);
  });

  it("returns null for garbage / tampered tokens", async () => {
    expect(await verifyOfficialSession("not.a.jwt")).toBeNull();
    expect(await verifyOfficialSession("")).toBeNull();
    const token = await signOfficialSession(payload);
    expect(await verifyOfficialSession(token + "tampered")).toBeNull();
  });

  it("defaults a missing zone to null", async () => {
    const token = await signOfficialSession({ ...payload, zone: null });
    const out = await verifyOfficialSession(token);
    expect(out?.zone).toBeNull();
  });
});

describe("defaultRouteForPosition", () => {
  it("maps each position to its workspace route", () => {
    expect(defaultRouteForPosition("HEAD_JUDGE", "e1")).toBe("/head-judge/events/e1");
    expect(defaultRouteForPosition("EVENT_LOGGER", "e1")).toBe("/event-logger/events/e1");
    expect(defaultRouteForPosition("JUDGE", "e1")).toBe("/judge/events/e1");
  });
});
