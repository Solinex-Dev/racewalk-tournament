export const MAX_YELLOW = 6;
export const MAX_RED = 2;

export type YellowCardSymbol = "~" | ">" | "-";

export type YellowCardDetail = {
  symbol: YellowCardSymbol;
  // "-" หมายถึงช่องที่ถูกบล็อกเพราะได้ใบแดงทันที (3 ช่อง = 1 แดง)
};

export function JudgeCardMatrix({
  yellow,
  red,
  yellowDetails,
}: {
  yellow: number; // จำนวนใบเหลืองทั้งหมด (รวมช่องที่ถูกบล็อก)
  red: number;
  yellowDetails?: YellowCardDetail[]; // รายละเอียดของแต่ละใบเหลือง
}) {
  // Layout:
  // Row 0: ( Y ) ( Y ) ( Y ) ( R )
  // Row 1: ( Y ) ( Y ) ( Y ) ( R )
  const layout: ("Y" | "R")[][] = [
    ["Y", "Y", "Y", "R"],
    ["Y", "Y", "Y", "R"],
  ];

  let yellowIndex = 0;
  let redIndex = 0;

  const safeYellow = Math.min(yellow, MAX_YELLOW);
  
  // คำนวณจำนวนใบแดงจากใบเหลืองจริง (ไม่นับช่องที่ถูกบล็อก "-")
  const actualYellowCards = yellowDetails?.filter(d => d.symbol !== "-").length || 0;
  const calculatedRed = Math.floor(actualYellowCards / 3); // 3 เหลือง = 1 แดง
  const displayRed = Math.max(red, calculatedRed); // ใช้ค่าที่มากกว่า
  const safeRed = Math.min(displayRed, MAX_RED);

  // ถ้าไม่มี yellowDetails ให้ใช้ default pattern
  const defaultSymbols: YellowCardSymbol[] = ["~", ">", "~", ">", "~", ">"];

  return (
    <div className="inline-grid grid-cols-4 gap-1 rounded-full bg-slate-50 px-1.5 py-1 ring-1 ring-slate-200">
      {layout.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const key = `${rowIdx}-${colIdx}-${cell}`;

          if (cell === "Y") {
            const isFilled = yellowIndex < safeYellow;
            const detail = yellowDetails?.[yellowIndex];
            const symbol = detail?.symbol || defaultSymbols[yellowIndex];
            const isBlocked = symbol === "-";
            yellowIndex += 1;

            return (
              <span
                key={key}
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
                  isFilled
                    ? isBlocked
                      ? "bg-slate-300 text-slate-600" // ช่องที่ถูกบล็อก
                      : "bg-amber-400 text-slate-900" // ใบเหลืองปกติ
                    : "bg-amber-50 text-amber-300 ring-1 ring-amber-100" // ช่องว่าง
                }`}
              >
                {isFilled ? symbol : ""}
              </span>
            );
          }

          const isFilled = redIndex < safeRed;
          redIndex += 1;

          return (
            <span
              key={key}
              className={`flex h-4 w-4 items-center justify-center rounded-full ${
                isFilled
                  ? "bg-red-500"
                  : "bg-red-50 ring-1 ring-red-100"
              }`}
            >
            </span>
          );
        }),
      )}
    </div>
  );
}


