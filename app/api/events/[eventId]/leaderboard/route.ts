/**
 * Public leaderboard JSON for the live scoreboard's client-side poll.
 *
 * The board used to re-render the whole server component every poll (full RSC
 * render = real Active CPU per viewer). It now polls this tiny endpoint instead,
 * and the `Cache-Control` below lets Vercel's CDN serve repeat polls WITHOUT
 * invoking the function — so the crowd is absorbed at the edge (0 Active CPU,
 * counted as edge requests) and the function runs at most ~once per `s-maxage`
 * window for the whole event. The data itself is also behind the Next data cache
 * (getCachedLeaderboard), purged on every card/lap/finish write via revalidateTag.
 *
 * No cookies/session are read here — the leaderboard is identical for everyone,
 * which is what makes the response cacheable.
 */
import { NextResponse } from "next/server";
import { buildLeaderboard, getCachedLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic"; // we set Cache-Control ourselves
export const runtime = "nodejs"; // Prisma + mariadb adapter need Node, not Edge

type Params = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { eventId } = await params;
  const round = new URL(request.url).searchParams.get("round") ?? undefined;

  const event = await getCachedLeaderboard(eventId)();
  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(buildLeaderboard(event, round), {
    headers: {
      // Repeat polls within 4s are served from the CDN; `stale-while-revalidate`
      // keeps the board instant while the cache refreshes in the background.
      "Cache-Control": "public, s-maxage=4, stale-while-revalidate=10",
    },
  });
}
