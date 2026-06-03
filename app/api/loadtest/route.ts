import { NextResponse, type NextRequest } from "next/server";
import { recordLapTime, recordFinishTime } from "@/app/actions/timing";
import {
  issueYellowCard,
  issueRedCard,
  confirmRedCard,
  type CardSymbol,
} from "@/app/actions/cards";
import { prisma } from "@/lib/prisma";
import {
  signOfficialSession,
  OFFICIAL_COOKIE_NAME,
  type OfficialPosition,
} from "@/lib/official-jwt";

/**
 * ⚠️ TEST-ONLY load-testing endpoint. INERT by default — returns 404 unless the
 * environment variable LOADTEST_ENABLED=1 is set. Turn it on ONLY on a throwaway
 * staging box pointed at a NON-PRODUCTION database, and delete this folder
 * (app/api/loadtest) once the load test is finished.
 *
 * It calls the real race-day Server Actions, which still enforce the official
 * session cookie (requireOfficialSession). Every request must therefore carry a
 * valid `rw_official_session` cookie minted by loadtest/mint-cookies.mjs whose
 * position matches the action (EVENT_LOGGER → lap/finish, JUDGE → yellow/red,
 * HEAD_JUDGE → confirm). An optional shared secret (LOADTEST_TOKEN) adds a second
 * gate via the x-loadtest-token header.
 */
export const dynamic = "force-dynamic";

type Body = {
  action: "lap" | "finish" | "yellow" | "red" | "confirm";
  athleteId?: string;
  lapNumber?: number;
  timeMs?: number;
  symbol?: CardSymbol;
  cardId?: string;
};

function gateResponse(req: NextRequest): NextResponse | null {
  if (process.env.LOADTEST_ENABLED !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }
  const token = process.env.LOADTEST_TOKEN;
  if (token && req.headers.get("x-loadtest-token") !== token) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return null;
}

/**
 * GET ?event=<id> — prep helper. Returns the ongoing round's ids + athletes and
 * official session cookies minted server-side with the real NEXTAUTH_SECRET, so
 * the load driver needs no DB access and no copy of the secret. Same gate as POST.
 */
export async function GET(req: NextRequest) {
  const gate = gateResponse(req);
  if (gate) return gate;

  const eventId = req.nextUrl.searchParams.get("event");
  if (!eventId) {
    return NextResponse.json({ ok: false, error: "missing ?event=" }, { status: 400 });
  }

  const round = await prisma.round.findFirst({
    where: { eventId, status: "ONGOING", deletedAt: null },
    include: {
      roundAthletes: { where: { deletedAt: null }, select: { athleteId: true, bib: true } },
    },
  });
  if (!round) {
    return NextResponse.json(
      { ok: false, error: `no ONGOING round for event ${eventId}` },
      { status: 404 },
    );
  }

  const officials = await prisma.roundOfficial.findMany({
    where: { roundId: round.id, deletedAt: null },
    select: { id: true, judgeId: true, position: true, zone: true },
  });
  const fallbackJudge = await prisma.judge.findFirst({ select: { id: true } });
  const fallbackJudgeId = officials[0]?.judgeId ?? fallbackJudge?.id ?? "loadtest-judge";

  const positions: OfficialPosition[] = ["JUDGE", "HEAD_JUDGE", "EVENT_LOGGER"];
  const cookies: Record<string, string> = {};
  for (const position of positions) {
    const match = officials.find((o) => o.position === position);
    const jwt = await signOfficialSession({
      officialId: match?.id ?? `loadtest-${position}`,
      judgeId: match?.judgeId ?? fallbackJudgeId,
      judgeName: `LoadTest ${position}`,
      roundId: round.id,
      eventId,
      position,
      zone: match?.zone ?? null,
    });
    cookies[position] = `${OFFICIAL_COOKIE_NAME}=${jwt}`;
  }

  return NextResponse.json({
    ok: true,
    eventId,
    roundId: round.id,
    athletes: round.roundAthletes,
    cookies,
  });
}

export async function POST(req: NextRequest) {
  const gate = gateResponse(req);
  if (gate) return gate;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "lap":
        await recordLapTime(body.athleteId ?? "", body.lapNumber ?? 1, body.timeMs ?? 0);
        break;
      case "finish":
        await recordFinishTime(body.athleteId ?? "", body.timeMs ?? 0);
        break;
      case "yellow":
        await issueYellowCard(body.athleteId ?? "", body.symbol ?? "LIFTED_FOOT");
        break;
      case "red":
        await issueRedCard(body.athleteId ?? "", body.symbol ?? "BENT_KNEE");
        break;
      case "confirm":
        await confirmRedCard(body.cardId ?? "");
        break;
      default:
        return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Expected domain errors (already recorded, athlete finished, not in round…)
    // return 200 + ok:false so k6 measures real throughput without counting these
    // as HTTP failures.
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 200 },
    );
  }
}
