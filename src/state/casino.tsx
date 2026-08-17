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
import { loadMuted, persistMuted, playSfx, unlockAudio, type Sfx } from "../lib/sound";

export const CHIP_VALUES = [25, 100, 500, 1000, 2500] as const;

function clampChip(balance: number, current: number): number {
  if (current <= balance || balance < CHIP_VALUES[0]) return current;
  const next = [...CHIP_VALUES].reverse().find((value) => value <= balance);
  return next ?? CHIP_VALUES[0];
}

interface CasinoContextValue {
  view: View;
  setView: (view: View) => void;
  chip: number;
  setChip: (value: number) => void;
  wallet: WalletState;
  spend: (game: GameId, description: string, amount: number) => boolean;
  payout: (game: GameId, description: string, amount: number) => void;
  credit: (game: GameId, description: string, amount: number) => void;
  marker: () => void;
  reset: () => void;
  muted: boolean;
  toggleMute: () => void;
  sfx: (kind: Sfx) => void;
}

const CasinoContext = createContext<CasinoContextValue | null>(null);

export function CasinoProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("lobby");
  const [chip, setChip] = useState(100);
  const [wallet, setWallet] = useState<WalletState>(() => loadWallet());
  const [muted, setMuted] = useState(() => loadMuted());

  useEffect(() => {
    persistWallet(wallet);
  }, [wallet]);

  useEffect(() => {
    persistMuted(muted);
  }, [muted]);

  useEffect(() => {
    setChip((current) => clampChip(wallet.balance, current));
  }, [wallet.balance]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const sfx = useCallback(
    (kind: Sfx) => {
      playSfx(kind, muted);
    },
    [muted],
  );

  const spend = useCallback(
    (game: GameId, description: string, amount: number) => {
      let ok = false;
      setWallet((current) => {
        if (!canAfford(current, amount)) return current;
        ok = true;
        return applyDelta(current, game, description, -amount);
      });
      if (ok) sfx("chip");
      return ok;
    },
    [sfx],
  );

  const credit = useCallback((game: GameId, description: string, amount: number) => {
    if (amount <= 0) return;
    setWallet((current) => applyDelta(current, game, description, amount));
  }, []);

  const payout = useCallback(
    (game: GameId, description: string, amount: number) => {
      credit(game, description, amount);
      if (amount > 0) sfx("win");
    },
    [credit, sfx],
  );

  const marker = useCallback(() => {
    setWallet((current) => takeHouseMarker(current));
    sfx("win");
  }, [sfx]);

  const reset = useCallback(() => {
    setWallet(resetWallet());
    setChip(100);
  }, []);

  const toggleMute = useCallback(() => {
    unlockAudio();
    setMuted((current) => {
      const next = !current;
      if (!next) playSfx("win", false);
      return next;
    });
  }, []);

  const chooseChip = useCallback((value: number) => {
    setChip(value);
  }, []);

  const value = useMemo(
    () => ({
      view,
      setView,
      chip,
      setChip: chooseChip,
      wallet,
      spend,
      payout,
      credit,
      marker,
      reset,
      muted,
      toggleMute,
      sfx,
    }),
    [view, chip, chooseChip, wallet, spend, payout, credit, marker, reset, muted, toggleMute, sfx],
  );

  return <CasinoContext.Provider value={value}>{children}</CasinoContext.Provider>;
}

export function useCasino(): CasinoContextValue {
  const ctx = useContext(CasinoContext);
  if (!ctx) throw new Error("useCasino must be used within CasinoProvider");
  return ctx;
}
