// Mixed read+write driver. Spectators poll the leaderboard while officials write
// (laps + cards) through the gated /api/loadtest endpoint. Measures whether — and
// how fast — official writes succeed while the public board saturates the DB.
//
// Needs the endpoint live with LOADTEST_ENABLED=1. Cookies + ids come from the
// GET prep handler (server-minted), so no DB access / secret needed locally.
//
// Usage:
//   BASE_URL=https://racewalk-tournament.vercel.app EVENT_ID=evt-live \
//   SPECTATORS=50 LAP_RPS=3 CARD_RPS=0.5 DUR=30 node loadtest/run-write.mjs
const BASE = process.env.BASE_URL;
const EVENT = process.env.EVENT_ID || "evt-live";
const TOKEN = process.env.LOADTEST_TOKEN || "";
const SPECTATORS = Number(process.env.SPECTATORS || 50);
const LAP_RPS = Number(process.env.LAP_RPS || 3);
const CARD_RPS = Number(process.env.CARD_RPS || 0.5);
const DUR = Number(process.env.DUR || 30) * 1000;
const POLL = Number(process.env.POLL_MS || 500);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (s, p) => (s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : 0);
const tokHdr = TOKEN ? { "x-loadtest-token": TOKEN } : {};

// 1) prep — ids + server-minted official cookies
const prepRes = await fetch(`${BASE}/api/loadtest?event=${EVENT}`, { headers: tokHdr });
const prep = await prepRes.json().catch(() => ({}));
if (!prep.ok) {
  console.error(`prep failed: HTTP ${prepRes.status} ${JSON.stringify(prep)}`);
  process.exit(1);
}
const { roundId, athletes, cookies } = prep;
console.log(`prep ok: round=${roundId} athletes=${athletes.length} cookies=[${Object.keys(cookies).join(",")}]`);

const url = `${BASE}/events/${EVENT}`;
const readLat = [];
const r0 = { total: 0, ok: 0, bad: 0, err: 0 };
const wLat = [];
const w0 = { total: 0, ok: 0, benign: 0, fail: 0, err: 0, codes: {} };
const start = Date.now();
const endAt = start + DUR;

async function reader() {
  while (Date.now() < endAt) {
    const t0 = performance.now();
    try {
      const r = await fetch(url, { headers: { RSC: "1" } });
      await r.arrayBuffer();
      readLat.push(performance.now() - t0);
      r0.total++;
      if (r.status === 200) r0.ok++;
      else r0.bad++;
    } catch {
      r0.total++;
      r0.err++;
    }
    await sleep(Math.max(0, POLL - (performance.now() - t0)));
  }
}

let lapCounter = 0;
async function doWrite(kind) {
  const a = athletes[Math.floor(Math.random() * athletes.length)];
  let body, cookie;
  if (kind === "lap") {
    body = { action: "lap", athleteId: a.athleteId, lapNumber: 100000 + lapCounter++, timeMs: Date.now() % 86400000 };
    cookie = cookies.EVENT_LOGGER;
  } else {
    body = { action: "yellow", athleteId: a.athleteId, symbol: Math.random() < 0.5 ? "LIFTED_FOOT" : "BENT_KNEE" };
    cookie = cookies.JUDGE;
  }
  const t0 = performance.now();
  try {
    const r = await fetch(`${BASE}/api/loadtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, ...tokHdr },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    wLat.push(performance.now() - t0);
    w0.total++;
    if (r.status !== 200) {
      w0.fail++;
      w0.codes["http" + r.status] = (w0.codes["http" + r.status] || 0) + 1;
    } else if (j.ok) {
      w0.ok++;
    } else if (/แล้ว|already/.test(j.error || "")) {
      w0.benign++; // already recorded/issued — expected, not a real failure
    } else {
      w0.fail++;
      w0.codes[j.error || "notok"] = (w0.codes[j.error || "notok"] || 0) + 1;
    }
  } catch {
    w0.total++;
    w0.err++;
  }
}

async function rateGen(kind, rps) {
  if (rps <= 0) return;
  const interval = 1000 / rps;
  while (Date.now() < endAt) {
    doWrite(kind); // tracked, not awaited, to hold the target rate
    await sleep(interval);
  }
}

await Promise.all([
  ...Array.from({ length: SPECTATORS }, () => reader()),
  rateGen("lap", LAP_RPS),
  rateGen("card", CARD_RPS),
]);
await sleep(2500); // let in-flight writes settle

readLat.sort((a, b) => a - b);
wLat.sort((a, b) => a - b);
const summary = {
  spectators: SPECTATORS,
  lap_rps: LAP_RPS,
  card_rps: CARD_RPS,
  reads: { ...r0, p50: Math.round(pct(readLat, 50)), p95: Math.round(pct(readLat, 95)), p99: Math.round(pct(readLat, 99)) },
  writes: { ...w0, p50: Math.round(pct(wLat, 50)), p95: Math.round(pct(wLat, 95)), p99: Math.round(pct(wLat, 99)) },
};
console.log("\n=== MIXED LOAD: spectators reading + officials writing ===");
console.log(`READS : n=${r0.total} ok=${r0.ok} bad=${r0.bad} err=${r0.err}  p50=${summary.reads.p50} p95=${summary.reads.p95} p99=${summary.reads.p99}ms`);
console.log(`WRITES: n=${w0.total} ok=${w0.ok} benign=${w0.benign} fail=${w0.fail} err=${w0.err}  p50=${summary.writes.p50} p95=${summary.writes.p95} p99=${summary.writes.p99}ms`);
console.log("write failure codes:", JSON.stringify(w0.codes));
console.log("JSON " + JSON.stringify(summary));
