import { useEffect, useRef, useState } from "react";
import { CasinoProvider, useCasino } from "./state/casino";
import { formatChips, signedChips } from "./lib/format";
import { GAMES } from "./lib/catalog";
import { unlockAudio } from "./lib/sound";
import { Lobby } from "./components/Lobby";
import { BlackjackTable } from "./components/BlackjackTable";
import { RouletteTable } from "./components/RouletteTable";
import { SlotsCabinet } from "./components/SlotsCabinet";
import { VideoPoker } from "./components/VideoPoker";
import { BaccaratTable } from "./components/BaccaratTable";
import type { GameId, View } from "./types";

const GATE_KEY = "midnight-crown-entered";

const TITLES: Record<GameId, string> = {
  blackjack: "Blackjack",
  roulette: "Roulette",
  slots: "Crown Slots",
  poker: "Video Poker",
  baccarat: "Baccarat",
};

function Gate({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="gate">
      <div className="gate-card">
        <p className="eyebrow">Midnight Crown</p>
        <h1>The floor is open.</h1>
        <p>
          This is a play-money casino. Chips never convert to cash. There are no deposits and no
          withdrawals. You must be 18 or older to enter.
        </p>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            unlockAudio();
            onEnter();
          }}
        >
          Enter the floor
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const { view, setView, wallet, marker, reset, muted, toggleMute } = useCasino();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const broke = wallet.balance < 25;

  const firstBalance = useRef(true);
  useEffect(() => {
    if (firstBalance.current) {
      firstBalance.current = false;
      return;
    }
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), 420);
    return () => window.clearTimeout(id);
  }, [wallet.balance]);

  return (
    <div className="shell">
      <div className="atmosphere" aria-hidden="true" />
      <header className="topbar">
        <button type="button" className="brand" onClick={() => setView("lobby")}>
          <span className="crown">♛</span>
          <span>
            Midnight Crown
            <small>Play-money casino</small>
          </span>
        </button>
        <nav className="floor-nav" aria-label="Tables">
          <NavTab id="lobby" current={view} onSelect={setView} label="Lobby" />
          {GAMES.map((game) => (
            <NavTab
              key={game.id}
              id={game.id}
              current={view}
              onSelect={setView}
              label={game.name}
            />
          ))}
        </nav>
        <div className="tray">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "Mute" : "Sound"}
          </button>
          <button
            type="button"
            className={`balance ${flash ? "flash" : ""}`}
            onClick={() => setLedgerOpen((open) => !open)}
            aria-expanded={ledgerOpen}
          >
            <small>Chips</small>
            <strong>{formatChips(wallet.balance)}</strong>
          </button>
          {broke ? (
            <button type="button" className="btn gold compact" onClick={marker}>
              House marker
            </button>
          ) : null}
        </div>
      </header>
      <main>
        {view === "lobby" && <Lobby />}
        {view === "blackjack" && <BlackjackTable />}
        {view === "roulette" && <RouletteTable />}
        {view === "slots" && <SlotsCabinet />}
        {view === "poker" && <VideoPoker />}
        {view === "baccarat" && <BaccaratTable />}
      </main>
      {ledgerOpen ? (
        <div className="ledger-layer" onClick={() => setLedgerOpen(false)}>
          <aside
            className="ledger"
            aria-label="Chip ledger"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ledger-head">
              <h2>Ledger</h2>
              <div className="ledger-actions">
                <button type="button" className="btn compact" onClick={reset}>
                  Reset bankroll
                </button>
                <button type="button" className="btn compact" onClick={() => setLedgerOpen(false)}>
                  Close
                </button>
              </div>
            </div>
            {wallet.ledger.length === 0 ? (
              <p className="muted">No hands recorded yet. Place a stake on any table.</p>
            ) : (
              <ol>
                {wallet.ledger.map((entry) => (
                  <li key={entry.id}>
                    <span>
                      <strong>
                        {entry.description.startsWith("House marker") ? "Cage" : TITLES[entry.game]}
                      </strong>
                      <em>{entry.description}</em>
                    </span>
                    <b className={entry.delta >= 0 ? "up" : "down"}>{signedChips(entry.delta)}</b>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      ) : null}
      <footer>
        Midnight Crown is a demonstration casino. Chips have no cash value. Intended for adults 18+.
        {view !== "lobby" ? ` • ${TITLES[view]}` : ""}
      </footer>
    </div>
  );
}

function NavTab({
  id,
  current,
  onSelect,
  label,
}: {
  id: View;
  current: View;
  onSelect: (view: View) => void;
  label: string;
}) {
  return (
    <button type="button" className={current === id ? "active" : ""} onClick={() => onSelect(id)}>
      {label}
    </button>
  );
}

export default function App() {
  const [entered, setEntered] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(GATE_KEY) === "1";
  });

  if (!entered) {
    return (
      <Gate
        onEnter={() => {
          localStorage.setItem(GATE_KEY, "1");
          setEntered(true);
        }}
      />
    );
  }

  return (
    <CasinoProvider>
      <Shell />
    </CasinoProvider>
  );
}
