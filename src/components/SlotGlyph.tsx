import type { SlotSymbol } from "../lib/slots";

const LABELS: Record<SlotSymbol, string> = {
  cherry: "CH",
  lemon: "LM",
  plum: "PL",
  grape: "GR",
  bell: "BELL",
  bar: "BAR",
  seven: "7",
  wild: "WILD",
  scatter: "STAR",
};

export function SlotGlyph({ symbol }: { symbol: SlotSymbol }) {
  return (
    <div className={`slot-glyph sym-${symbol}`}>
      <span>{LABELS[symbol]}</span>
    </div>
  );
}
