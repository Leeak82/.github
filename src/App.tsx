import { useState } from "react";
import { CasinoProvider, useCasino } from "./state/casino";
import { formatChips, signedChips } from "./lib/format";
import { Lobby } from "./components/Lobby";
import { BlackjackTable } from "./components/BlackjackTable";
import { RouletteTable } from "./components/RouletteTable";
import { SlotsCabinet } from "./components/SlotsCabinet";
import { VideoPoker } from "./components/VideoPoker";
import { BaccaratTable } from "./components/BaccaratTable";
import type { GameId } from "./types";

const TITLES: Record<GameId, string> = {
  blackjack: "Blackjack",
  roulette: "Roulette",
  slots: "Crown Slots",
  poker: "Video Poker",
  baccarat: "Baccarat",
};

function Shell() {
  const { view, setView, wallet, marker, reset } = useCasino();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const broke = wallet.balance < 25;

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
        {view !== "lobby" ? (
          <nav className="crumbs">
            <button type="button" onClick={() => setView("lobby")}>
              Lobby
            </button>
            <span>/</span>
            <strong>{TITLES[view]}</strong>
          </nav>
        ) : (
          <p className="welcome">Five tables. One bankroll. The house is already seated.</p>
        )}
        <div className="tray">
          <button type="button" className="balance" onClick={() => setLedgerOpen((v) => !v)}>
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
        <aside className="ledger" aria-label="Chip ledger">
          <div className="ledger-head">
            <h2>Ledger</h2>
            <button type="button" className="btn compact" onClick={reset}>
              Reset bankroll
            </button>
          </div>
          {wallet.ledger.length === 0 ? (
            <p className="muted">No hands recorded yet.</p>
          ) : (
            <ol>
              {wallet.ledger.map((entry) => (
                <li key={entry.id}>
                  <span>
                    <strong>{entry.game}</strong>
                    <em>{entry.description}</em>
                  </span>
                  <b className={entry.delta >= 0 ? "up" : "down"}>{signedChips(entry.delta)}</b>
                </li>
              ))}
            </ol>
          )}
        </aside>
      ) : null}
      <footer>
        Midnight Crown is a demonstration casino. Chips have no cash value. Intended for adults 18+.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CasinoProvider>
      <Shell />
    </CasinoProvider>
  );
}
