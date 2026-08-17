import { useMemo, useState } from "react";
import { buildShoe } from "../lib/cards";
import {
  dealRound,
  doubleDown,
  handValue,
  hit,
  outcomeLabel,
  stand,
  type BlackjackRound,
} from "../lib/blackjack";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";
import { BetRail, OutcomeBanner, PlayingCard, StakeReadout } from "./ui";

const SHOE_DECKS = 6;

export function BlackjackTable() {
  const { chip, wallet, spend, payout } = useCasino();
  const [shoe, setShoe] = useState(() => buildShoe(SHOE_DECKS, cryptoRng()));
  const [round, setRound] = useState<BlackjackRound | null>(null);
  const [message, setMessage] = useState("Place a stake and deal.");

  const playerValue = round ? handValue(round.player).total : 0;
  const dealerValue = round ? handValue(round.hideHole ? [round.dealer[0]] : round.dealer).total : 0;
  const busy = round?.phase === "player";

  const canDouble = useMemo(() => {
    return Boolean(
      round &&
        round.phase === "player" &&
        round.player.length === 2 &&
        !round.doubled &&
        wallet.balance >= round.bet,
    );
  }, [round, wallet.balance]);

  function ensureShoe(current: typeof shoe) {
    if (current.length < 30) return buildShoe(SHOE_DECKS, cryptoRng());
    return current;
  }

  function deal() {
    if (round?.phase === "player") return;
    if (!spend("blackjack", `Blackjack stake ${formatChips(chip)}`, chip)) {
      setMessage("Not enough chips for that stake.");
      return;
    }
    const nextShoe = ensureShoe(shoe);
    const next = dealRound(nextShoe, chip);
    setShoe(next.shoe);
    setRound(next);
    if (next.phase === "settled" && next.payout) {
      payout("blackjack", outcomeLabel(next.outcome!), next.payout);
    }
    setMessage(
      next.outcome ? outcomeLabel(next.outcome) : `You have ${handValue(next.player).total}.`,
    );
  }

  function onHit() {
    if (!round) return;
    const next = hit(round);
    setShoe(next.shoe);
    setRound(next);
    setMessage(next.outcome ? outcomeLabel(next.outcome) : `You have ${handValue(next.player).total}.`);
  }

  function onStand() {
    if (!round) return;
    const next = stand(round);
    setShoe(next.shoe);
    setRound(next);
    if (next.payout) payout("blackjack", outcomeLabel(next.outcome!), next.payout);
    setMessage(next.outcome ? outcomeLabel(next.outcome) : message);
  }

  function onDouble() {
    if (!round || !canDouble) return;
    if (!spend("blackjack", "Blackjack double", round.bet)) {
      setMessage("Need matching chips to double.");
      return;
    }
    const next = doubleDown(round);
    setShoe(next.shoe);
    setRound(next);
    if (next.payout) payout("blackjack", outcomeLabel(next.outcome!), next.payout);
    setMessage(next.outcome ? outcomeLabel(next.outcome) : message);
  }

  const tone =
    round?.outcome === "lose" ? "lose" : round?.outcome === "push" ? "push" : round?.outcome ? "win" : "idle";

  return (
    <div className="table-wrap">
      <div className="felt blackjack-felt">
        <p className="table-title">Blackjack pays 3 to 2 • Dealer stands on 17</p>
        <div className="hand-row dealer">
          <span className="hand-label">Dealer {round ? dealerValue : ""}</span>
          <div className="cards">
            {round?.dealer.map((card, i) => (
              <PlayingCard
                key={`${card.rank}${card.suit}${i}`}
                card={card}
                faceDown={round.hideHole && i === 1}
                delay={i * 80}
              />
            ))}
          </div>
        </div>
        <div className="hand-row">
          <span className="hand-label">You {round ? playerValue : ""}</span>
          <div className="cards">
            {round?.player.map((card, i) => (
              <PlayingCard key={`${card.rank}${card.suit}${i}`} card={card} delay={120 + i * 80} />
            ))}
          </div>
        </div>
        <OutcomeBanner text={message} tone={tone} />
        <div className="table-controls">
          <BetRail disabled={busy} />
          <StakeReadout stake={round?.phase === "player" ? round.bet : chip} />
          <div className="action-row">
            <button type="button" className="btn primary" onClick={deal} disabled={busy}>
              Deal
            </button>
            <button type="button" className="btn" onClick={onHit} disabled={!busy}>
              Hit
            </button>
            <button type="button" className="btn" onClick={onStand} disabled={!busy}>
              Stand
            </button>
            <button type="button" className="btn gold" onClick={onDouble} disabled={!canDouble}>
              Double
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
