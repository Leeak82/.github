import { describe, expect, it } from "vitest";
import { createRng } from "./rng";
import {
  baccaratRankValue,
  blackjackRankValue,
  buildShoe,
  draw,
  formatCard,
  isRed,
  rankValue,
  shuffle,
} from "./cards";
import { dealRound, doubleDown, handValue, hit, isBlackjack, stand } from "./blackjack";
import { betHits, settleRoulette, wheelColor } from "./roulette";
import { settleSlots, slotsPayout } from "./slots";
import { evaluatePoker } from "./poker";
import { baccaratPayout, baccaratTotal, playBaccarat } from "./baccarat";
import { applyDelta, canAfford, emptyWallet, HOUSE_MARKER, takeHouseMarker } from "./wallet";
import type { Card } from "../types";

const c = (rank: Card["rank"], suit: Card["suit"]): Card => ({ rank, suit });

describe("cards", () => {
  it("values ranks for each game family", () => {
    expect(rankValue("A")).toBe(14);
    expect(blackjackRankValue("K")).toBe(10);
    expect(blackjackRankValue("A")).toBe(11);
    expect(baccaratRankValue("K")).toBe(0);
    expect(baccaratRankValue("A")).toBe(1);
    expect(isRed("hearts")).toBe(true);
    expect(formatCard(c("Q", "spades"))).toBe("Q♠");
  });

  it("shuffles deterministically with a seed", () => {
    const a = shuffle([1, 2, 3, 4, 5], createRng(7));
    const b = shuffle([1, 2, 3, 4, 5], createRng(7));
    expect(a).toEqual(b);
    expect(a).not.toEqual([1, 2, 3, 4, 5]);
  });
});

describe("blackjack", () => {
  it("counts a soft ace and then hardens it", () => {
    expect(handValue([c("A", "spades"), c("7", "hearts")])).toEqual({
      total: 18,
      soft: true,
    });
    expect(handValue([c("A", "spades"), c("7", "hearts"), c("8", "clubs")])).toEqual({
      total: 16,
      soft: false,
    });
  });

  it("pays 3:2 on player blackjack", () => {
    const shoe = [
      c("A", "spades"),
      c("9", "hearts"),
      c("K", "diamonds"),
      c("5", "clubs"),
    ];
    const round = dealRound(shoe, 100);
    expect(isBlackjack(round.player)).toBe(true);
    expect(round.outcome).toBe("blackjack");
    expect(round.payout).toBe(250);
  });

  it("pushes when both have blackjack", () => {
    const shoe = [
      c("A", "spades"),
      c("A", "hearts"),
      c("K", "diamonds"),
      c("Q", "clubs"),
    ];
    const round = dealRound(shoe, 50);
    expect(round.outcome).toBe("push");
    expect(round.payout).toBe(50);
  });

  it("busts a hit over 21", () => {
    let round = dealRound(
      [c("K", "spades"), c("9", "hearts"), c("9", "diamonds"), c("7", "clubs"), c("8", "spades")],
      25,
    );
    round = hit(round);
    expect(round.outcome).toBe("lose");
    expect(round.phase).toBe("settled");
  });

  it("lets the dealer draw to 17 and awards a win", () => {
    const shoe = [
      c("10", "spades"),
      c("6", "hearts"),
      c("9", "diamonds"),
      c("5", "clubs"),
      c("7", "spades"),
    ];
    let round = dealRound(shoe, 40);
    round = stand(round);
    expect(round.dealer.length).toBe(3);
    expect(handValue(round.dealer).total).toBe(18);
    expect(round.outcome).toBe("win");
    expect(round.payout).toBe(80);
  });

  it("doubles the stake and draws one card", () => {
    const shoe = [
      c("5", "spades"),
      c("10", "hearts"),
      c("6", "diamonds"),
      c("7", "clubs"),
      c("10", "spades"),
    ];
    let round = dealRound(shoe, 20);
    round = doubleDown(round);
    expect(round.doubled).toBe(true);
    expect(round.bet).toBe(40);
    expect(round.player).toHaveLength(3);
    expect(round.phase).toBe("settled");
    expect(round.outcome).toBe("win");
  });
});

