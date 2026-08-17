import { useEffect, useMemo, useRef, useState } from "react";
import {
  COIN_OPTIONS,
  LINE_OPTIONS,
  PAYLINES,
  SLOT_PAYTABLE,
  evaluateGrid,
  pickSymbol,
  spinGrid,
  totalBet,
  type SlotGrid,
} from "../lib/slots";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";
import { OutcomeBanner, Paytable, TableMeta } from "./ui";
import { SlotGlyph } from "./SlotGlyph";

const START_GRID: SlotGrid = [
  ["seven", "bar", "wild", "bell", "cherry"],
  ["wild", "seven", "scatter", "bar", "seven"],
  ["grape", "lemon", "plum", "bell", "bar"],
];

function randomGrid(): SlotGrid {
  return [0, 1, 2].map(() => [0, 1, 2, 3, 4].map(() => pickSymbol(cryptoRng())));
}

function winningCells(grid: SlotGrid, lineNumbers: number[], includeScatter: boolean): Set<string> {
  const lit = new Set<string>();
  for (const line of lineNumbers) {
    PAYLINES[line - 1].forEach((row, col) => lit.add(`${row}-${col}`));
  }
  if (includeScatter) {
    grid.forEach((row, r) => {
      row.forEach((symbol, c) => {
        if (symbol === "scatter") lit.add(`${r}-${c}`);
      });
    });
  }
  return lit;
}

export function SlotsCabinet() {
  const { wallet, spend, payout, sfx } = useCasino();
  const [grid, setGrid] = useState<SlotGrid>(START_GRID);
  const [lines, setLines] = useState(20);
  const [coin, setCoin] = useState(5);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Set lines and coin size, then spin.");
  const [hotCells, setHotCells] = useState<Set<string>>(new Set());
  const timers = useRef<number[]>([]);
  const stake = totalBet(lines, coin);
  const canSpin = !spinning && wallet.balance >= stake && stake > 0;
  const tone = message.includes("paid") ? "win" : message.includes("No win") ? "lose" : "idle";

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
    };
  }, []);

  function clearTimers() {
    timers.current.forEach((id) => {
      window.clearTimeout(id);
      window.clearInterval(id);
    });
    timers.current = [];
  }

  function spin(nextLines = lines, nextCoin = coin) {
    if (spinning) return;
    const cost = totalBet(nextLines, nextCoin);
    if (!spend("slots", `Slots ${nextLines} lines x ${nextCoin}`, cost)) {
      setMessage("Not enough chips for that bet. Lower the lines or coin size.");
      sfx("lose");
      return;
    }
    setLines(nextLines);
    setCoin(nextCoin);
    setSpinning(true);
    setHotCells(new Set());
    setMessage("Good luck.");
    sfx("spin");
    const final = spinGrid(cryptoRng());
    clearTimers();
    const tick = window.setInterval(() => setGrid(randomGrid()), 70);
    timers.current = [tick];
    [0, 1, 2, 3, 4].forEach((col) => {
      timers.current.push(
        window.setTimeout(() => {
          sfx("reel");
          setGrid((current) =>
            current.map((row, r) => row.map((symbol, c) => (c === col ? final[r][col] : symbol))),
          );
        }, 500 + col * 220),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        clearTimers();
        setGrid(final);
        const result = evaluateGrid(final, nextLines, nextCoin);
        setHotCells(
          winningCells(
            final,
            result.wins.map((win) => win.line),
            result.scatterPay > 0,
          ),
        );
        if (result.returned > 0) {
          payout("slots", result.label, result.returned);
          setMessage(`${result.label} - paid ${formatChips(result.returned)}`);
        } else {
          sfx("lose");
          setMessage("No win. Spin again.");
        }
        setSpinning(false);
      }, 1700),
    );
  }

  const paytableRows = useMemo(
    () => [
      { match: "Coin size", payout: String(coin) },
      { match: "Lines", payout: String(lines) },
      { match: "Total bet", payout: formatChips(stake) },
      ...SLOT_PAYTABLE,
    ],
    [coin, lines, stake],
  );

  return (
    <div className="table-wrap slots-wrap">
      <div>
        <TableMeta game="slots" extra={`${lines} lines, coin ${coin}`} />
        <div className="cabinet">
          <div className="marquee-lights" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <div className="cabinet-marquee">LUCKY 7</div>
          <div className={`reel-grid ${spinning ? "spinning" : ""}`}>
            {grid.map((row, r) =>
              row.map((symbol, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`reel-cell ${hotCells.has(`${r}-${c}`) ? "hot" : ""}`}
                >
                  <SlotGlyph symbol={symbol} />
                </div>
              )),
            )}
          </div>
          <OutcomeBanner text={message} tone={tone} />
          <div className="slot-options">
            <fieldset disabled={spinning}>
              <legend>Paylines</legend>
              <div className="option-row">
                {LINE_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={lines === value ? "selected" : ""}
                    onClick={() => setLines(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset disabled={spinning}>
              <legend>Coin</legend>
              <div className="option-row">
                {COIN_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={coin === value ? "selected" : ""}
                    onClick={() => setCoin(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <p className="stake-readout">
            Total bet <strong>{formatChips(stake)}</strong>
          </p>
          <div className="action-row">
            <button type="button" className="btn primary" onClick={() => spin()} disabled={!canSpin}>
              {spinning ? "Spinning..." : "Spin"}
            </button>
            <button
              type="button"
              className="btn gold"
              onClick={() => spin(20, coin)}
              disabled={spinning || wallet.balance < totalBet(20, coin)}
            >
              Max bet
            </button>
          </div>
        </div>
      </div>
      <Paytable rows={paytableRows} />
    </div>
  );
}
