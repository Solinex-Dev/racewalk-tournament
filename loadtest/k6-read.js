// Reads-only capacity probe for the public leaderboard (no auth needed).
// Driven entirely by env vars so it can be piped into `k6 run -`.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL;
const EVENT = __ENV.EVENT_ID || "evt-live";
const POLL = Number(__ENV.POLL_MS || 500) / 1000;
const url = `${BASE}/events/${EVENT}`;

export const options = {
  scenarios: {
    read: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 50),
      duration: __ENV.DURATION || "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<3000"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export default function () {
  const res = http.get(url, { headers: { RSC: "1" } });
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(POLL);
}
