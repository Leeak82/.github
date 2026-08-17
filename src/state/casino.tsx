import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GameId, View } from "../types";
import {
  applyDelta,
  canAfford,
  loadWallet,
  persistWallet,
  resetWallet,
  takeHouseMarker,
  type WalletState,
} from "../lib/wallet";

export const CHIP_VALUES = [25, 100, 500, 1000, 2500] as const;

interface CasinoContextValue {
  view: View;
  setView: (view: View) => void;
  chip: number;
  setChip: (value: number) => void;
  wallet: WalletState;
  spend: (game: GameId, description: string, amount: number) => boolean;
  payout: (game: GameId, description: string, amount: number) => void;
  marker: () => void;
  reset: () => void;
}

const CasinoContext = createContext<CasinoContextValue | null>(null);

export function CasinoProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("lobby");
  const [chip, setChip] = useState(100);
  const [wallet, setWallet] = useState<WalletState>(() => loadWallet());

  useEffect(() => {
    persistWallet(wallet);
  }, [wallet]);

  const spend = useCallback((game: GameId, description: string, amount: number) => {
    let ok = false;
    setWallet((current) => {
      if (!canAfford(current, amount)) return current;
      ok = true;
      return applyDelta(current, game, description, -amount);
    });
    return ok;
  }, []);

  const payout = useCallback((game: GameId, description: string, amount: number) => {
    if (amount <= 0) return;
    setWallet((current) => applyDelta(current, game, description, amount));
  }, []);

  const marker = useCallback(() => {
    setWallet((current) => takeHouseMarker(current));
  }, []);

  const reset = useCallback(() => {
    setWallet(resetWallet());
  }, []);

  const value = useMemo(
    () => ({ view, setView, chip, setChip, wallet, spend, payout, marker, reset }),
    [view, chip, wallet, spend, payout, marker, reset],
  );

  return <CasinoContext.Provider value={value}>{children}</CasinoContext.Provider>;
}

export function useCasino(): CasinoContextValue {
  const ctx = useContext(CasinoContext);
  if (!ctx) throw new Error("useCasino must be used within CasinoProvider");
  return ctx;
}
