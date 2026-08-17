import type { GameId } from "../types";
import { GAMES } from "../lib/catalog";
import { formatChips } from "../lib/format";
import { CHIP_VALUES, useCasino } from "../state/casino";

export function PlayingCard({
  card,
  faceDown = false,
  ghost = false,
  delay = 0,
}: {
  card?: { suit: "spades" | "hearts" | "diamonds" | "clubs"; rank: string };
  faceDown?: boolean;
  ghost?: boolean;
  delay?: number;
}) {
  if (ghost) {
    return <div className="playing-card ghost" aria-hidden="true" />;
  }
  if (!card || faceDown) {
    return (
      <div className="playing-card back" style={{ animationDelay: `${delay}ms` }} aria-hidden="true">
        <div className="card-back-mark">MC</div>
      </div>
    );
  }
  const red = card.suit === "hearts" || card.suit === "diamonds";
  const glyph = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" }[card.suit];
  return (
    <div
      className={`playing-card ${red ? "red" : "black"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="corner top">
        {card.rank}
        <small>{glyph}</small>
      </span>
      <span className="pip">{glyph}</span>
      <span className="corner bottom">
        {card.rank}
        <small>{glyph}</small>
      </span>
    </div>
  );
}

export function ChipButton({
  value,
  selected,
  disabled,
  onClick,
}: {
  value: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const tone =
    value >= 2500 ? "gold" : value >= 1000 ? "violet" : value >= 500 ? "purple" : value >= 100 ? "black" : "green";
  const label = value >= 1000 ? `${value / 1000}k` : String(value);
  return (
    <button
      type="button"
      className={`chip chip-${tone} ${selected ? "selected" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${value} chip`}
    >
      <span>{label}</span>
    </button>
  );
}

export function BetRail({ disabled }: { disabled?: boolean }) {
  const { chip, setChip, wallet, sfx } = useCasino();
  return (
    <div className="bet-rail" role="group" aria-label="Chip denomination">
      {CHIP_VALUES.map((value) => {
        const unaffordable = value > wallet.balance;
        return (
          <ChipButton
            key={value}
            value={value}
            selected={chip === value}
            disabled={disabled || unaffordable}
            onClick={() => {
              setChip(value);
              sfx("chip");
            }}
          />
        );
      })}
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
  return (
    <div className={`outcome ${tone}`} role="status">
      {text}
    </div>
  );
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

export function HowTo({ game }: { game: GameId }) {
  const info = GAMES.find((entry) => entry.id === game)!;
  return (
    <details className="how-to">
      <summary>How to play</summary>
      <ol>
        {info.rules.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </details>
  );
}

export function TableMeta({ game, extra }: { game: GameId; extra?: string }) {
  return (
    <div className="table-meta">
      <p className="limits">Table minimum 25 chips{extra ? ` - ${extra}` : ""}</p>
      <HowTo game={game} />
    </div>
  );
}
