export const ROULETTE_RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type RouletteColor = "green" | "red" | "black";

export type RouletteBetKind =
  | { kind: "straight"; n: number }
  | { kind: "color"; color: "red" | "black" }
  | { kind: "parity"; parity: "even" | "odd" }
  | { kind: "range"; range: "low" | "high" }
  | { kind: "dozen"; dozen: 1 | 2 | 3 }
  | { kind: "column"; column: 1 | 2 | 3 };

export interface RouletteWager {
  bet: RouletteBetKind;
  amount: number;
}

export function wheelColor(n: number): RouletteColor {
  if (n === 0) return "green";
  return ROULETTE_RED.has(n) ? "red" : "black";
}

export function betKey(bet: RouletteBetKind): string {
  switch (bet.kind) {
    case "straight":
      return `n-${bet.n}`;
    case "color":
      return bet.color;
    case "parity":
      return bet.parity;
    case "range":
      return bet.range;
    case "dozen":
      return `dozen-${bet.dozen}`;
    case "column":
      return `col-${bet.column}`;
  }
}

export function betLabel(bet: RouletteBetKind): string {
  switch (bet.kind) {
    case "straight":
      return bet.n === 0 ? "0" : String(bet.n);
    case "color":
      return bet.color === "red" ? "Red" : "Black";
    case "parity":
      return bet.parity === "even" ? "Even" : "Odd";
    case "range":
      return bet.range === "low" ? "1–18" : "19–36";
    case "dozen":
      return bet.dozen === 1 ? "1st 12" : bet.dozen === 2 ? "2nd 12" : "3rd 12";
    case "column":
      return `Column ${bet.column}`;
  }
}

export function payoutMultiplier(bet: RouletteBetKind): number {
  switch (bet.kind) {
    case "straight":
      return 35;
    case "color":
    case "parity":
    case "range":
      return 1;
    case "dozen":
    case "column":
      return 2;
  }
}

export function betHits(bet: RouletteBetKind, n: number): boolean {
  if (n === 0) return bet.kind === "straight" && bet.n === 0;
  switch (bet.kind) {
    case "straight":
      return bet.n === n;
    case "color":
      return wheelColor(n) === bet.color;
    case "parity":
      return bet.parity === "even" ? n % 2 === 0 : n % 2 === 1;
    case "range":
      return bet.range === "low" ? n <= 18 : n >= 19;
    case "dozen":
      return n >= (bet.dozen - 1) * 12 + 1 && n <= bet.dozen * 12;
    case "column":
      return n % 3 === (bet.column === 3 ? 0 : bet.column);
  }
}

export function settleRoulette(
  wagers: RouletteWager[],
  n: number,
): { returned: number; net: number; winners: RouletteWager[] } {
  let returned = 0;
  const winners: RouletteWager[] = [];
  const stake = wagers.reduce((sum, w) => sum + w.amount, 0);
  for (const wager of wagers) {
    if (betHits(wager.bet, n)) {
      returned += wager.amount + wager.amount * payoutMultiplier(wager.bet);
      winners.push(wager);
    }
  }
  return { returned, net: returned - stake, winners };
}

export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
