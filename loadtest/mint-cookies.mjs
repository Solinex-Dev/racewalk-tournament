// Mint `rw_official_session` cookies for k6 load testing — replicates
// lib/official-jwt.ts (HS256 over NEXTAUTH_SECRET) so the load test can drive the
// judge / head-judge / event-logger workspaces (and the writes endpoint) without
// going through the secret-code join flow.
//
// Usage (use the STAGING secret, not your local one):
//   NEXTAUTH_SECRET="<staging secret>" node loadtest/mint-cookies.mjs
//
// Reads  loadtest/config.json  and writes  loadtest/cookies.json.
import { readFileSync, writeFileSync } from "node:fs";
import { SignJWT } from "jose";

const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  console.error("✗ Set NEXTAUTH_SECRET to the STAGING server's secret first.");
  process.exit(1);
}
const key = new TextEncoder().encode(secret);

const COOKIE_NAME = "rw_official_session";
const TTL_SECONDS = 60 * 60 * 12; // matches OFFICIAL_COOKIE_TTL_SECONDS

const cfgUrl = new URL("./config.json", import.meta.url);
const cfg = JSON.parse(readFileSync(cfgUrl, "utf8"));

async function mint(o) {
  return new SignJWT({
    officialId: o.officialId,
    judgeId: o.judgeId,
    judgeName: o.judgeName,
    roundId: cfg.roundId,
    eventId: cfg.eventId,
    position: o.position,
    zone: o.zone ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(key);
}

const out = {};
for (const role of ["judge", "headJudge", "eventLogger"]) {
  const o = cfg.officials?.[role];
  if (!o) continue;
  out[role] = `${COOKIE_NAME}=${await mint(o)}`;
}

if (Object.keys(out).length === 0) {
  console.error("✗ No officials in config.json — fill in config.officials.{judge,headJudge,eventLogger}.");
  process.exit(1);
}

writeFileSync(new URL("./cookies.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("✓ Wrote loadtest/cookies.json for roles:", Object.keys(out).join(", "));
