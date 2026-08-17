import type { GameId } from "../types";

export interface GameInfo {
  id: GameId;
  name: string;
  kicker: string;
  blurb: string;
  edge: string;
  glyph: string;
  rules: string[];
}

export const GAMES: GameInfo[] = [
  {
    id: "blackjack",
    name: "Blackjack",
    kicker: "The salon",
    glyph: "A♠",
    blurb: "Beat the dealer to 21. Naturals pay three-to-two. Double on your first two cards.",
    edge: "3:2 • stand 17",
    rules: [
      "Pick a chip, then Deal. Hit to take a card, Stand to hold, Double to double the stake and take one card.",
      "Face cards are 10. Aces count 11 or 1. Dealer stands on 17, including soft 17.",
      "A two-card 21 pays 3:2. A matching total is a push and returns your stake.",
      "Keyboard: Enter deals, H hits, S stands, D doubles.",
    ],
  },
  {
    id: "roulette",
    name: "Roulette",
    kicker: "The wheel",
    glyph: "0",
    blurb: "European layout, single zero. Stack outside even-money bets or hunt a straight-up 35:1.",
    edge: "single 0",
    rules: [
      "Click a pocket or outside box to drop your selected chip. Click again to add another chip.",
      "Straight-up numbers pay 35:1. Dozens and columns pay 2:1. Red/black, even/odd, and high/low pay 1:1.",
      "Zero is green. Even-money and dozen/column bets lose on 0. Return bets before you spin to get the stake back.",
    ],
  },
  {
    id: "slots",
    name: "Crown Slots",
    kicker: "The cabinet",
    glyph: "7",
    blurb: "Three reels, one payline. Cherries keep you in the spin; three crowns pay a hundredfold.",
    edge: "1 line",
    rules: [
      "Choose a chip and press Spin. Only the center line pays.",
      "Three matching symbols pay the posted multiple. One or two cherries still pay a little.",
      "Three crowns are the jackpot line at 100×.",
    ],
  },
  {
    id: "poker",
    name: "Video Poker",
    kicker: "Jacks or better",
    glyph: "♥",
    blurb: "Five-card draw against a 9/6 table. Hold the keepers, discard the rest, chase the royal.",
    edge: "9/6",
    rules: [
      "Deal five cards. Click any card to hold it, then Draw to replace the rest.",
      "A pair of jacks, queens, kings, or aces is the lowest paying hand.",
      "Payouts follow the 9/6 Jacks or Better table shown beside the machine.",
    ],
  },
  {
    id: "baccarat",
    name: "Baccarat",
    kicker: "The tableau",
    glyph: "P/B",
    blurb: "Player, banker, or tie. Third-card rules are automatic. Banker wins pay 0.95 after commission.",
    edge: "5% banker",
    rules: [
      "Choose Player (1:1), Banker (0.95:1 after 5% commission), or Tie (8:1), then Deal.",
      "Hands count modulo 10. Eights and nines on two cards are naturals and stand.",
      "Third cards follow the standard punto banco tableau. A tie returns Player and Banker stakes.",
    ],
  },
];

export function gameById(id: GameId): GameInfo {
  return GAMES.find((game) => game.id === id)!;
}
