import { useState } from "react";
import { buildDeck, shuffle } from "../lib/cards";
import { evaluatePoker, POKER_PAYTABLE } from "../lib/poker";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import type { Card } from "../types";
import { useCasino } from "../state/casino";
import { BetRail, OutcomeBanner, Paytable, PlayingCard, StakeReadout, TableMeta } from "./ui";

type Phase = "idle" | "hold" | "settled";

export function VideoPoker() {
  const { chip, spend, payout, sfx } = useCasino();
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("Deal five cards, click to hold, then draw.");
  const [evalLabel, setEvalLabel] = useState("");

  function deal() {
    if (phase === "hold") return;
    if (!spend("poker", `Video poker ${formatChips(chip)}`, chip)) {
      setMessage("Not enough chips to deal. Pick a smaller chip.");
      sfx("lose");
      return;
    }
    const nextDeck = shuffle(buildDeck(), cryptoRng());
    const nextHand = nextDeck.slice(0, 5);
    const rest = nextDeck.slice(5);
    const preview = evaluatePoker(nextHand);
    setDeck(rest);
    setHand(nextHand);
    setHeld([false, false, false, false, false]);
    setPhase("hold");
    sfx("deal");
    setEvalLabel(preview.rank === "nothing" ? "" : preview.label);
    setMessage(
      preview.rank === "nothing" ? "Click cards to hold, then draw." : `${preview.label} - hold or draw.`,
    );
  }

  function toggle(index: number) {
    if (phase !== "hold") return;
    setHeld((current) => current.map((v, i) => (i === index ? !v : v)));
    sfx("click");
  }

  function draw() {
    if (phase !== "hold") return;
    let remaining = deck;
    const nextHand = hand.map((card, i) => {
      if (held[i]) return card;
      const [drawn, ...rest] = remaining;
      remaining = rest;
      return drawn;
    });
    const result = evaluatePoker(nextHand);
    const returned = chip * result.multiplier;
    if (returned > 0) payout("poker", result.label, returned);
    else sfx("lose");
    setHand(nextHand);
    setDeck(remaining);
    setPhase("settled");
    setEvalLabel(result.label);
    setMessage(returned > 0 ? `${result.label} - paid ${formatChips(returned)}` : "Nothing. Deal again.");
  }

  const tone = message.includes("paid") ? "win" : phase === "settled" ? "lose" : "idle";
  const slots = hand.length === 5 ? hand : [null, null, null, null, null];

  return (
    <div className="table-wrap poker-wrap">
      <div>
        <TableMeta game="poker" extra="click a card to hold" />
        <div className="felt poker-felt">
          <p className="table-title">Jacks or Better. 9/6 pay table.</p>
          <div className="poker-hand">
            {slots.map((card, i) => (
              <button
                key={card ? `${card.rank}${card.suit}${i}` : `empty-${i}`}
                type="button"
                className={`hold-slot ${held[i] ? "held" : ""}`}
                onClick={() => toggle(i)}
                disabled={phase !== "hold"}
              >
                {card ? <PlayingCard card={card} delay={i * 60} /> : <PlayingCard ghost />}
                <span className="hold-tag">{held[i] ? "Held" : phase === "hold" ? "Hold" : " "}</span>
              </button>
            ))}
          </div>
          {evalLabel ? <p className="eval-label">{evalLabel}</p> : null}
          <OutcomeBanner text={message} tone={tone} />
          <div className="table-controls">
            <BetRail disabled={phase === "hold"} />
            <StakeReadout stake={chip} />
            <div className="action-row">
              <button type="button" className="btn primary" onClick={deal} disabled={phase === "hold"}>
                {phase === "settled" ? "Deal again" : "Deal"}
              </button>
              <button type="button" className="btn gold" onClick={draw} disabled={phase !== "hold"}>
                Draw
              </button>
            </div>
          </div>
        </div>
      </div>
      <Paytable
        rows={POKER_PAYTABLE.filter((row) => row.payout > 0).map((row) => ({
          match: row.label,
          payout: `${row.payout}×`,
        }))}
      />
    </div>
  );
}
