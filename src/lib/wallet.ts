import type { GameId, LedgerEntry } from "../types";

export const STARTING_BANKROLL = 10_000;
export const HOUSE_MARKER = 5_000;
export const STORAGE_KEY = "midnight-crown-wallet-v1";

export interface WalletState {
  balance: number;
  ledger: LedgerEntry[];
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyWallet(): WalletState {
  return { balance: STARTING_BANKROLL, ledger: [] };
}

export function loadWallet(): WalletState {
  if (typeof localStorage === "undefined") return emptyWallet();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWallet();
    const parsed = JSON.parse(raw) as WalletState;
    if (typeof parsed.balance !== "number" || !Array.isArray(parsed.ledger)) {
      return emptyWallet();
    }
    return parsed;
  } catch {
    return emptyWallet();
  }
}

export function persistWallet(state: WalletState): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function applyDelta(
  state: WalletState,
  game: GameId,
  description: string,
  delta: number,
): WalletState {
  const next: WalletState = {
    balance: state.balance + delta,
    ledger: [
      {
        id: newId(),
        at: Date.now(),
        game,
        description,
        delta,
        balance: state.balance + delta,
      },
      ...state.ledger,
    ].slice(0, 80),
  };
  return next;
}

export function canAfford(state: WalletState, amount: number): boolean {
  return amount > 0 && Number.isInteger(amount) && state.balance >= amount;
}

export function takeHouseMarker(state: WalletState): WalletState {
  return applyDelta(state, "blackjack", "House marker — complimentary chips", HOUSE_MARKER);
}

export function resetWallet(): WalletState {
  return emptyWallet();
}
