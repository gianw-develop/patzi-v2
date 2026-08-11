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

export type PairFee = { fixed: number; percent: number };

export const DEFAULT_FEES: Record<Pair, PairFee> = Object.fromEntries(
  PAIRS.map((pair) => [pair, { fixed: 0, percent: 0 }])
) as Record<Pair, PairFee>;

interface RatesState {
  markups: Record<Pair, number>;
  setMarkup: (pair: Pair, v: number) => void;
  setMarkups: (m: Record<string, number>) => void;
  fees: Record<string, PairFee>;
  activePairs: string[];
  setPricing: (fees: Record<string, PairFee>, activePairs: string[]) => void;
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
      setMarkups: (m) =>
        set((s) => ({ markups: { ...s.markups, ...m } })),
      fees: { ...DEFAULT_FEES },
      activePairs: [...PAIRS],
      setPricing: (fees, activePairs) => set({ fees, activePairs }),
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
  markups: Record<string, number>,
  fees: Record<string, PairFee> = DEFAULT_FEES
): { receiveAmount: number; exchangeRate: number; fee: number; totalCharged: number } | null {
  const effective = getEffectiveRate(pair, liveRates, markups);
  if (!effective || sendAmount <= 0) return null;
  const pricing = fees[pair] ?? { fixed: 0, percent: 0 };
  const fee = Math.max(0, pricing.fixed + (sendAmount * pricing.percent) / 100);
  const convertibleAmount = Math.max(0, sendAmount - fee);
  return {
    receiveAmount: convertibleAmount * effective,
    exchangeRate: effective,
    fee,
    totalCharged: sendAmount,
  };
}
