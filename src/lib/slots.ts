import type { Rng } from "./rng";

export const SLOT_SYMBOLS = [
  "cherry",
  "lemon",
  "orange",
  "bell",
  "bar",
  "seven",
  "crown",
] as const;

export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

export const SLOT_GLYPH: Record<SlotSymbol, string> = {
  cherry: "🍒",
  lemon: "🍋",
  orange: "🍊",
  bell: "🔔",
  bar: "▬",
  seven: "7",
  crown: "♛",
};

const REEL_WEIGHTS: SlotSymbol[] = [
  ...Array<SlotSymbol>(14).fill("cherry"),
  ...Array<SlotSymbol>(12).fill("lemon"),
  ...Array<SlotSymbol>(10).fill("orange"),
  ...Array<SlotSymbol>(8).fill("bell"),
  ...Array<SlotSymbol>(5).fill("bar"),
  ...Array<SlotSymbol>(3).fill("seven"),
  ...Array<SlotSymbol>(2).fill("crown"),
];

export const SLOT_PAYTABLE: { match: string; payout: number }[] = [
  { match: "Three crowns", payout: 100 },
  { match: "Three sevens", payout: 50 },
  { match: "Three bars", payout: 25 },
  { match: "Three bells", payout: 12 },
  { match: "Three oranges", payout: 8 },
  { match: "Three lemons", payout: 6 },
  { match: "Three cherries", payout: 5 },
  { match: "Any two cherries", payout: 2 },
  { match: "Any cherry", payout: 1 },
];

export function spinReels(rng: Rng): [SlotSymbol, SlotSymbol, SlotSymbol] {
  return [
    REEL_WEIGHTS[rng.int(REEL_WEIGHTS.length)],
    REEL_WEIGHTS[rng.int(REEL_WEIGHTS.length)],
    REEL_WEIGHTS[rng.int(REEL_WEIGHTS.length)],
  ];
}

export function slotsPayout(
  reels: [SlotSymbol, SlotSymbol, SlotSymbol],
): { multiplier: number; label: string } {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    const table: Record<SlotSymbol, { multiplier: number; label: string }> = {
      crown: { multiplier: 100, label: "Three crowns" },
      seven: { multiplier: 50, label: "Three sevens" },
      bar: { multiplier: 25, label: "Three bars" },
      bell: { multiplier: 12, label: "Three bells" },
      orange: { multiplier: 8, label: "Three oranges" },
      lemon: { multiplier: 6, label: "Three lemons" },
      cherry: { multiplier: 5, label: "Three cherries" },
    };
    return table[a];
  }
  const cherries = reels.filter((s) => s === "cherry").length;
  if (cherries === 2) return { multiplier: 2, label: "Two cherries" };
  if (cherries === 1) return { multiplier: 1, label: "Cherry" };
  return { multiplier: 0, label: "No line" };
}

export function settleSlots(
  reels: [SlotSymbol, SlotSymbol, SlotSymbol],
  bet: number,
): { returned: number; label: string } {
  const { multiplier, label } = slotsPayout(reels);
  return { returned: bet * multiplier, label };
}
