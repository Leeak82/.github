import { useEffect, useRef, useState } from "react";
import { SLOT_GLYPH, SLOT_PAYTABLE, SLOT_SYMBOLS, settleSlots, spinReels, type SlotSymbol } from "../lib/slots";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";
import { BetRail, OutcomeBanner, Paytable, StakeReadout, TableMeta } from "./ui";

function randomSymbol(): SlotSymbol {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

export function SlotsCabinet() {
  const { chip, spend, payout, sfx } = useCasino();
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>(["crown", "seven", "cherry"]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("One line. Choose a chip and spin.");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
    };
  }, []);

  function spin() {
    if (spinning) return;
    if (!spend("slots", `Slots ${formatChips(chip)}`, chip)) {
      setMessage("Not enough chips to spin. Pick a smaller chip.");
      sfx("lose");
      return;
    }
    setSpinning(true);
    setMessage("Reels in motion.");
    sfx("spin");
    const final = spinReels(cryptoRng());
    const tick = window.setInterval(() => {
      setReels([randomSymbol(), randomSymbol(), randomSymbol()]);
    }, 70);
    timers.current = [tick];
    [0, 1, 2].forEach((index) => {
      timers.current.push(
        window.setTimeout(() => {
          setReels((current) => {
            const next = [...current] as [SlotSymbol, SlotSymbol, SlotSymbol];
            next[index] = final[index];
            return next;
          });
        }, 700 + index * 420),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        timers.current.forEach((id) => {
          window.clearTimeout(id);
          window.clearInterval(id);
        });
        timers.current = [];
        setReels(final);
        const settled = settleSlots(final, chip);
        if (settled.returned > 0) payout("slots", settled.label, settled.returned);
        else sfx("lose");
        setMessage(
          settled.returned > 0
            ? `${settled.label} — paid ${formatChips(settled.returned)}`
            : "The line goes cold.",
        );
        setSpinning(false);
      }, 2100),
    );
  }

  const tone = message.includes("paid") ? "win" : message.includes("cold") ? "lose" : "idle";

  return (
    <div className="table-wrap slots-wrap">
      <div>
        <TableMeta game="slots" extra="one payline" />
        <div className="cabinet">
          <div className="cabinet-marquee">Crown Slots</div>
          <p className="payline-tag">Payline</p>
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
                {spinning ? "Spinning…" : "Spin"}
              </button>
            </div>
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
