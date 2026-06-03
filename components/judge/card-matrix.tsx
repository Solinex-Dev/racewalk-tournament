export const MAX_YELLOW = 2;
export const MAX_RED = 4;

export type RedCardSymbol = "~" | ">";

export type RedCardDetail = {
  symbol: RedCardSymbol; // งอเข่า (>) หรือยกเท้า (~)
  isFromThisJudge?: boolean; // ใบแดงนี้เป็นของกรรมการคนนี้หรือไม่
};

export type YellowCardDetail = {
  symbol?: string; // สัญลักษณ์ของใบเหลือง (ถ้ามี)
};

export function JudgeCardMatrix({
  yellow,
  red,
  redDetails,
  hideYellow = false,
  maxRed: maxRedProp,
  horizontal = false,
  mobile = false,
}: Readonly<{
  yellow: number;
  red: number;
  redDetails?: RedCardDetail[];
  hideYellow?: boolean;
  maxRed?: number;
  horizontal?: boolean;
  mobile?: boolean;
}>) {
  const effectiveMaxRed = maxRedProp ?? MAX_RED;

  const safeYellow = Math.min(yellow, MAX_YELLOW);
  const safeRed = Math.min(red, effectiveMaxRed);

  const yellowCards = [];
  for (let i = 0; i < MAX_YELLOW; i++) {
    yellowCards.push(i < safeYellow);
  }

  const redCards = [];
  for (let i = 0; i < effectiveMaxRed; i++) {
    redCards.push({
      isFilled: i < safeRed,
      symbol: redDetails?.[i]?.symbol,
      isFromThisJudge: redDetails?.[i]?.isFromThisJudge || false,
    });
  }

  const redFlexSuffix = mobile ? " flex-wrap" : "";
  const redGridSuffix = mobile ? " w-10" : " w-12";
  const redGridClass =
    horizontal || effectiveMaxRed > 4
      ? `flex flex-row gap-1 shrink-0${redFlexSuffix}`
      : `grid grid-cols-2 gap-1 shrink-0${redGridSuffix}`;

  const rootClass = mobile
    ? "flex justify-center items-center rounded-full px-1 py-0.5"
    : "inline-flex items-center gap-2 rounded-full px-1.5 py-1";

  const yellowCardClass = mobile
    ? "flex h-4 w-4 items-center justify-center rounded-full"
    : "flex h-5 w-5 items-center justify-center rounded-full";

  const redCardClass = mobile
    ? "flex h-4 w-3.5 items-center justify-center rounded text-xs text-white font-semibold"
    : "flex h-6 w-5 items-center justify-center rounded-sm text-[16px] text-white font-semibold";

  return (
    <div className={rootClass}>
      {!hideYellow && (
        <div className={`flex flex-col gap-1${mobile ? " mb-1" : ""}`}>
          {yellowCards.map((isFilled, index) => (
            <span
              key={`yellow-${index}`}
              className={`${yellowCardClass} ${
                isFilled ? "bg-amber-400" : "ring-1 ring-amber-100"
              }`}
            />
          ))}
        </div>
      )}

      <div className={redGridClass}>
        {redCards.map((redCard, index) => {
          const filledClass = redCard.isFromThisJudge
            ? "bg-red-500 text-slate-900 ring-1 ring-yellow-400"
            : "bg-red-500 text-slate-900";
          return (
            <span
              key={`red-${index}`}
              className={`${redCardClass} ${
                redCard.isFilled ? filledClass : "ring-1 ring-slate-700"
              }`}
            >
              {redCard.isFilled && redCard.symbol ? redCard.symbol : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}


