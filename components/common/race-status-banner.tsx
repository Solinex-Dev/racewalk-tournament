export type RacePhase = "not-started" | "live" | "ended";

/** Map a round's status to the shared race phase. */
export function racePhaseFromStatus(status: string): RacePhase {
  if (status === "FINISHED") return "ended";
  if (status === "ONGOING") return "live";
  return "not-started";
}

type RaceStatusBannerProps = {
  phase: RacePhase;
  /** Role-specific verb for the locked action, e.g. "ออกใบ", "บันทึก Lap", "ยืนยันใบ". */
  action?: string;
};

/**
 * One consistent status strip for every race-day official workspace
 * (judge / head-judge / event-logger). Renders nothing while the race is live;
 * otherwise shows a "waiting to start" or "race ended" notice in a single shared
 * format. Pass `action` to tailor the locked-action wording per role.
 */
export function RaceStatusBanner({ phase, action }: Readonly<RaceStatusBannerProps>) {
  if (phase === "live") return null;

  if (phase === "ended") {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
        การแข่งขันจบลงแล้ว{action ? ` — ${action}เพิ่มไม่ได้` : ""}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
      ยังไม่เริ่มการแข่งขัน — รอผู้ดูแลเริ่มจับเวลาในหน้า Moderator
      {action ? ` ก่อนจึงจะ${action}ได้` : ""}
    </div>
  );
}
