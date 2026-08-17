import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COIN_OPTIONS,
  LINE_OPTIONS,
  PAYLINES,
  SLOT_PAYTABLE,
  evaluateGrid,
  spinGrid,
  totalBet,
  type SlotGrid,
  type SlotSymbol,
} from "../lib/slots";
import { cryptoRng } from "../lib/rng";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";
import { OutcomeBanner, Paytable, TableMeta } from "./ui";
import { ReelColumn } from "./ReelColumn";

const START_GRID: SlotGrid = [
  ["seven", "bar", "wild", "bell", "cherry"],
  ["wild", "seven", "scatter", "bar", "seven"],
  ["grape", "lemon", "plum", "bell", "bar"],
];

const JACKPOT_KEY = "midnight-crown-jackpot";

function loadJackpot(): number {
  if (typeof localStorage === "undefined") return 555_555;
  const raw = Number(localStorage.getItem(JACKPOT_KEY));
  return Number.isFinite(raw) && raw >= 1000 ? raw : 555_555;
}

function saveJackpot(value: number) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(JACKPOT_KEY, String(Math.floor(value)));
}

function column(grid: SlotGrid, col: number): SlotSymbol[] {
  return [grid[0][col], grid[1][col], grid[2][col]];
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
  const [landing, setLanding] = useState<SlotGrid | null>(null);
  const [lines, setLines] = useState(20);
  const [coin, setCoin] = useState(5);
  const [spinning, setSpinning] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [jackpot, setJackpot] = useState(loadJackpot);
  const [message, setMessage] = useState("Set lines and coin size, then spin.");
  const [hotCells, setHotCells] = useState<Set<string>>(new Set());
  const stopped = useRef(0);
  const landingRef = useRef<SlotGrid | null>(null);
  const betRef = useRef({ lines, coin });
  const stake = totalBet(lines, coin);
  const canSpin = !spinning && wallet.balance >= stake && stake > 0;
  const tone = message.includes("paid") ? "win" : message.includes("No win") ? "lose" : "idle";

  landingRef.current = landing;
  betRef.current = { lines, coin };

  const finishSpin = useCallback(() => {
    stopped.current += 1;
    sfx("reel");
    if (stopped.current < 5) return;
    const final = landingRef.current;
    const bet = betRef.current;
    stopped.current = 0;
    if (!final) {
      setSpinning(false);
      return;
    }
    setGrid(final);
    setLanding(null);
    const result = evaluateGrid(final, bet.lines, bet.coin);
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
  }, [payout, sfx]);

  function spin(nextLines = lines, nextCoin = coin) {
    if (spinning) return;
    const cost = totalBet(nextLines, nextCoin);
    if (!spend("slots", `Slots ${nextLines} lines x ${nextCoin}`, cost)) {
      setMessage("Not enough chips for that bet. Lower the lines or coin size.");
      sfx("lose");
      setAutoplay(false);
      return;
    }
    setLines(nextLines);
    setCoin(nextCoin);
    betRef.current = { lines: nextLines, coin: nextCoin };
    setSpinning(true);
    setHotCells(new Set());
    setMessage("Good luck.");
    sfx("spin");
    const grown = jackpot + Math.max(1, Math.floor(cost * 0.05));
    setJackpot(grown);
    saveJackpot(grown);
    stopped.current = 0;
    setLanding(spinGrid(cryptoRng()));
  }

  useEffect(() => {
    if (!autoplay || spinning) return;
    if (wallet.balance < totalBet(lines, coin)) {
      setAutoplay(false);
      setMessage("Autoplay stopped. Not enough chips.");
      return;
    }
    const id = window.setTimeout(() => spin(), 650);
    return () => window.clearTimeout(id);
  }, [autoplay, spinning, wallet.balance, lines, coin]);

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
          <p className="jackpot">Jackpot {formatChips(jackpot)}</p>
          <div className="reels" aria-label="Slot reels">
            {[0, 1, 2, 3, 4].map((col) => (
              <ReelColumn
                key={col}
                index={col}
                visible={column(grid, col)}
                landing={landing ? column(landing, col) : null}
                hotRows={[0, 1, 2].map((row) => hotCells.has(`${row}-${col}`))}
                onStopped={finishSpin}
              />
            ))}
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
            <label className="autoplay">
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(event) => setAutoplay(event.target.checked)}
                disabled={spinning && !autoplay}
              />
              Autoplay
            </label>
          </div>
          <p className="muted slot-credit">
            Reel spin uses the same Web Animations approach as johakr/html5-slot-machine (MIT).
          </p>
        </div>
      </div>
      <Paytable rows={paytableRows} />
    </div>
  );
}
