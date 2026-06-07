import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveBoard } from "@/components/events/live-board";
import { buildLeaderboard, getCachedLeaderboard } from "@/lib/leaderboard";
import { getOfficialSession, defaultRouteForPosition } from "@/lib/official-session";

// Server shell: rendered once per page load. It reads the viewer's official
// cookie (for the "back to workspace" button), which makes it dynamic. Live
// updates no longer come from re-rendering this page on a 500ms timer — they
// come from <LiveBoard> polling the CDN-cached JSON endpoint, so there is no
// per-poll server render burning Active CPU.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "กระดานคะแนนสดกิจกรรม – การแข่งขันเดินทน",
  description:
    "หน้าดูผลการแข่งขันเดินทนแบบสด (Live scoreboard) สำหรับผู้ชมและผู้ติดตาม",
};

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ round?: string }>;
};

// Thai label for the official's workspace, shown on the "back to workspace" button.
const OFFICIAL_ROLE_LABEL: Record<string, string> = {
  JUDGE: "กรรมการ",
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  EVENT_LOGGER: "ผู้เก็บ Lap Time",
};

export default async function EventLivePage(props: Readonly<Props>) {
  const { eventId } = await props.params;
  const { round: roundParam } = await props.searchParams;

  const event = await getCachedLeaderboard(eventId)();
  if (!event) notFound();

  const initial = buildLeaderboard(event, roundParam);

  // Per-viewer: if an official (judge/head-judge/event-logger) is still logged in
  // for THIS event, offer a button back into their workspace. Computed once on
  // load and passed to <LiveBoard> as a prop — it does not change while watching,
  // so it costs nothing per poll (and must NOT be in the cached JSON).
  const officialSession = await getOfficialSession();
  const officialBack =
    officialSession && officialSession.eventId === eventId
      ? {
          href: defaultRouteForPosition(officialSession.position, eventId),
          label: OFFICIAL_ROLE_LABEL[officialSession.position] ?? "เจ้าหน้าที่",
        }
      : null;

  return (
    <LiveBoard
      initial={initial}
      eventId={eventId}
      roundParam={roundParam ?? null}
      officialBack={officialBack}
    />
  );
}
