import { useEffect, useMemo, useState } from "react";
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
import { BetRail, OutcomeBanner, PlayingCard, StakeReadout, TableMeta } from "./ui";

const SHOE_DECKS = 6;

export function BlackjackTable() {
  const { chip, wallet, spend, payout, sfx } = useCasino();
  const [shoe, setShoe] = useState(() => buildShoe(SHOE_DECKS, cryptoRng()));
  const [round, setRound] = useState<BlackjackRound | null>(null);
  const [message, setMessage] = useState("Pick a chip and deal.");

  const playerValue = round ? handValue(round.player).total : 0;
  const dealerValue = round ? handValue(round.hideHole ? [round.dealer[0]] : round.dealer).total : 0;
  const busy = round?.phase === "player";
  const settled = round?.phase === "settled";

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
      setMessage("Not enough chips for that stake. Pick a smaller chip.");
      sfx("lose");
      return;
    }
    const nextShoe = ensureShoe(shoe);
    const next = dealRound(nextShoe, chip);
    setShoe(next.shoe);
    setRound(next);
    sfx("deal");
    if (next.phase === "settled") {
      if (next.payout) payout("blackjack", outcomeLabel(next.outcome!), next.payout);
      else sfx("lose");
    }
    setMessage(
      next.outcome ? outcomeLabel(next.outcome) : `You have ${handValue(next.player).total}. Hit, stand, or double.`,
    );
  }

  function onHit() {
    if (!round || round.phase !== "player") return;
    const next = hit(round);
    setShoe(next.shoe);
    setRound(next);
    sfx("deal");
    if (next.outcome === "lose") sfx("lose");
    setMessage(next.outcome ? outcomeLabel(next.outcome) : `You have ${handValue(next.player).total}.`);
  }

  function onStand() {
    if (!round || round.phase !== "player") return;
    const next = stand(round);
    setShoe(next.shoe);
    setRound(next);
    if (next.payout) payout("blackjack", outcomeLabel(next.outcome!), next.payout);
    else if (next.outcome === "lose") sfx("lose");
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
    sfx("deal");
    if (next.payout) payout("blackjack", outcomeLabel(next.outcome!), next.payout);
    else if (next.outcome === "lose") sfx("lose");
    setMessage(next.outcome ? outcomeLabel(next.outcome) : message);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      if (event.key === "Enter") deal();
      if (event.key === "h" || event.key === "H") onHit();
      if (event.key === "s" || event.key === "S") onStand();
      if (event.key === "d" || event.key === "D") onDouble();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tone =
    round?.outcome === "lose" ? "lose" : round?.outcome === "push" ? "push" : round?.outcome ? "win" : "idle";
  const dealerCards = round?.dealer ?? [];
  const playerCards = round?.player ?? [];

  return (
    <div className="table-wrap">
      <TableMeta game="blackjack" extra={`shoe ${shoe.length} cards`} />
      <div className="felt blackjack-felt">
        <p className="table-title">Blackjack pays 3 to 2. Dealer stands on 17.</p>
        <div className="hand-row dealer">
          <span className="hand-label">Dealer {round ? dealerValue : ""}</span>
          <div className="cards">
            {[0, 1].map((i) => {
              const card = dealerCards[i];
              if (!card) return <PlayingCard key={`d-empty-${i}`} ghost />;
              return (
                <PlayingCard
                  key={`${card.rank}${card.suit}${i}`}
                  card={card}
                  faceDown={round?.hideHole && i === 1}
                  delay={i * 80}
                />
              );
            })}
            {dealerCards.slice(2).map((card, i) => (
              <PlayingCard key={`${card.rank}${card.suit}x${i}`} card={card} delay={200 + i * 80} />
            ))}
          </div>
        </div>
        <div className="hand-row">
          <span className="hand-label">You {round ? playerValue : ""}</span>
          <div className="cards">
            {[0, 1].map((i) => {
              const card = playerCards[i];
              if (!card) return <PlayingCard key={`p-empty-${i}`} ghost />;
              return <PlayingCard key={`${card.rank}${card.suit}${i}`} card={card} delay={120 + i * 80} />;
            })}
            {playerCards.slice(2).map((card, i) => (
              <PlayingCard key={`${card.rank}${card.suit}p${i}`} card={card} delay={200 + i * 80} />
            ))}
          </div>
        </div>
        <OutcomeBanner text={message} tone={tone} />
        <div className="table-controls">
          <BetRail disabled={busy} />
          <StakeReadout stake={busy ? round!.bet : chip} />
          <div className="action-row">
            <button type="button" className="btn primary" onClick={deal} disabled={busy}>
              {settled ? "Deal again" : "Deal"}
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
