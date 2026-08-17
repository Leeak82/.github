import { useState } from "react";
import { SLOT_GLYPH, SLOT_PAYTABLE, SLOT_SYMBOLS, settleSlots, spinReels, type SlotSymbol } from "../lib/slots";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";
import { BetRail, OutcomeBanner, Paytable, StakeReadout } from "./ui";

function randomSymbol(): SlotSymbol {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

export function SlotsCabinet() {
  const { chip, spend, payout } = useCasino();
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>(["crown", "seven", "cherry"]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("One line. Pull for the crown.");

  function spin() {
    if (spinning) return;
    if (!spend("slots", `Slots ${formatChips(chip)}`, chip)) {
      setMessage("Not enough chips to spin.");
      return;
    }
    setSpinning(true);
    setMessage("Reels in motion.");
    const final = spinReels(cryptoRng());
    const timers: number[] = [];
    const tick = window.setInterval(() => {
      setReels([randomSymbol(), randomSymbol(), randomSymbol()]);
    }, 70);
    [0, 1, 2].forEach((index) => {
      timers.push(
        window.setTimeout(() => {
          setReels((current) => {
            const next = [...current] as [SlotSymbol, SlotSymbol, SlotSymbol];
            next[index] = final[index];
            return next;
          });
        }, 700 + index * 420),
      );
    });
    window.setTimeout(() => {
      window.clearInterval(tick);
      timers.forEach((id) => window.clearTimeout(id));
      setReels(final);
      const settled = settleSlots(final, chip);
      if (settled.returned > 0) payout("slots", settled.label, settled.returned);
      setMessage(
        settled.returned > 0
          ? `${settled.label} — paid ${formatChips(settled.returned)}`
          : "The line goes cold.",
      );
      setSpinning(false);
    }, 2100);
  }

  const tone = message.includes("paid") ? "win" : message.includes("cold") ? "lose" : "idle";

  return (
    <div className="table-wrap slots-wrap">
      <div className="cabinet">
        <div className="cabinet-marquee">Crown Slots</div>
        <div className={`reel-window ${spinning ? "spinning" : ""}`}>
          {reels.map((symbol, i) => (
            <div key={i} className={`reel-face ${symbol}`}>
              <span>{SLOT_GLYPH[symbol]}</span>
              <small>{symbol}</small>
            </div>
          ))}
        </div>
        <OutcomeBanner text={message} tone={tone} />
        <div className="table-controls">
          <BetRail disabled={spinning} />
          <StakeReadout stake={chip} />
          <div className="action-row">
            <button type="button" className="btn primary" onClick={spin} disabled={spinning}>
              Spin
            </button>
          </div>
        </div>
      </div>
      <Paytable
        rows={SLOT_PAYTABLE.map((row) => ({
          match: row.match,
          payout: `${row.payout}×`,
        }))}
      />
    </div>
  );
}
