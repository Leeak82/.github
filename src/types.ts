export type GameId = "blackjack" | "roulette" | "slots" | "poker" | "baccarat";

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface LedgerEntry {
  id: string;
  at: number;
  game: GameId;
  description: string;
  delta: number;
  balance: number;
}

export type View = "lobby" | GameId;
