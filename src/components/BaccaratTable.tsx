import { useEffect, useRef, useState } from "react";
import { buildShoe } from "../lib/cards";
import {
  baccaratPayout,
  baccaratTotal,
  playBaccarat,
  type BaccaratRound,
  type BaccaratSide,
} from "../lib/baccarat";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";
import { BetRail, OutcomeBanner, PlayingCard, StakeReadout, TableMeta } from "./ui";

const SIDES: { id: BaccaratSide; label: string; price: string }[] = [
  { id: "player", label: "Player", price: "1:1" },
  { id: "banker", label: "Banker", price: "0.95:1" },
  { id: "tie", label: "Tie", price: "8:1" },
];

export function BaccaratTable() {
  const { chip, spend, payout, sfx } = useCasino();
  const [shoe, setShoe] = useState(() => buildShoe(8, cryptoRng()));
  const [side, setSide] = useState<BaccaratSide>("player");
  const [round, setRound] = useState<BaccaratRound | null>(null);
  const [dealing, setDealing] = useState(false);
  const [message, setMessage] = useState("Pick a side, then deal. Banker pays 0.95:1.");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function deal() {
    if (dealing) return;
    if (!spend("baccarat", `Baccarat ${side} ${formatChips(chip)}`, chip)) {
      setMessage("Not enough chips for that side. Pick a smaller chip.");
      sfx("lose");
      return;
    }
    const ready = shoe.length < 16 ? buildShoe(8, cryptoRng()) : shoe;
    const { round: next, shoe: rest } = playBaccarat(ready);
    setDealing(true);
    setRound({ ...next, player: [], banker: [] });
    setShoe(rest);
    sfx("deal");
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    const reveal = [
      () => setRound({ ...next, player: next.player.slice(0, 1), banker: [] }),
      () => setRound({ ...next, player: next.player.slice(0, 1), banker: next.banker.slice(0, 1) }),
      () => setRound({ ...next, player: next.player.slice(0, 2), banker: next.banker.slice(0, 1) }),
      () => setRound({ ...next, player: next.player.slice(0, 2), banker: next.banker.slice(0, 2) }),
      () =>
        setRound({
          ...next,
          player: next.player.slice(0, Math.min(3, next.player.length)),
          banker: next.banker.slice(0, 2),
        }),
      () => setRound(next),
    ];
    reveal.forEach((step, i) => {
      timers.current.push(window.setTimeout(step, 220 * (i + 1)));
    });
    timers.current.push(
      window.setTimeout(() => {
        const returned = baccaratPayout(side, chip, next.winner);
        if (returned > 0) payout("baccarat", `Baccarat ${next.winner}`, returned);
        else sfx("lose");
        const verb =
          next.winner === "tie" ? "Tie" : next.winner === "player" ? "Player wins" : "Banker wins";
        setMessage(
          returned > 0
            ? `${verb}, ${next.playerTotal}-${next.bankerTotal} - paid ${formatChips(returned)}`
            : `${verb}, ${next.playerTotal}-${next.bankerTotal}`,
        );
        setDealing(false);
      }, 1600),
    );
  }

  const tone = message.includes("paid") ? "win" : round && !dealing && !message.includes("paid") ? "lose" : "idle";

  return (
    <div className="table-wrap">
      <TableMeta game="baccarat" extra={`8-deck shoe, ${shoe.length} left`} />
      <div className="felt baccarat-felt">
        <p className="table-title">Baccarat. Player vs Banker. Extra cards are automatic.</p>
        <div className="bacc-hands">
          <div>
            <span className="hand-label">Player {round ? baccaratTotal(round.player) : ""}</span>
            <div className="cards">
              {(round?.player.length ? round.player : [undefined, undefined]).map((card, i) =>
                card ? (
                  <PlayingCard key={`p${i}`} card={card} delay={i * 80} />
                ) : (
                  <PlayingCard key={`p-empty-${i}`} ghost />
                ),
              )}
            </div>
          </div>
          <div>
            <span className="hand-label">Banker {round ? baccaratTotal(round.banker) : ""}</span>
            <div className="cards">
              {(round?.banker.length ? round.banker : [undefined, undefined]).map((card, i) =>
                card ? (
                  <PlayingCard key={`b${i}`} card={card} delay={80 + i * 80} />
                ) : (
                  <PlayingCard key={`b-empty-${i}`} ghost />
                ),
              )}
            </div>
          </div>
        </div>
        <div className="side-row">
          {SIDES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`side-bet ${side === entry.id ? "selected" : ""}`}
              onClick={() => {
                if (dealing) return;
                setSide(entry.id);
                sfx("click");
              }}
            >
              <strong>{entry.label}</strong>
              <span>{entry.price}</span>
            </button>
          ))}
        </div>
        <OutcomeBanner text={message} tone={tone} />
        <div className="table-controls">
          <BetRail disabled={dealing} />
          <StakeReadout stake={chip} />
          <div className="action-row">
            <button type="button" className="btn primary" onClick={deal} disabled={dealing}>
              {round && !dealing ? "Deal again" : "Deal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