describe("roulette", () => {
  it("treats zero as green and a loser for even-money bets", () => {
    expect(wheelColor(0)).toBe("green");
    expect(betHits({ kind: "color", color: "red" }, 0)).toBe(false);
    expect(betHits({ kind: "parity", parity: "even" }, 0)).toBe(false);
    expect(betHits({ kind: "straight", n: 0 }, 0)).toBe(true);
  });

  it("pays columns, dozens, and a straight", () => {
    expect(betHits({ kind: "column", column: 1 }, 34)).toBe(true);
    expect(betHits({ kind: "column", column: 3 }, 36)).toBe(true);
    expect(betHits({ kind: "dozen", dozen: 2 }, 24)).toBe(true);
    const { returned, net } = settleRoulette(
      [
        { bet: { kind: "straight", n: 17 }, amount: 10 },
        { bet: { kind: "color", color: "black" }, amount: 20 },
      ],
      17,
    );
    expect(returned).toBe(10 + 350 + 40);
    expect(net).toBe(370);
  });
});

describe("slots", () => {
  it("pays three crowns and cherry leftovers", () => {
    expect(slotsPayout(["crown", "crown", "crown"]).multiplier).toBe(100);
    expect(slotsPayout(["cherry", "lemon", "cherry"]).multiplier).toBe(2);
    expect(slotsPayout(["bell", "bar", "seven"]).multiplier).toBe(0);
    expect(settleSlots(["seven", "seven", "seven"], 5).returned).toBe(250);
  });
});

describe("video poker", () => {
  it("detects royal, wheel straight, and jacks or better", () => {
    const royal = evaluatePoker([
      c("A", "hearts"),
      c("K", "hearts"),
      c("Q", "hearts"),
      c("J", "hearts"),
      c("10", "hearts"),
    ]);
    expect(royal.rank).toBe("royal-flush");
    expect(royal.multiplier).toBe(800);

    const wheel = evaluatePoker([
      c("A", "spades"),
      c("2", "hearts"),
      c("3", "diamonds"),
      c("4", "clubs"),
      c("5", "spades"),
    ]);
    expect(wheel.rank).toBe("straight");

    const jacks = evaluatePoker([
      c("J", "spades"),
      c("J", "hearts"),
      c("2", "diamonds"),
      c("9", "clubs"),
      c("4", "spades"),
    ]);
    expect(jacks.rank).toBe("jacks");

    const lowPair = evaluatePoker([
      c("10", "spades"),
      c("10", "hearts"),
      c("2", "diamonds"),
      c("9", "clubs"),
      c("4", "spades"),
    ]);
    expect(lowPair.rank).toBe("nothing");
  });
});

describe("baccarat", () => {
  it("stands on a natural and pays banker with commission", () => {
    const { round } = playBaccarat([
      c("8", "spades"),
      c("9", "hearts"),
      c("K", "diamonds"),
      c("Q", "clubs"),
    ]);
    expect(round.playerTotal).toBe(8);
    expect(round.bankerTotal).toBe(9);
    expect(round.winner).toBe("banker");
    expect(round.player).toHaveLength(2);
    expect(baccaratPayout("banker", 100, "banker")).toBe(195);
    expect(baccaratPayout("player", 100, "banker")).toBe(0);
    expect(baccaratPayout("player", 100, "tie")).toBe(100);
    expect(baccaratPayout("tie", 25, "tie")).toBe(225);
  });

  it("applies the third-card tableau", () => {
    const { round } = playBaccarat([
      c("2", "spades"),
      c("4", "hearts"),
      c("3", "diamonds"),
      c("2", "clubs"),
      c("6", "spades"),
      c("7", "hearts"),
    ]);
    expect(round.player).toHaveLength(3);
    expect(round.banker).toHaveLength(3);
    expect(baccaratTotal(round.player)).toBe(round.playerTotal);
  });
});

describe("wallet", () => {
  it("rejects unaffordable stakes and records a house marker", () => {
    const broke = { balance: 40, ledger: [] };
    expect(canAfford(broke, 50)).toBe(false);
    const next = applyDelta(emptyWallet(), "slots", "win", 120);
    expect(next.balance).toBe(10120);
    expect(takeHouseMarker(broke).balance).toBe(40 + HOUSE_MARKER);
  });
});

describe("shoe draw", () => {
  it("deals from the front of a built shoe", () => {
    const shoe = buildShoe(1, createRng(3));
    const first = draw(shoe);
    expect(first.shoe).toHaveLength(51);
    expect(first.card).toEqual(shoe[0]);
  });
});
