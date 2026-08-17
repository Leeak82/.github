import type { Card } from "../types";
import { rankValue } from "./cards";

export type PokerRank =
  | "royal-flush"
  | "straight-flush"
  | "four-kind"
  | "full-house"
  | "flush"
  | "straight"
  | "three-kind"
  | "two-pair"
  | "jacks"
  | "nothing";

export const POKER_PAYTABLE: { rank: PokerRank; label: string; payout: number }[] = [
  { rank: "royal-flush", label: "Royal flush", payout: 800 },
  { rank: "straight-flush", label: "Straight flush", payout: 50 },
  { rank: "four-kind", label: "Four of a kind", payout: 25 },
  { rank: "full-house", label: "Full house", payout: 9 },
  { rank: "flush", label: "Flush", payout: 6 },
  { rank: "straight", label: "Straight", payout: 4 },
  { rank: "three-kind", label: "Three of a kind", payout: 3 },
  { rank: "two-pair", label: "Two pair", payout: 2 },
  { rank: "jacks", label: "Jacks or better", payout: 1 },
  { rank: "nothing", label: "Nothing", payout: 0 },
];

const PAYOUT: Record<PokerRank, number> = Object.fromEntries(
  POKER_PAYTABLE.map((row) => [row.rank, row.payout]),
) as Record<PokerRank, number>;

function isStraight(values: number[]): boolean {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length !== 5) return false;
  if (unique[4] - unique[0] === 4) return true;
  return unique.join(",") === "2,3,4,5,14";
}

export function evaluatePoker(hand: Card[]): { rank: PokerRank; label: string; multiplier: number } {
  const values = hand.map((c) => rankValue(c.rank)).sort((a, b) => a - b);
  const flush = hand.every((c) => c.suit === hand[0].suit);
  const straight = isStraight(values);
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);
  const royal =
    flush &&
    straight &&
    values.includes(14) &&
    values.includes(13) &&
    values.includes(12) &&
    values.includes(11) &&
    values.includes(10);

  let rank: PokerRank = "nothing";
  if (royal) rank = "royal-flush";
  else if (flush && straight) rank = "straight-flush";
  else if (groups[0] === 4) rank = "four-kind";
  else if (groups[0] === 3 && groups[1] === 2) rank = "full-house";
  else if (flush) rank = "flush";
  else if (straight) rank = "straight";
  else if (groups[0] === 3) rank = "three-kind";
  else if (groups[0] === 2 && groups[1] === 2) rank = "two-pair";
  else if (groups[0] === 2) {
    const pairRank = [...counts.entries()].find(([, n]) => n === 2)?.[0] ?? 0;
    if (pairRank >= 11) rank = "jacks";
  }

  const row = POKER_PAYTABLE.find((r) => r.rank === rank)!;
  return { rank, label: row.label, multiplier: PAYOUT[rank] };
}
