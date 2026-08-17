import { useEffect, useMemo, useRef, useState } from "react";
import {
  WHEEL_ORDER,
  betKey,
  betLabel,
  betHits,
  settleRoulette,
  wheelColor,
  type RouletteBetKind,
  type RouletteWager,
} from "../lib/roulette";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";
import { BetRail, OutcomeBanner, StakeReadout, TableMeta } from "./ui";

const SLICE = 360 / 37;

function wheelBackground(): string {
  const stops = WHEEL_ORDER.map((n, i) => {
    const color = n === 0 ? "#0f7a45" : wheelColor(n) === "red" ? "#c41e3a" : "#141218";
    return `${color} ${i * SLICE}deg ${(i + 1) * SLICE}deg`;
  });
  return `conic-gradient(from -${SLICE / 2}deg, ${stops.join(",")})`;
}

function addWager(wagers: RouletteWager[], bet: RouletteBetKind, amount: number): RouletteWager[] {
  const key = betKey(bet);
  const existing = wagers.find((w) => betKey(w.bet) === key);
  if (!existing) return [...wagers, { bet, amount }];
  return wagers.map((w) => (betKey(w.bet) === key ? { ...w, amount: w.amount + amount } : w));
}

export function RouletteTable() {
  const { chip, spend, payout, credit, sfx } = useCasino();
  const [wagers, setWagers] = useState<RouletteWager[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState("Click a number or color to drop a chip, then spin.");
  const spinTimer = useRef<number | null>(null);
  const stake = wagers.reduce((sum, w) => sum + w.amount, 0);
  const bg = useMemo(() => wheelBackground(), []);

  useEffect(() => {
    return () => {
      if (spinTimer.current) window.clearTimeout(spinTimer.current);
    };
  }, []);

  function place(bet: RouletteBetKind) {
    if (spinning) return;
    if (!spend("roulette", `Roulette ${betLabel(bet)}`, chip)) {
      setMessage("Not enough chips for that chip size.");
      sfx("lose");
      return;
    }
    setWagers((current) => addWager(current, bet, chip));
    setMessage(`${betLabel(bet)} • ${formatChips(chip)} added`);
  }

  function clearBoard() {
    if (spinning || stake === 0) return;
    credit("roulette", "Roulette bets returned", stake);
    setWagers([]);
    setResult(null);
    setMessage("Bets returned to your tray.");
  }

  function spin() {
    if (spinning || stake === 0) return;
    const n = cryptoRng().int(37);
    const index = WHEEL_ORDER.indexOf(n);
    const extra = 360 * (4 + cryptoRng().int(3));
    const desired = (360 - index * SLICE) % 360;
    setSpinning(true);
    setResult(null);
    sfx("spin");
    setRotation((current) => {
      const normalized = ((current % 360) + 360) % 360;
      const delta = (desired - normalized + 360) % 360;
      return current + extra + delta;
    });
    spinTimer.current = window.setTimeout(() => {
      const settled = settleRoulette(wagers, n);
      setResult(n);
      setSpinning(false);
      if (settled.returned > 0) {
        payout("roulette", `Roulette ${n} paid`, settled.returned);
      } else {
        sfx("lose");
      }
      const hitNames = settled.winners.map((w) => betLabel(w.bet)).join(", ");
      setMessage(
        settled.returned > 0
          ? `${n} ${wheelColor(n)} — paid ${formatChips(settled.returned)} (${hitNames})`
          : `${n} ${wheelColor(n)} — the wheel keeps the layout`,
      );
      setWagers([]);
    }, 2800);
  }

  const tone = message.includes("paid") ? "win" : message.includes("keeps") ? "lose" : "idle";

  return (
    <div className="table-wrap">
      <TableMeta game="roulette" extra={stake ? `on the layout ${formatChips(stake)}` : "click to bet"} />
      <div className="roulette-stage">
      <div className="wheel-col">
        <div className="wheel-frame">
          <div className="wheel-pointer" />
          <div
            className="wheel"
            style={{
              background: bg,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <div className="wheel-center">♛</div>
          </div>
        </div>
        <div className={`result-pip ${result === null ? "" : wheelColor(result)}`}>
          {spinning ? "…" : result === null ? "—" : result}
        </div>
      </div>
      <div className="felt roulette-felt">
        <div className="roulette-board">
        <div className="roulette-grid">
          <button
            type="button"
            className={`pocket zero ${result === 0 ? "hit" : ""}`}
            onClick={() => place({ kind: "straight", n: 0 })}
          >
            0
            <WagerMark wagers={wagers} bet={{ kind: "straight", n: 0 }} />
          </button>
          <div className="number-grid">
            {[3, 2, 1].map((start) => (
              <div key={start} className="number-row">
                {Array.from({ length: 12 }, (_, i) => start + i * 3).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`pocket ${wheelColor(n)} ${result === n ? "hit" : ""} ${
                      wagers.some((w) => betHits(w.bet, n) && w.bet.kind === "straight") ? "has-chip" : ""
                    }`}
                    onClick={() => place({ kind: "straight", n })}
                  >
                    {n}
                    <WagerMark wagers={wagers} bet={{ kind: "straight", n }} />
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="column-bets">
            {([1, 2, 3] as const).map((column) => (
              <button key={column} type="button" className="outside" onClick={() => place({ kind: "column", column })}>
                2:1
                <WagerMark wagers={wagers} bet={{ kind: "column", column }} />
              </button>
            ))}
          </div>
        </div>
        <div className="dozen-row">
          {([1, 2, 3] as const).map((dozen) => (
            <button key={dozen} type="button" className="outside" onClick={() => place({ kind: "dozen", dozen })}>
              {dozen === 1 ? "1st 12" : dozen === 2 ? "2nd 12" : "3rd 12"}
              <WagerMark wagers={wagers} bet={{ kind: "dozen", dozen }} />
            </button>
          ))}
        </div>
        <div className="even-row">
          <button type="button" className="outside" onClick={() => place({ kind: "range", range: "low" })}>
            1–18
            <WagerMark wagers={wagers} bet={{ kind: "range", range: "low" }} />
          </button>
          <button type="button" className="outside" onClick={() => place({ kind: "parity", parity: "even" })}>
            Even
            <WagerMark wagers={wagers} bet={{ kind: "parity", parity: "even" }} />
          </button>
          <button type="button" className="outside red" onClick={() => place({ kind: "color", color: "red" })}>
            Red
            <WagerMark wagers={wagers} bet={{ kind: "color", color: "red" }} />
          </button>
          <button type="button" className="outside black" onClick={() => place({ kind: "color", color: "black" })}>
            Black
            <WagerMark wagers={wagers} bet={{ kind: "color", color: "black" }} />
          </button>
          <button type="button" className="outside" onClick={() => place({ kind: "parity", parity: "odd" })}>
            Odd
            <WagerMark wagers={wagers} bet={{ kind: "parity", parity: "odd" }} />
          </button>
          <button type="button" className="outside" onClick={() => place({ kind: "range", range: "high" })}>
            19–36
            <WagerMark wagers={wagers} bet={{ kind: "range", range: "high" }} />
          </button>
        </div>
        <OutcomeBanner text={message} tone={tone} />
        <div className="table-controls">
          <BetRail disabled={spinning} />
          <StakeReadout stake={stake || chip} />
          <div className="action-row">
            <button type="button" className="btn primary" onClick={spin} disabled={spinning || stake === 0}>
              Spin
            </button>
            <button type="button" className="btn" onClick={clearBoard} disabled={spinning || stake === 0}>
              Return bets
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}

function WagerMark({ wagers, bet }: { wagers: RouletteWager[]; bet: RouletteBetKind }) {
  const found = wagers.find((w) => betKey(w.bet) === betKey(bet));
  if (!found) return null;
  return <span className="wager-mark">{found.amount >= 1000 ? `${found.amount / 1000}k` : found.amount}</span>;
}
