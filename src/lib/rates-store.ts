import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PAIRS = ["EUR-PEN", "EUR-VES", "EUR-USD", "USD-PEN", "USD-VES", "USD-EUR"] as const;
export type Pair = (typeof PAIRS)[number];

export const DEFAULT_MARKUPS: Record<Pair, number> = {
  "EUR-PEN": 3,
  "EUR-VES": 8,
  "EUR-USD": 1,
  "USD-PEN": 3,
  "USD-VES": 8,
  "USD-EUR": 1,
};

interface RatesState {
  markups: Record<Pair, number>;
  setMarkup: (pair: Pair, v: number) => void;
  setMarkups: (markups: Record<string, number>) => void;
  liveRates: Record<string, number>;
  lastUpdated: string | null;
  source: string | null;
  setLiveRates: (rates: Record<string, number>, updatedAt: string, source: string) => void;
}

export const useRatesStore = create<RatesState>()(
  persist(
    (set) => ({
      markups: { ...DEFAULT_MARKUPS },
      setMarkup: (pair, v) =>
        set((s) => ({ markups: { ...s.markups, [pair]: v } })),
      setMarkups: (markups) =>
        set((s) => ({ markups: { ...s.markups, ...markups } })),
      liveRates: {},
      lastUpdated: null,
      source: null,
      setLiveRates: (rates, updatedAt, source) =>
        set({ liveRates: rates, lastUpdated: updatedAt, source }),
    }),
    {
      name: "patzi-rates",
      partialize: (s) => ({ markups: s.markups }),
    }
  )
);

export function getEffectiveRate(
  pair: string,
  liveRates: Record<string, number>,
  markups: Record<string, number>
): number | null {
  const base = liveRates[pair];
  if (!base) return null;
  const m = markups[pair] ?? 0;
  return base * (1 - m / 100);
}

export function calcTransferLive(
  pair: string,
  sendAmount: number,
  liveRates: Record<string, number>,
  markups: Record<string, number>
): { receiveAmount: number; exchangeRate: number; fee: number; totalCharged: number } | null {
  const effective = getEffectiveRate(pair, liveRates, markups);
  if (!effective || sendAmount <= 0) return null;
  return {
    receiveAmount: sendAmount * effective,
    exchangeRate: effective,
    fee: 0,
    totalCharged: sendAmount,
  };
}
