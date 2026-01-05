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
}: {
  yellow: number; // จำนวนใบเหลืองทั้งหมด (note, สูงสุด 2 ใบ, ไม่มีสัญลักษณ์)
  red: number;
  redDetails?: RedCardDetail[]; // รายละเอียดของแต่ละใบแดง (มีสัญลักษณ์)
  hideYellow?: boolean; // ซ่อนใบเหลือง (แสดงแค่ใบแดง)
}) {
  // Layout:
  // Row 0: ( Y ) ( Y ) ( R ) ( R )
  // Row 1: (   ) (   ) ( R ) ( R )
  const layout: ("Y" | "R" | null)[][] = [
    ["Y", "Y", "R", "R"],
    [null, null, "R", "R"],
  ];

  let yellowIndex = 0;
  let redIndex = 0;

  const safeYellow = Math.min(yellow, MAX_YELLOW);
  // ใบเหลืองเป็น note ไม่ได้คำนวณเป็นใบแดง
  const safeRed = Math.min(red, MAX_RED);

  // สร้าง array สำหรับใบเหลือง (column - เรียงจากบนลงล่าง)
  const yellowCards = [];
  for (let i = 0; i < MAX_YELLOW; i++) {
    yellowCards.push(i < safeYellow);
  }

  // สร้าง array สำหรับใบแดง (row - เรียงจากซ้ายไปขวา)
  const redCards = [];
  for (let i = 0; i < MAX_RED; i++) {
    redCards.push({
      isFilled: i < safeRed,
      symbol: redDetails?.[i]?.symbol,
      isFromThisJudge: redDetails?.[i]?.isFromThisJudge || false,
    });
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-1.5 py-1">
      {/* ใบเหลือง - column (เรียงจากบนลงล่าง) */}
      {!hideYellow && (
        <div className="flex flex-col gap-1">
          {yellowCards.map((isFilled, index) => (
            <span
              key={`yellow-${index}`}
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                isFilled
                  ? "bg-amber-400" // ใบเหลืองปกติ (ไม่มีสัญลักษณ์)
                  : "ring-1 ring-amber-100" // ช่องว่าง
              }`}
            >
            </span>
          ))}
        </div>
      )}

      {/* ใบแดง - grid 2x2 (2 แถว 2 คอลัมน์) */}
      <div className="grid grid-cols-2 gap-1 shrink-0 w-12">
        {redCards.map((redCard, index) => (
          <span
            key={`red-${index}`}
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[16px] text-white font-semibold ${
              redCard.isFilled
                ? redCard.isFromThisJudge
                  ? "bg-red-500 text-slate-900 ring-1 ring-yellow-400"
                  : "bg-red-500 text-slate-900 "
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


