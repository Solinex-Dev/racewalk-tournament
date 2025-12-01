export const MAX_YELLOW = 6;
export const MAX_RED = 2;

export function JudgeCardMatrix({
  yellow,
  red,
}: {
  yellow: number;
  red: number;
}) {
  // Layout:
  // ( Y ) ( Y ) ( Y ) ( R )
  // ( Y ) ( Y ) ( Y ) ( R )
  const layout: ("Y" | "R")[][] = [
    ["Y", "Y", "Y", "R"],
    ["Y", "Y", "Y", "R"],
  ];

  let yellowIndex = 0;
  let redIndex = 0;

  const safeYellow = Math.min(yellow, MAX_YELLOW);
  const safeRed = Math.min(red, MAX_RED);

  return (
    <div className="inline-grid grid-cols-4 gap-1 rounded-full bg-slate-50 px-1.5 py-1 ring-1 ring-slate-200">
      {layout.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const key = `${rowIdx}-${colIdx}-${cell}`;

          if (cell === "Y") {
            const isFilled = yellowIndex < safeYellow;
            yellowIndex += 1;

            return (
              <span
                key={key}
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
                  isFilled
                    ? "bg-amber-400 text-slate-900"
                    : "bg-amber-50 text-amber-300 ring-1 ring-amber-100"
                }`}
              >
                Y
              </span>
            );
          }

          const isFilled = redIndex < safeRed;
          redIndex += 1;

          return (
            <span
              key={key}
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
                isFilled
                  ? "bg-red-400 text-slate-900"
                  : "bg-red-50 text-red-300 ring-1 ring-red-100"
              }`}
            >
              R
            </span>
          );
        }),
      )}
    </div>
  );
}


