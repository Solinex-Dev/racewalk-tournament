// Pure-Node read load driver (no Docker/k6 needed). Simulates `vus` concurrent
// viewers each polling the public leaderboard every POLL_MS, stepping through a
// list of VU levels and reporting latency percentiles + throughput per level.
//
// Usage:
//   BASE_URL=https://racewalk-tournament.vercel.app EVENT_ID=evt-live \
//   LEVELS=25,50,100,150 DUR=30 node loadtest/run-read.mjs
const BASE = process.env.BASE_URL;
const EVENT = process.env.EVENT_ID || "evt-live";
const LEVELS = (process.env.LEVELS || "25,50,100,150").split(",").map(Number);
const DUR = Number(process.env.DUR || 30) * 1000;
const POLL = Number(process.env.POLL_MS || 500);
const PATHQ = process.env.PATH_SUFFIX || `/events/${EVENT}`;
const url = `${BASE}${PATHQ}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (sorted, p) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0;

async function vu(endAt, lat, stats) {
  while (Date.now() < endAt) {
    const t0 = performance.now();
    try {
      const res = await fetch(url, { headers: { RSC: "1" } });
      await res.arrayBuffer(); // drain body so the socket is reusable
      const ms = performance.now() - t0;
      lat.push(ms);
      stats.total++;
      if (res.status === 200) stats.ok++;
      else {
        stats.bad++;
        stats.codes[res.status] = (stats.codes[res.status] || 0) + 1;
      }
    } catch (e) {
      stats.total++;
      stats.err++;
      const k = e.cause?.code || e.name || "err";
      stats.codes[k] = (stats.codes[k] || 0) + 1;
    }
    const elapsed = performance.now() - t0;
    await sleep(Math.max(0, POLL - elapsed));
  }
}

async function runLevel(vus) {
  const lat = [];
  const stats = { total: 0, ok: 0, bad: 0, err: 0, codes: {} };
  const start = Date.now();
  const endAt = start + DUR;
  await Promise.all(Array.from({ length: vus }, () => vu(endAt, lat, stats)));
  const wall = (Date.now() - start) / 1000;
  lat.sort((a, b) => a - b);
  return {
    vus,
    requests: stats.total,
    rps: +(stats.total / wall).toFixed(1),
    ok: stats.ok,
    errors: stats.bad + stats.err,
    errPct: +(((stats.bad + stats.err) / Math.max(1, stats.total)) * 100).toFixed(2),
    p50: Math.round(pct(lat, 50)),
    p90: Math.round(pct(lat, 90)),
    p95: Math.round(pct(lat, 95)),
    p99: Math.round(pct(lat, 99)),
    max: Math.round(lat[lat.length - 1] || 0),
    codes: stats.codes,
  };
}

console.log(`target: ${url}  poll=${POLL}ms  dur=${DUR / 1000}s/level  levels=${LEVELS.join(",")}`);
const rows = [];
for (const vus of LEVELS) {
  process.stdout.write(`running ${vus} VUs...\n`);
  const row = await runLevel(vus);
  rows.push(row);
  console.log("  " + JSON.stringify(row));
  await sleep(4000); // cool-down between levels
}
console.log("\n=== SUMMARY (latency ms) ===");
console.log("VUs\treq\trps\terr%\tp50\tp95\tp99\tmax");
for (const r of rows) {
  console.log(`${r.vus}\t${r.requests}\t${r.rps}\t${r.errPct}\t${r.p50}\t${r.p95}\t${r.p99}\t${r.max}`);
}
console.log("\nJSON " + JSON.stringify(rows));
