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
}: {
  yellow: number;
  red: number;
  redDetails?: RedCardDetail[];
  hideYellow?: boolean;
  maxRed?: number;
}) {
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

  const redGridClass =
    effectiveMaxRed > 4
      ? "flex flex-row gap-1 shrink-0"
      : "grid grid-cols-2 gap-1 shrink-0 w-12";

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-1.5 py-1">
      {!hideYellow && (
        <div className="flex flex-col gap-1">
          {yellowCards.map((isFilled, index) => (
            <span
              key={`yellow-${index}`}
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                isFilled ? "bg-amber-400" : "ring-1 ring-amber-100"
              }`}
            />
          ))}
        </div>
      )}

      <div className={redGridClass}>
        {redCards.map((redCard, index) => (
          <span
            key={`red-${index}`}
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[16px] text-white font-semibold ${
              redCard.isFilled
                ? redCard.isFromThisJudge
                  ? "bg-red-500 text-slate-900 ring-1 ring-yellow-400"
                  : "bg-red-500 text-slate-900"
                : "ring-1 ring-red-100"
            }`}
          >
            {redCard.isFilled && redCard.symbol ? redCard.symbol : ""}
          </span>
        ))}
      </div>
    </div>
  );
}


