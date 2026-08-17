import type { Card } from "../types";
import { blackjackRankValue, draw } from "./cards";

export type BlackjackOutcome = "win" | "lose" | "push" | "blackjack";
export type BlackjackPhase = "betting" | "player" | "dealer" | "settled";

export interface BlackjackHandValue {
  total: number;
  soft: boolean;
}

export interface BlackjackRound {
  shoe: Card[];
  player: Card[];
  dealer: Card[];
  bet: number;
  doubled: boolean;
  phase: BlackjackPhase;
  outcome?: BlackjackOutcome;
  payout?: number;
  hideHole: boolean;
}

export function handValue(cards: Card[]): BlackjackHandValue {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += blackjackRankValue(card.rank);
    if (card.rank === "A") aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 && total <= 21 };
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function dealRound(shoe: Card[], bet: number): BlackjackRound {
  let next = shoe;
  const player: Card[] = [];
  const dealer: Card[] = [];
  for (let i = 0; i < 2; i += 1) {
    let drawn = draw(next);
    player.push(drawn.card);
    next = drawn.shoe;
    drawn = draw(next);
    dealer.push(drawn.card);
    next = drawn.shoe;
  }

  const playerBj = isBlackjack(player);
  const dealerBj = isBlackjack(dealer);

  if (playerBj || dealerBj) {
    let outcome: BlackjackOutcome;
    let payout = 0;
    if (playerBj && dealerBj) {
      outcome = "push";
      payout = bet;
    } else if (playerBj) {
      outcome = "blackjack";
      payout = bet + Math.floor(bet * 1.5);
    } else {
      outcome = "lose";
      payout = 0;
    }
    return {
      shoe: next,
      player,
      dealer,
      bet,
      doubled: false,
      phase: "settled",
      outcome,
      payout,
      hideHole: false,
    };
  }

  return {
    shoe: next,
    player,
    dealer,
    bet,
    doubled: false,
    phase: "player",
    hideHole: true,
  };
}

export function hit(round: BlackjackRound): BlackjackRound {
  if (round.phase !== "player") return round;
  const drawn = draw(round.shoe);
  const player = [...round.player, drawn.card];
  const value = handValue(player);
  if (value.total > 21) {
    return {
      ...round,
      shoe: drawn.shoe,
      player,
      phase: "settled",
      outcome: "lose",
      payout: 0,
      hideHole: false,
    };
  }
  return { ...round, shoe: drawn.shoe, player };
}

export function stand(round: BlackjackRound): BlackjackRound {
  if (round.phase !== "player") return round;
  return settleDealer({ ...round, hideHole: false, phase: "dealer" });
}

export function doubleDown(round: BlackjackRound): BlackjackRound {
  if (round.phase !== "player" || round.player.length !== 2 || round.doubled) {
    return round;
  }
  const drawn = draw(round.shoe);
  const player = [...round.player, drawn.card];
  const next: BlackjackRound = {
    ...round,
    shoe: drawn.shoe,
    player,
    bet: round.bet * 2,
    doubled: true,
    hideHole: false,
    phase: "dealer",
  };
  if (handValue(player).total > 21) {
    return { ...next, phase: "settled", outcome: "lose", payout: 0 };
  }
  return settleDealer(next);
}

function settleDealer(round: BlackjackRound): BlackjackRound {
  let shoe = round.shoe;
  const dealer = [...round.dealer];
  while (handValue(dealer).total < 17) {
    const drawn = draw(shoe);
    dealer.push(drawn.card);
    shoe = drawn.shoe;
  }
  const playerTotal = handValue(round.player).total;
  const dealerTotal = handValue(dealer).total;
  let outcome: BlackjackOutcome;
  let payout = 0;
  if (playerTotal > 21) {
    outcome = "lose";
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    outcome = "win";
    payout = round.bet * 2;
  } else if (playerTotal === dealerTotal) {
    outcome = "push";
    payout = round.bet;
  } else {
    outcome = "lose";
  }
  return {
    ...round,
    shoe,
    dealer,
    phase: "settled",
    outcome,
    payout,
    hideHole: false,
  };
}

export function outcomeLabel(outcome: BlackjackOutcome): string {
  switch (outcome) {
    case "blackjack":
      return "Blackjack 3 to 2";
    case "win":
      return "You win";
    case "push":
      return "Push";
    case "lose":
      return "House takes the pot";
  }
}
