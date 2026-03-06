import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RatesState {
  markup: number;
  setMarkup: (v: number) => void;
  liveRates: Record<string, number>;
  lastUpdated: string | null;
  source: string | null;
  setLiveRates: (rates: Record<string, number>, updatedAt: string, source: string) => void;
}

export const useRatesStore = create<RatesState>()(
  persist(
    (set) => ({
      markup: 2,
      setMarkup: (v) => set({ markup: v }),
      liveRates: {},
      lastUpdated: null,
      source: null,
      setLiveRates: (rates, updatedAt, source) =>
        set({ liveRates: rates, lastUpdated: updatedAt, source }),
    }),
    {
      name: "patzi-rates",
      partialize: (s) => ({ markup: s.markup }),
    }
  )
);

export function getEffectiveRate(
  pair: string,
  liveRates: Record<string, number>,
  markup: number
): number | null {
  const base = liveRates[pair];
  if (!base) return null;
  return base * (1 - markup / 100);
}

export function calcTransferLive(
  pair: string,
  sendAmount: number,
  liveRates: Record<string, number>,
  markup: number
): { receiveAmount: number; exchangeRate: number; fee: number; totalCharged: number } | null {
  const effective = getEffectiveRate(pair, liveRates, markup);
  if (!effective || sendAmount <= 0) return null;
  return {
    receiveAmount: sendAmount * effective,
    exchangeRate: effective,
    fee: 0,
    totalCharged: sendAmount,
  };
}
