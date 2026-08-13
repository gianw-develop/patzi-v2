import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK = {
  "EUR-USD": 1.155182,
  "EUR-PEN": 3.910209,
  "EUR-VES": 978.10467,
  "USD-EUR": 0.865664,
  "USD-PEN": 3.384929,
  "USD-VES": 846.710449,
};

const DEFAULT_MARKUPS: Record<string, number> = {
  "EUR-PEN": 3,
  "EUR-VES": 8,
  "EUR-USD": 1,
  "USD-PEN": 3,
  "USD-VES": 8,
  "USD-EUR": 1,
};

const DEFAULT_FEES: Record<string, { fixed: number; percent: number }> = Object.fromEntries(
  Object.keys(DEFAULT_MARKUPS).map((pair) => [pair, { fixed: 0, percent: 0 }])
);

async function getVesParallelRate(): Promise<number | null> {
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json() as Array<{ fuente: string; promedio: number }>;
    const parallel = data.find((d) => d.fuente === "paralelo");
    return parallel?.promedio ?? null;
  } catch {
    return null;
  }
}

interface DbRow {
  from_currency: string;
  to_currency: string;
  rate: number | null;
  markup_percent: number;
  custom_rate: number | null;
  use_custom_rate: boolean | null;
  fee_fixed: number | null;
  fee_percent: number | null;
  is_active: boolean;
}

async function getDbRates(): Promise<{
  markups: Record<string, number>;
  customRates: Record<string, number>;
  fees: Record<string, { fixed: number; percent: number }>;
  activePairs: string[];
  baseRates: Record<string, number>;
}> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await sb
      .from("exchange_rates")
      .select("from_currency, to_currency, rate, markup_percent, custom_rate, use_custom_rate, fee_fixed, fee_percent, is_active");
    if (error || !data || data.length === 0) {
      return { markups: DEFAULT_MARKUPS, customRates: {}, fees: DEFAULT_FEES, activePairs: Object.keys(DEFAULT_MARKUPS), baseRates: FALLBACK };
    }
    const markups: Record<string, number> = { ...DEFAULT_MARKUPS };
    const customRates: Record<string, number> = {};
    const fees: Record<string, { fixed: number; percent: number }> = { ...DEFAULT_FEES };
    const activePairs: string[] = [];
    const baseRates: Record<string, number> = { ...FALLBACK };
    for (const row of data as DbRow[]) {
      const key = `${row.from_currency}-${row.to_currency}`;
      markups[key] = Number(row.markup_percent);
      if (row.rate != null && Number(row.rate) > 0) baseRates[key] = Number(row.rate);
      fees[key] = {
        fixed: Number(row.fee_fixed ?? 0),
        percent: Number(row.fee_percent ?? 0),
      };
      if (row.is_active) activePairs.push(key);
      if (row.use_custom_rate && row.custom_rate != null) {
        customRates[key] = Number(row.custom_rate);
      }
    }
    return { markups, customRates, fees, activePairs, baseRates };
  } catch {
    return { markups: DEFAULT_MARKUPS, customRates: {}, fees: DEFAULT_FEES, activePairs: Object.keys(DEFAULT_MARKUPS), baseRates: FALLBACK };
  }
}

export async function GET(request: Request) {
  const useMarket = new URL(request.url).searchParams.get("market") === "1";
  const [{ markups, customRates, fees, activePairs, baseRates }, vesParallel] = await Promise.all([
    getDbRates(),
    getVesParallelRate(),
  ]);

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR", {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("fetch failed");

    const data = await res.json();

    if (data.result !== "success") throw new Error("API returned error");

    const r = data.rates as Record<string, number>;

    if (!r.USD || !r.PEN) throw new Error("Missing expected currencies");

    // Use parallel market VES rate automatically when available
    const usdVes = vesParallel ?? (r.VES ? r.VES / r.USD : FALLBACK["USD-VES"]);
    const eurVes = vesParallel ? r.USD * vesParallel : (r.VES ?? FALLBACK["EUR-VES"]);

    const apiRates: Record<string, number> = {
      "EUR-USD": r.USD,
      "EUR-PEN": r.PEN,
      "EUR-VES": eurVes,
      "USD-EUR": 1 / r.USD,
      "USD-PEN": r.PEN / r.USD,
      "USD-VES": usdVes,
    };

    // Admin manual override has highest priority
    const rates: Record<string, number> = useMarket ? { ...apiRates } : { ...baseRates };
    for (const [pair, customRate] of Object.entries(customRates)) {
      rates[pair] = customRate;
    }

    return Response.json({
      rates,
      marketRates: apiRates,
      markups,
      customRates,
      fees,
      activePairs,
      ves_source: vesParallel ? "paralelo" : "oficial",
      updated_at: data.time_last_update_utc ?? new Date().toISOString(),
      source: "open.er-api.com",
    });
  } catch {
    const usdVes = vesParallel ?? FALLBACK["USD-VES"];
    const marketRates: Record<string, number> = {
      ...FALLBACK,
      "USD-VES": usdVes,
      "EUR-VES": vesParallel ? usdVes * FALLBACK["EUR-USD"] : FALLBACK["EUR-VES"],
    };
    const rates: Record<string, number> = useMarket ? { ...marketRates } : { ...baseRates };
    for (const [pair, customRate] of Object.entries(customRates)) {
      rates[pair] = customRate;
    }
    return Response.json({
      rates,
      marketRates,
      markups,
      customRates,
      fees,
      activePairs,
      ves_source: vesParallel ? "paralelo" : "oficial",
      updated_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}
