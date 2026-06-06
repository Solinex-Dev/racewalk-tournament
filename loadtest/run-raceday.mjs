// Realistic race-day load: spectators poll the (cached) public board while the
// FULL official panel works — 8 judges + 1 head judge + 1 event logger, each on
// their own session polling their OWN workspace page (UNCACHED) every 500ms and
// writing at realistic rates. Measures spectator-read, official-read and
// official-write separately, so we can see whether officials can actually work
// while a crowd watches.
//
// Usage:
//   BASE_URL=https://racewalk-tournament.vercel.app EVENT_ID=evt-live \
//   SPECTATORS=50 JUDGES=8 DUR=40 node loadtest/run-raceday.mjs
const BASE = process.env.BASE_URL;
const EVENT = process.env.EVENT_ID || "evt-live";
const TOKEN = process.env.LOADTEST_TOKEN || "";
const SPECTATORS = Number(process.env.SPECTATORS || 50);
const JUDGES = Number(process.env.JUDGES || 8);
const DUR = Number(process.env.DUR || 40) * 1000;
const POLL = Number(process.env.POLL_MS || 500);
const LAP_EVERY = Number(process.env.LAP_MS || 3000); // logger records a lap every 3s
const CARD_EVERY = Number(process.env.CARD_MS || 12000); // each judge issues a card every 12s

const tokHdr = TOKEN ? { "x-loadtest-token": TOKEN } : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (s, p) => (s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : 0);
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

const prep = await (await fetch(`${BASE}/api/loadtest?event=${EVENT}&judges=${JUDGES}`, { headers: tokHdr })).json();
if (!prep.ok) {
  console.error("prep failed:", JSON.stringify(prep));
  process.exit(1);
}
const { roundId, athletes, cookies, judges } = prep;
console.log(`prep ok: round=${roundId} athletes=${athletes.length} panel=${judges.length}judge+head+logger`);

const lbUrl = `${BASE}/events/${EVENT}`;
const url = {
  judge: `${BASE}/judge/events/${EVENT}`,
  head: `${BASE}/head-judge/events/${EVENT}`,
  logger: `${BASE}/event-logger/events/${EVENT}`,
};

const spec = { lat: [], ok: 0, bad: 0, err: 0 };
const oread = { lat: [], ok: 0, bad: 0, err: 0 };
const owrite = { lat: [], ok: 0, benign: 0, fail: 0, err: 0, codes: {} };
const start = Date.now();
const endAt = start + DUR;

async function poll(u, cookie, bucket) {
  while (Date.now() < endAt) {
    const t0 = performance.now();
    try {
      const r = await fetch(u, { headers: cookie ? { RSC: "1", Cookie: cookie } : { RSC: "1" } });
      await r.arrayBuffer();
      bucket.lat.push(performance.now() - t0);
      if (r.status === 200) bucket.ok++;
      else bucket.bad++;
    } catch {
      bucket.err++;
    }
    await sleep(Math.max(0, POLL - (performance.now() - t0)));
  }
}

let lapN = 0;
async function writer(makeBody, cookie, everyMs) {
  await sleep(Math.random() * everyMs); // desync writers
  while (Date.now() < endAt) {
    const t0 = performance.now();
    try {
      const r = await fetch(`${BASE}/api/loadtest`, {
        method: "POST",
        headers: { ...tokHdr, "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify(makeBody()),
      });
      const j = await r.json().catch(() => ({}));
      owrite.lat.push(performance.now() - t0);
      if (r.status !== 200) {
        owrite.fail++;
        owrite.codes["http" + r.status] = (owrite.codes["http" + r.status] || 0) + 1;
      } else if (j.ok) {
        owrite.ok++;
      } else if (/แล้ว|already/.test(j.error || "")) {
        owrite.benign++;
      } else {
        owrite.fail++;
        owrite.codes[j.error || "notok"] = (owrite.codes[j.error || "notok"] || 0) + 1;
      }
    } catch {
      owrite.err++;
    }
    await sleep(everyMs);
  }
}

const tasks = [];
for (let i = 0; i < SPECTATORS; i++) tasks.push(poll(lbUrl, null, spec));
for (let i = 0; i < judges.length; i++) {
  tasks.push(poll(url.judge, judges[i], oread));
  tasks.push(
    writer(
      () => ({
        action: Math.random() < 0.7 ? "yellow" : "red",
        athleteId: rnd(athletes).athleteId,
        symbol: Math.random() < 0.5 ? "LIFTED_FOOT" : "BENT_KNEE",
      }),
      judges[i],
      CARD_EVERY,
    ),
  );
}
tasks.push(poll(url.head, cookies.HEAD_JUDGE, oread));
tasks.push(poll(url.logger, cookies.EVENT_LOGGER, oread));
tasks.push(
  writer(
    () => ({ action: "lap", athleteId: rnd(athletes).athleteId, lapNumber: 200000 + lapN++, timeMs: Date.now() % 86400000 }),
    cookies.EVENT_LOGGER,
    LAP_EVERY,
  ),
);

await Promise.all(tasks);
await sleep(2500);

[spec.lat, oread.lat, owrite.lat].forEach((a) => a.sort((x, y) => x - y));
const fmt = (b) => `p50=${Math.round(pct(b.lat, 50))} p95=${Math.round(pct(b.lat, 95))} p99=${Math.round(pct(b.lat, 99))}ms`;
const n = (b) => b.ok + (b.bad || 0) + (b.benign || 0) + (b.fail || 0) + b.err;
console.log("\n=== RACE-DAY LOAD: crowd watching + full official panel working ===");
console.log(`spectators=${SPECTATORS}  panel=${judges.length} judges + head + logger  dur=${DUR / 1000}s`);
console.log(`SPECTATOR reads (cached)   : n=${n(spec)} ok=${spec.ok} bad=${spec.bad} err=${spec.err}  ${fmt(spec)}`);
console.log(`OFFICIAL reads (UNcached)  : n=${n(oread)} ok=${oread.ok} bad=${oread.bad} err=${oread.err}  ${fmt(oread)}`);
console.log(`OFFICIAL writes            : n=${n(owrite)} ok=${owrite.ok} benign=${owrite.benign} fail=${owrite.fail} err=${owrite.err}  ${fmt(owrite)}`);
console.log("write fail codes:", JSON.stringify(owrite.codes));
console.log("JSON " + JSON.stringify({ spectators: SPECTATORS, panel: judges.length, spec, oread, owrite }));
