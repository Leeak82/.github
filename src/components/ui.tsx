import type { Card } from "../types";
import { SUIT_GLYPH, isRed } from "../lib/cards";
import { formatChips } from "../lib/format";
import { CHIP_VALUES, useCasino } from "../state/casino";

export function PlayingCard({
  card,
  faceDown = false,
  delay = 0,
}: {
  card?: Card;
  faceDown?: boolean;
  delay?: number;
}) {
  if (!card || faceDown) {
    return (
      <div className="playing-card back" style={{ animationDelay: `${delay}ms` }} aria-hidden="true">
        <div className="card-back-mark">♛</div>
      </div>
    );
  }
  const red = isRed(card.suit);
  return (
    <div
      className={`playing-card ${red ? "red" : "black"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="corner top">
        {card.rank}
        <small>{SUIT_GLYPH[card.suit]}</small>
      </span>
      <span className="pip">{SUIT_GLYPH[card.suit]}</span>
      <span className="corner bottom">
        {card.rank}
        <small>{SUIT_GLYPH[card.suit]}</small>
      </span>
    </div>
  );
}

export function ChipButton({
  value,
  selected,
  onClick,
}: {
  value: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  const tone = value >= 2500 ? "gold" : value >= 1000 ? "violet" : value >= 500 ? "purple" : value >= 100 ? "black" : "green";
  return (
    <button
      type="button"
      className={`chip chip-${tone} ${selected ? "selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span>{value >= 1000 ? `${value / 1000}k` : value}</span>
    </button>
  );
}

export function BetRail({ disabled }: { disabled?: boolean }) {
  const { chip, setChip } = useCasino();
  return (
    <div className="bet-rail" role="group" aria-label="Chip denomination">
      {CHIP_VALUES.map((value) => (
        <ChipButton
          key={value}
          value={value}
          selected={chip === value}
          onClick={() => {
            if (!disabled) setChip(value);
          }}
        />
      ))}
    </div>
  );
}

export function StakeReadout({ stake }: { stake: number }) {
  return (
    <div className="stake-readout">
      Stake <strong>{formatChips(stake)}</strong>
    </div>
  );
}

export function OutcomeBanner({
  text,
  tone,
}: {
  text: string;
  tone: "win" | "lose" | "push" | "idle";
}) {
  if (!text) return null;
  return <div className={`outcome ${tone}`}>{text}</div>;
}

export function Paytable({
  rows,
}: {
  rows: { match: string; payout: string }[];
}) {
  return (
    <table className="paytable">
      <tbody>
        {rows.map((row) => (
          <tr key={row.match}>
            <td>{row.match}</td>
            <td>{row.payout}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
