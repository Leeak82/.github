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
    kicker: "Cards",
    glyph: "21",
    blurb: "Get closer to 21 than the dealer without going over. Blackjack pays 3 to 2.",
    edge: "3 to 2",
    rules: [
      "Choose a chip size, then press Deal.",
      "Hit adds a card. Stand keeps your total. Double doubles your bet and gives you one extra card.",
      "Face cards are worth 10. Aces are 11 or 1. The dealer stands on 17.",
      "Two-card 21 pays 3 to 2. A tie gives your bet back.",
      "Keys: Enter = Deal, H = Hit, S = Stand, D = Double.",
    ],
  },
  {
    id: "roulette",
    name: "Roulette",
    kicker: "Wheel",
    glyph: "00",
    blurb: "Bet on numbers, colors, or ranges. One zero. A straight number pays 35 to 1.",
    edge: "1 zero",
    rules: [
      "Click a number or an outside bet to place your selected chip. Click again to add more.",
      "A single number pays 35 to 1. Dozens and columns pay 2 to 1. Red, black, even, odd, 1-18, and 19-36 pay 1 to 1.",
      "Zero wins only for a bet on 0. Press Return bets to get your chips back before you spin.",
    ],
  },
  {
    id: "slots",
    name: "Lucky 7 Slots",
    kicker: "Slots",
    glyph: "7",
    blurb: "Five reels, up to 20 paylines, Wilds, and Stars. Set your lines and coin size, then spin.",
    edge: "20 lines",
    rules: [
      "Pick how many lines to play (1 to 20) and a coin size. Total bet is lines times coin.",
      "Wins pay left to right on active lines. Wild substitutes for every symbol except Star.",
      "Three or more Stars anywhere on the screen pay a scatter bonus on the total bet.",
      "Max Bet plays all 20 lines at your current coin size.",
    ],
  },
  {
    id: "poker",
    name: "Video Poker",
    kicker: "Poker",
    glyph: "VP",
    blurb: "Jacks or Better. Deal five cards, hold the ones you want, then draw.",
    edge: "9/6",
    rules: [
      "Press Deal to get five cards.",
      "Click a card to hold it. Press Draw to replace the cards you did not hold.",
      "The lowest paying hand is a pair of jacks, queens, kings, or aces.",
      "Payouts are on the table next to the game.",
    ],
  },
  {
    id: "baccarat",
    name: "Baccarat",
    kicker: "Cards",
    glyph: "P/B",
    blurb: "Bet on Player, Banker, or Tie. Cards are dealt for you. Banker wins pay 0.95 to 1.",
    edge: "5% fee",
    rules: [
      "Choose Player (pays 1 to 1), Banker (pays 0.95 to 1), or Tie (pays 8 to 1), then Deal.",
      "Card values: Ace = 1, 2-9 = face value, 10 and face cards = 0. The hand total is the last digit of the sum.",
      "8 or 9 on the first two cards is a natural and the hand stays. Extra cards follow house rules.",
      "A tie gives Player and Banker bets back.",
    ],
  },
];

export function gameById(id: GameId): GameInfo {
  return GAMES.find((game) => game.id === id)!;
}
