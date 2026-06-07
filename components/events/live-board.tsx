"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeaderboardRows } from "@/components/events/leaderboard-rows";
import { LiveTimer } from "@/components/common/live-timer";
import { metersFromKm } from "@/lib/distance";
import type { LeaderboardDTO } from "@/lib/leaderboard";

// The board polls the CDN-cached JSON endpoint instead of re-rendering the whole
// server page. Most polls are served from Vercel's edge (0 Active CPU). 5s keeps
// the board fresh enough for a walking race while staying cheap.
const POLL_INTERVAL_MS = 5000;

type OfficialBack = { href: string; label: string } | null;

export function LiveBoard({
  initial,
  eventId,
  roundParam,
  officialBack,
}: Readonly<{
  initial: LeaderboardDTO;
  eventId: string;
  roundParam: string | null;
  officialBack: OfficialBack;
}>) {
  const [data, setData] = useState(initial);

  // When the viewer switches rounds (?round=…), the server re-renders with a new
  // `initial` for that round — adopt it immediately instead of waiting for the
  // next poll. (React's recommended "adjust state during render" pattern.)
  const [seenRound, setSeenRound] = useState(roundParam);
  if (seenRound !== roundParam) {
    setSeenRound(roundParam);
    setData(initial);
  }

  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/events/${eventId}/leaderboard${
      roundParam ? `?round=${encodeURIComponent(roundParam)}` : ""
    }`;
    const tick = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return; // keep last good state
        setData((await res.json()) as LeaderboardDTO);
      } catch {
        // network blip / abort — keep last good state, don't blank the board
      }
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [eventId, roundParam]);

  const { event, currentRound, isRaceLive, isCurrentRoundFinished, lapCount } = data;

  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-1 px-4 py-6 lg:py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full">
            {officialBack && (
              <Link
                href={officialBack.href}
                className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-950/50 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50"
              >
                <span aria-hidden>←</span> กลับเข้าหน้า{officialBack.label}
              </Link>
            )}
            <div className="flex flex-col md:flex-row gap-3 items-start justify-between">
              <div>
                <div className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-400 flex gap-2 items-center">
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
                    {event.name}
                  </div>
                </div>
                <div className="flex gap-1.5 align-center flex-wrap">
                  <p className="text-sm text-slate-300">
                    {metersFromKm(currentRound?.distanceKm || event.distanceKm)} ม. •{" "}
                    {event.location} •{" "}
                    {currentRound?.name ?? ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-0 items-end ms-auto">
                {isRaceLive && (
                  <div className="flex items-center gap-2">
                    <div className="bg-red-400 min-h-2 min-w-2 rounded-full block animate-pulse">
                      {" "}
                    </div>
                    <div className="text-red-400 font-semibold mb-0.5">LIVE</div>
                  </div>
                )}
                {currentRound?.startedAt && (
                  <h3 className="text-slate-400 text-2xl md:text-3xl font-semibold">
                    <LiveTimer
                      startedAt={currentRound.startedAt}
                      endedAt={currentRound.endedAt ?? null}
                      className={`font-mono font-semibold ${isCurrentRoundFinished ? "text-slate-300" : "text-emerald-400"}`}
                    />
                  </h3>
                )}
                {(lapCount > 0 || currentRound) && (
                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    {lapCount > 0 && (
                      <p>
                        Lap{" "}
                        <span className="font-semibold text-slate-100">
                          {currentRound?.currentLap ?? 0}
                        </span>{" "}
                        / {lapCount}
                      </p>
                    )}
                    |
                    {currentRound && (
                      <p>
                        เหลือในสนาม{" "}
                        <span className="font-bold text-emerald-400">
                          {data.remainingOnField}
                        </span> / {data.rows.length}{" "}
                        คน
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex items-end gap-4 ">
            <div className="flex w-full gap-2 justify-between text-right text-lg">
              {!currentRound?.startedAt && data.elapsedFallback && (
                <p className="text-slate-400">
                  เวลาแข่งขัน{" "}
                  <span
                    className={`font-mono font-semibold ${isCurrentRoundFinished ? "text-slate-300" : "text-emerald-400"}`}
                  >
                    {data.elapsedFallback}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="min-h-0 flex-1 overflow-auto min-[992px]:overflow-hidden">
              <LeaderboardRows
                athletes={data.rows}
                lapCount={lapCount}
                showRank={isCurrentRoundFinished}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
