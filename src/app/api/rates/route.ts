import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_RATES = {
  "EUR-USD": 1.085,
  "EUR-PEN": 4.12,
  "EUR-VES": 39.5,
  "USD-EUR": 0.921,
  "USD-PEN": 3.79,
  "USD-VES": 36.4,
};

const DEFAULT_MARKUPS: Record<string, number> = {
  "EUR-PEN": 3,
  "EUR-VES": 8,
  "EUR-USD": 1,
  "USD-PEN": 3,
  "USD-VES": 8,
  "USD-EUR": 1,
};

async function getMarkupsFromDB(): Promise<Record<string, number>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("from_currency, to_currency, markup_percent")
      .eq("is_active", true);

    if (error || !data) return DEFAULT_MARKUPS;

    return data.reduce((acc, row) => {
      acc[`${row.from_currency}-${row.to_currency}`] = row.markup_percent;
      return acc;
    }, {} as Record<string, number>);
  } catch {
    return DEFAULT_MARKUPS;
  }
}

export async function GET() {
  const markups = await getMarkupsFromDB();

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    if (data.result !== "success") throw new Error("API returned error");

    const r = data.rates as Record<string, number>;
    if (!r.USD || !r.PEN) throw new Error("Missing expected currencies");

    const rates: Record<string, number> = {
      "EUR-USD": r.USD,
      "EUR-PEN": r.PEN,
      "EUR-VES": r.VES ?? FALLBACK_RATES["EUR-VES"],
      "USD-EUR": 1 / r.USD,
      "USD-PEN": r.PEN / r.USD,
      "USD-VES": r.VES ? r.VES / r.USD : FALLBACK_RATES["USD-VES"],
    };

    return Response.json({
      rates,
      markups,
      updated_at: data.time_last_update_utc ?? new Date().toISOString(),
      source: "open.er-api.com",
    });
  } catch {
    return Response.json({
      rates: FALLBACK_RATES,
      markups,
      updated_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}
