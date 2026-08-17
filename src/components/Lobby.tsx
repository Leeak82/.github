import { GAMES } from "../lib/catalog";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";

export function Lobby() {
  const { setView, wallet, sfx } = useCasino();
  const hands = wallet.ledger.filter((entry) => entry.delta < 0).length;

  return (
    <div className="lobby">
      <section className="hero">
        <p className="eyebrow">Free play. No deposits.</p>
        <h1>Pick a game and play.</h1>
        <p className="lede">
          You have {formatChips(wallet.balance)} chips
          {hands ? ` and ${hands} bets on your history` : ""}. Choose blackjack, roulette, slots,
          video poker, or baccarat. Chips stay in this browser and cannot be cashed out.
        </p>
        <ol className="how-strip">
          <li>Choose a game</li>
          <li>Set your bet</li>
          <li>Deal or spin</li>
          <li>Open Chips for history</li>
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
              setView(game.id);
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
