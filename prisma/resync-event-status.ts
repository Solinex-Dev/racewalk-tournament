/**
 * One-off maintenance: re-sync every Event.status with its rounds.
 *   - any round ONGOING         → Event ONGOING
 *   - all rounds FINISHED (>=1)  → Event FINISHED
 *   - only SCHEDULED rounds      → leave as-is
 *
 * Fixes events left stale by the older endRound() that didn't sync Event status.
 *
 * Run: npx tsx prisma/resync-event-status.ts
 */
import "./load-env";
import { prisma } from "../lib/prisma";

async function main() {
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    include: { rounds: { where: { deletedAt: null }, select: { status: true } } },
  });

  for (const ev of events) {
    if (ev.rounds.length === 0) continue;
    const anyOngoing = ev.rounds.some((r) => r.status === "ONGOING");
    const allFinished = ev.rounds.every((r) => r.status === "FINISHED");

    let next: "ONGOING" | "FINISHED" | null = null;
    if (anyOngoing) next = "ONGOING";
    else if (allFinished) next = "FINISHED";

    if (next && next !== ev.status) {
      await prisma.event.update({ where: { id: ev.id }, data: { status: next } });
      console.log(`[resync] ${ev.name}: ${ev.status} → ${next}`);
    } else {
      console.log(`[resync] ${ev.name}: ${ev.status} (no change)`);
    }
  }
  console.log("[resync] done");
}

main()
  .catch((err) => {
    console.error("[resync] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
