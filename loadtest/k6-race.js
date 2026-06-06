// k6 load test for a live racewalk event: mixed read polling (public leaderboard
// + official workspaces at 500 ms) and a trickle of writes (laps + cards).
//
// Run:  k6 run -e BASE_URL=https://staging.example.com loadtest/k6-race.js
// Docker (no install):
//   docker run --rm -i -e BASE_URL=https://staging.example.com \
//     -v "$PWD/loadtest:/loadtest" grafana/k6 run /loadtest/k6-race.js
//
// Tunables (all via -e KEY=value):
//   SPECTATORS (90)  OFFICIALS (6)  LAP_RATE (2/s)  CARD_RATE (0.3/s)
//   DURATION (2m)    POLL_MS (500)  WRITES (1|0)    LOADTEST_TOKEN ("")
import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";

// Files are read once at init. When using Docker, mount the loadtest/ dir.
const cfg = JSON.parse(open("./config.json"));
let cookies = {};
try {
  cookies = JSON.parse(open("./cookies.json"));
} catch (_) {
  cookies = {}; // no cookies → public-reads-only run
}

const BASE = __ENV.BASE_URL || cfg.baseUrl;
const TOKEN = __ENV.LOADTEST_TOKEN || "";
const HAS_AUTH = Object.keys(cookies).length > 0;
const WRITES = (__ENV.WRITES || "1") !== "0" && HAS_AUTH;

const SPECTATORS = Number(__ENV.SPECTATORS || 90);
const OFFICIALS = Number(__ENV.OFFICIALS || 6);
const LAP_RATE = Number(__ENV.LAP_RATE || 2);
const CARD_RATE = Number(__ENV.CARD_RATE || 0.3);
const DURATION = __ENV.DURATION || "2m";
const POLL = Number(__ENV.POLL_MS || 500) / 1000;

const leaderboardUrl = `${BASE}/events/${cfg.eventId}`;
const workspaceUrls = {
  judge: `${BASE}/judge/events/${cfg.eventId}`,
  headJudge: `${BASE}/head-judge/events/${cfg.eventId}`,
  eventLogger: `${BASE}/event-logger/events/${cfg.eventId}`,
};

function rscGet(url, cookie, kind) {
  const headers = { RSC: "1" }; // mimic router.refresh()'s flight request
  if (cookie) headers["Cookie"] = cookie;
  const res = http.get(url, { headers, tags: { kind } });
  check(res, { [`${kind} 200`]: (r) => r.status === 200 });
  return res;
}

function postAction(cookie, body, kind) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  if (TOKEN) headers["x-loadtest-token"] = TOKEN;
  const res = http.post(`${BASE}/api/loadtest`, JSON.stringify(body), { headers, tags: { kind } });
  check(res, { [`${kind} 200`]: (r) => r.status === 200 });
  return res;
}

function randomAthlete() {
  return cfg.athletes[Math.floor(Math.random() * cfg.athletes.length)];
}

// --- VU bodies -------------------------------------------------------------
export function spectator() {
  rscGet(leaderboardUrl, null, "read_leaderboard");
  sleep(POLL);
}

export function official() {
  const roles = ["judge", "judge", "headJudge", "eventLogger"]; // weight to judges
  const role = roles[exec.vu.idInTest % roles.length];
  rscGet(workspaceUrls[role], cookies[role], `read_${role}`);
  sleep(POLL);
}

export function writeLap() {
  const a = randomAthlete();
  // Unique-ish lap number so most calls actually INSERT (exercise the write path).
  const lapNumber = 1 + Math.floor(Math.random() * 1_000_000_000);
  postAction(
    cookies.eventLogger,
    { action: "lap", athleteId: a.athleteId, lapNumber, timeMs: Date.now() % 86_400_000 },
    "write_lap",
  );
}

export function writeCard() {
  const a = randomAthlete();
  const symbol = Math.random() < 0.5 ? "LIFTED_FOOT" : "BENT_KNEE";
  postAction(cookies.judge, { action: "yellow", athleteId: a.athleteId, symbol }, "write_card");
}

// --- Scenarios -------------------------------------------------------------
const scenarios = {
  spectators: { executor: "constant-vus", vus: SPECTATORS, duration: DURATION, exec: "spectator" },
};
if (HAS_AUTH) {
  scenarios.officials = { executor: "constant-vus", vus: OFFICIALS, duration: DURATION, exec: "official" };
}
if (WRITES) {
  scenarios.lap_writes = {
    executor: "constant-arrival-rate",
    rate: LAP_RATE,
    timeUnit: "1s",
    duration: DURATION,
    preAllocatedVUs: Math.max(5, Math.ceil(LAP_RATE * 3)),
    exec: "writeLap",
  };
  scenarios.card_writes = {
    executor: "constant-arrival-rate",
    rate: CARD_RATE,
    timeUnit: "1s",
    duration: DURATION,
    preAllocatedVUs: 3,
    exec: "writeCard",
  };
}

export const options = {
  scenarios,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{kind:read_leaderboard}": ["p(95)<800"],
    "http_req_duration{kind:write_lap}": ["p(95)<1000"],
  },
};
