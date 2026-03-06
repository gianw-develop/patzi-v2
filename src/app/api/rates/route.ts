export const revalidate = 86400; // revalidate every 24 hours

const FALLBACK = {
  "EUR-USD": 1.085,
  "EUR-PEN": 4.12,
  "EUR-VES": 39.5,
  "USD-EUR": 0.921,
  "USD-PEN": 3.79,
  "USD-VES": 36.4,
};

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR", {
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error("fetch failed");

    const data = await res.json();

    if (data.result !== "success") throw new Error("API returned error");

    const r = data.rates as Record<string, number>;

    if (!r.USD || !r.PEN) throw new Error("Missing expected currencies");

    const rates: Record<string, number> = {
      "EUR-USD": r.USD,
      "EUR-PEN": r.PEN,
      "EUR-VES": r.VES ?? FALLBACK["EUR-VES"],
      "USD-EUR": 1 / r.USD,
      "USD-PEN": r.PEN / r.USD,
      "USD-VES": r.VES ? r.VES / r.USD : FALLBACK["USD-VES"],
    };

    return Response.json({
      rates,
      updated_at: data.time_last_update_utc ?? new Date().toISOString(),
      source: "open.er-api.com",
    });
  } catch {
    return Response.json({
      rates: FALLBACK,
      updated_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}
