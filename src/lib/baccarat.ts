import type { Card } from "../types";
import { baccaratRankValue, draw } from "./cards";

export type BaccaratWinner = "player" | "banker" | "tie";
export type BaccaratSide = BaccaratWinner;

export interface BaccaratRound {
  player: Card[];
  banker: Card[];
  playerTotal: number;
  bankerTotal: number;
  winner: BaccaratWinner;
}

export function baccaratTotal(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + baccaratRankValue(card.rank), 0) % 10;
}

function isNatural(total: number, cards: Card[]): boolean {
  return cards.length === 2 && (total === 8 || total === 9);
}

function bankerDrawsOnPlayerThird(bankerTotal: number, playerThird: number): boolean {
  if (bankerTotal <= 2) return true;
  if (bankerTotal === 3) return playerThird !== 8;
  if (bankerTotal === 4) return playerThird >= 2 && playerThird <= 7;
  if (bankerTotal === 5) return playerThird >= 4 && playerThird <= 7;
  if (bankerTotal === 6) return playerThird === 6 || playerThird === 7;
  return false;
}

export function playBaccarat(shoe: Card[]): { round: BaccaratRound; shoe: Card[] } {
  let next = shoe;
  const take = (): Card => {
    const drawn = draw(next);
    next = drawn.shoe;
    return drawn.card;
  };

  const player = [take()];
  const banker = [take()];
  player.push(take());
  banker.push(take());
  let playerTotal = baccaratTotal(player);
  let bankerTotal = baccaratTotal(banker);

  if (!isNatural(playerTotal, player) && !isNatural(bankerTotal, banker)) {
    let playerThird: Card | undefined;
    if (playerTotal <= 5) {
      playerThird = take();
      player.push(playerThird);
      playerTotal = baccaratTotal(player);
    }

    const playerStood = !playerThird;
    if (playerStood) {
      if (bankerTotal <= 5) {
        banker.push(take());
        bankerTotal = baccaratTotal(banker);
      }
    } else if (
      playerThird &&
      bankerDrawsOnPlayerThird(bankerTotal, baccaratRankValue(playerThird.rank))
    ) {
      banker.push(take());
      bankerTotal = baccaratTotal(banker);
    }
  }

  let winner: BaccaratWinner = "tie";
  if (playerTotal > bankerTotal) winner = "player";
  else if (bankerTotal > playerTotal) winner = "banker";

  return {
    shoe: next,
    round: { player, banker, playerTotal, bankerTotal, winner },
  };
}

export function baccaratPayout(side: BaccaratSide, bet: number, winner: BaccaratWinner): number {
  if (winner === "tie") {
    if (side === "tie") return bet + bet * 8;
    return bet;
  }
  if (side !== winner) return 0;
  if (side === "banker") return bet + Math.floor(bet * 0.95);
  return bet * 2;
}
