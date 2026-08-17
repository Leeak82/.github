import type { GameId } from "../types";
import { GAMES } from "../lib/catalog";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";

export function Lobby() {
  const { setView, wallet, sfx } = useCasino();
  const hands = wallet.ledger.filter((entry) => entry.delta < 0).length;

  return (
    <div className="lobby">
      <section className="hero">
        <p className="eyebrow">Play-money casino • no deposits</p>
        <h1>
          Fortune, staged
          <em> under a midnight crown.</em>
        </h1>
        <p className="lede">
          Five tables, {formatChips(wallet.balance)} chips in your tray
          {hands ? `, ${hands} stakes on the ledger` : ""}. Pick a table, drop a chip, and play.
          Nothing here cashes out.
        </p>
        <ol className="how-strip">
          <li>Choose a table</li>
          <li>Select a chip you can afford</li>
          <li>Deal, spin, or draw</li>
          <li>Open the tray for history</li>
        </ol>
      </section>
      <section className="game-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            className={`game-card game-${game.id}`}
            onClick={() => {
              sfx("click");
              setView(game.id as GameId);
            }}
          >
            <span className="game-glyph" aria-hidden="true">
              {game.glyph}
            </span>
            <span className="kicker">{game.kicker}</span>
            <strong>{game.name}</strong>
            <p>{game.blurb}</p>
            <span className="edge">{game.edge}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
