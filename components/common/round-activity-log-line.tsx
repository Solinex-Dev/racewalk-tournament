"use client";

import {
  formatRoundActivityLog,
  type RoundActivityLogInput,
} from "@/lib/round-activity-log-display";
import { cn } from "@/lib/utils";

type RoundActivityLogLineProps = {
  log: RoundActivityLogInput;
  actorName: string;
  /** light = admin/moderator (slate bg), dark = head-judge workspace */
  theme?: "light" | "dark";
};

export function RoundActivityLogLine({
  log,
  actorName,
  theme = "dark",
}: RoundActivityLogLineProps) {
  const formatted = formatRoundActivityLog(log);
  const actorClass =
    theme === "dark" ? "text-slate-100" : "text-slate-900";
  const roleClass =
    theme === "dark" ? "text-slate-500" : "text-slate-500";
  const detailClass =
    theme === "dark" ? "text-slate-500" : "text-slate-500";

  return (
    <div className="min-w-0 flex-1 space-y-1">
      <p className="text-xs leading-relaxed">
        <span className={cn("font-semibold", actorClass)}>{actorName}</span>
        <span className={roleClass}> ({formatted.actorRoleLabel})</span>
        {formatted.badge && (
          <span
            className={cn(
              "ml-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
              formatted.badge.className,
            )}
          >
            {formatted.badge.label}
          </span>
        )}
        <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
          {" "}
          —{" "}
        </span>
        {formatted.parts.map((part, i) => (
          <span
            key={i}
            className={cn(
              part.bold && "font-semibold",
              part.className ?? (theme === "dark" ? "text-slate-200" : "text-slate-800"),
            )}
          >
            {part.text}
          </span>
        ))}
      </p>
      {formatted.detailLine && (
        <p className={cn("text-[11px]", detailClass)}>{formatted.detailLine}</p>
      )}
    </div>
  );
}
