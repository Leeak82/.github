import type { Rng } from "./rng";

export const SLOT_SYMBOLS = [
  "cherry",
  "lemon",
  "plum",
  "grape",
  "bell",
  "bar",
  "seven",
  "wild",
  "scatter",
] as const;

export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];
export type SlotGrid = SlotSymbol[][];

export const LINE_OPTIONS = [1, 5, 9, 15, 20] as const;
export const COIN_OPTIONS = [1, 5, 25, 50, 100] as const;

export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 1, 1, 1, 2],
  [2, 1, 1, 1, 0],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 0, 2, 0, 0],
  [2, 2, 0, 2, 2],
  [0, 2, 0, 2, 0],
];

export const LINE_PAY: Record<Exclude<SlotSymbol, "scatter">, Record<3 | 4 | 5, number>> = {
  cherry: { 3: 5, 4: 15, 5: 40 },
  lemon: { 3: 5, 4: 15, 5: 40 },
  plum: { 3: 8, 4: 20, 5: 60 },
  grape: { 3: 10, 4: 25, 5: 80 },
  bell: { 3: 15, 4: 40, 5: 100 },
  bar: { 3: 25, 4: 80, 5: 200 },
  seven: { 3: 50, 4: 150, 5: 400 },
  wild: { 3: 80, 4: 250, 5: 800 },
};

export const SCATTER_PAY: Record<3 | 4 | 5, number> = { 3: 2, 4: 10, 5: 50 };

export const SLOT_PAYTABLE: { match: string; payout: string }[] = [
  { match: "5 Wild", payout: "800 x coin" },
  { match: "5 Sevens", payout: "400 x coin" },
  { match: "5 Bars", payout: "200 x coin" },
  { match: "5 Bells", payout: "100 x coin" },
  { match: "5 Grapes", payout: "80 x coin" },
  { match: "5 Plums", payout: "60 x coin" },
  { match: "5 Cherries / Lemons", payout: "40 x coin" },
  { match: "3 of a kind (any pay symbol)", payout: "from 5 x coin" },
  { match: "3 / 4 / 5 Stars anywhere", payout: "2x / 10x / 50x total bet" },
];

const REEL_BAG: SlotSymbol[] = [
  ...Array<SlotSymbol>(14).fill("cherry"),
  ...Array<SlotSymbol>(12).fill("lemon"),
  ...Array<SlotSymbol>(11).fill("plum"),
  ...Array<SlotSymbol>(10).fill("grape"),
  ...Array<SlotSymbol>(8).fill("bell"),
  ...Array<SlotSymbol>(6).fill("bar"),
  ...Array<SlotSymbol>(4).fill("seven"),
  ...Array<SlotSymbol>(3).fill("wild"),
  ...Array<SlotSymbol>(2).fill("scatter"),
];

export function pickSymbol(rng: Rng): SlotSymbol {
  return REEL_BAG[rng.int(REEL_BAG.length)];
}

export function spinGrid(rng: Rng): SlotGrid {
  return [0, 1, 2].map(() => [0, 1, 2, 3, 4].map(() => pickSymbol(rng)));
}

export function lineSymbols(grid: SlotGrid, lineIndex: number): SlotSymbol[] {
  return PAYLINES[lineIndex].map((row, col) => grid[row][col]);
}

export function matchLine(
  symbols: SlotSymbol[],
): { symbol: Exclude<SlotSymbol, "scatter">; count: 3 | 4 | 5 } | null {
  let symbol: Exclude<SlotSymbol, "scatter"> | null = null;
  let count = 0;
  for (const next of symbols) {
    if (next === "scatter") break;
    if (next === "wild") {
      count += 1;
      continue;
    }
    if (symbol === null) {
      symbol = next;
      count += 1;
      continue;
    }
    if (next === symbol) count += 1;
    else break;
  }
  if (count < 3) return null;
  return { symbol: symbol ?? "wild", count: (count > 5 ? 5 : count) as 3 | 4 | 5 };
}

export interface LineWin {
  line: number;
  symbol: Exclude<SlotSymbol, "scatter">;
  count: 3 | 4 | 5;
  amount: number;
}

export function evaluateGrid(
  grid: SlotGrid,
  lines: number,
  coin: number,
): {
  returned: number;
  wins: LineWin[];
  scatterCount: number;
  scatterPay: number;
  label: string;
} {
  const used = Math.min(Math.max(lines, 1), PAYLINES.length);
  const wins: LineWin[] = [];
  for (let i = 0; i < used; i += 1) {
    const hit = matchLine(lineSymbols(grid, i));
    if (!hit) continue;
    wins.push({
      line: i + 1,
      symbol: hit.symbol,
      count: hit.count,
      amount: coin * LINE_PAY[hit.symbol][hit.count],
    });
  }
  const scatterCount = grid.flat().filter((symbol) => symbol === "scatter").length;
  const scatterPay =
    scatterCount >= 3 ? coin * used * SCATTER_PAY[Math.min(scatterCount, 5) as 3 | 4 | 5] : 0;
  const linePay = wins.reduce((sum, win) => sum + win.amount, 0);
  const returned = linePay + scatterPay;
  const parts: string[] = [];
  if (wins.length === 1) {
    parts.push(`Line ${wins[0].line}: ${wins[0].count} ${wins[0].symbol}`);
  } else if (wins.length > 1) {
    parts.push(`${wins.length} paying lines`);
  }
  if (scatterPay) parts.push(`${scatterCount} stars`);
  return {
    returned,
    wins,
    scatterCount,
    scatterPay,
    label: parts.join(" + ") || "No win",
  };
}

export function totalBet(lines: number, coin: number): number {
  return lines * coin;
}
