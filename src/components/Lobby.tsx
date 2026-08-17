import type { GameId } from "../types";
import { formatChips } from "../lib/format";
import { useCasino } from "../state/casino";

const GAMES: {
  id: GameId;
  name: string;
  kicker: string;
  blurb: string;
  edge: string;
}[] = [
  {
    id: "blackjack",
    name: "Blackjack",
    kicker: "The salon",
    blurb: "Beat the dealer to 21. Naturals pay three-to-two, doubles on the first two cards.",
    edge: "3:2 • stand 17",
  },
  {
    id: "roulette",
    name: "Roulette",
    kicker: "The wheel",
    blurb: "European layout, single zero. Stack outside even-money bets or hunt a straight-up 35:1.",
    edge: "single 0",
  },
  {
    id: "slots",
    name: "Crown Slots",
    kicker: "The cabinet",
    blurb: "Three reels, one payline. Cherries keep you in the spin; three crowns pay a hundredfold.",
    edge: "1 line",
  },
  {
    id: "poker",
    name: "Video Poker",
    kicker: "Jacks or better",
    blurb: "Five-card draw against a 9/6 table. Hold the keepers, discard the rest, chase the royal.",
    edge: "9/6",
  },
  {
    id: "baccarat",
    name: "Baccarat",
    kicker: "The tableau",
    blurb: "Player, banker, or tie. Third-card rules are automatic. Banker wins pay 0.95 after commission.",
    edge: "5% banker",
  },
];

export function Lobby() {
  const { setView, wallet } = useCasino();
  return (
    <div className="lobby">
      <section className="hero">
        <p className="eyebrow">Play-money casino • no deposits</p>
        <h1>
          Fortune, staged
          <em> under a midnight crown.</em>
        </h1>
        <p className="lede">
          Five tables, a chip wallet of {formatChips(wallet.balance)}, and a house that never
          sleeps. Everything here is entertainment chips — no cash in, no cash out.
        </p>
      </section>
      <section className="game-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            className={`game-card game-${game.id}`}
            onClick={() => setView(game.id)}
          >
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
