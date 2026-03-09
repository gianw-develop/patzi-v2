import type { Currency, ExchangeRate, Corridor } from "@/types";

export const EXCHANGE_RATES: Record<string, ExchangeRate> = {
  "EUR-USD": {
    id: "eur-usd",
    from_currency: "EUR",
    to_currency: "USD",
    rate: 1.085,
    markup_percent: 0.5,
    fee_fixed: 0.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "EUR-PEN": {
    id: "eur-pen",
    from_currency: "EUR",
    to_currency: "PEN",
    rate: 4.12,
    markup_percent: 1.5,
    fee_fixed: 2.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "EUR-VES": {
    id: "eur-ves",
    from_currency: "EUR",
    to_currency: "VES",
    rate: 39.5,
    markup_percent: 2.0,
    fee_fixed: 3.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "USD-EUR": {
    id: "usd-eur",
    from_currency: "USD",
    to_currency: "EUR",
    rate: 0.921,
    markup_percent: 0.5,
    fee_fixed: 0.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "USD-PEN": {
    id: "usd-pen",
    from_currency: "USD",
    to_currency: "PEN",
    rate: 3.79,
    markup_percent: 1.2,
    fee_fixed: 1.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "USD-VES": {
    id: "usd-ves",
    from_currency: "USD",
    to_currency: "VES",
    rate: 36.4,
    markup_percent: 2.0,
    fee_fixed: 2.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "PEN-USD": {
    id: "pen-usd",
    from_currency: "PEN",
    to_currency: "USD",
    rate: 0.263,
    markup_percent: 1.2,
    fee_fixed: 1.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "PEN-EUR": {
    id: "pen-eur",
    from_currency: "PEN",
    to_currency: "EUR",
    rate: 0.242,
    markup_percent: 1.5,
    fee_fixed: 2.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "VES-USD": {
    id: "ves-usd",
    from_currency: "VES",
    to_currency: "USD",
    rate: 0.0274,
    markup_percent: 2.0,
    fee_fixed: 2.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
  "VES-EUR": {
    id: "ves-eur",
    from_currency: "VES",
    to_currency: "EUR",
    rate: 0.0253,
    markup_percent: 2.0,
    fee_fixed: 3.99,
    fee_percent: 0,
    updated_at: new Date().toISOString(),
  },
};

export function getExchangeRate(from: Currency, to: Currency): ExchangeRate | null {
  if (from === to) return null;
  return EXCHANGE_RATES[`${from}-${to}`] || null;
}

export function calculateTransfer(
  from: Currency,
  to: Currency,
  sendAmount: number,
  speed: "express" | "economy" = "express"
): {
  receiveAmount: number;
  exchangeRate: number;
  fee: number;
  totalCharged: number;
} | null {
  const rateData = getExchangeRate(from, to);
  if (!rateData) return null;

  const effectiveRate = rateData.rate * (1 - rateData.markup_percent / 100);
  const fee = rateData.fee_fixed + (sendAmount * rateData.fee_percent) / 100;
  const speedFee = speed === "express" ? 0 : -fee * 0.3;
  const totalFee = fee + speedFee;
  const receiveAmount = (sendAmount - totalFee) * effectiveRate;

  return {
    receiveAmount: Math.max(0, receiveAmount),
    exchangeRate: effectiveRate,
    fee: totalFee,
    totalCharged: sendAmount,
  };
}

export const CORRIDORS: Corridor[] = [
  {
    from: "EUR",
    to: "PEN",
    country_name: "Perú",
    country_code: "PE",
    flag: "🇵🇪",
    delivery_methods: ["bank", "cash"],
    express_available: true,
  },
  {
    from: "EUR",
    to: "VES",
    country_name: "Venezuela",
    country_code: "VE",
    flag: "🇻🇪",
    delivery_methods: ["bank", "cash", "mobile_money"],
    express_available: true,
  },
  {
    from: "USD",
    to: "PEN",
    country_name: "Perú",
    country_code: "PE",
    flag: "🇵🇪",
    delivery_methods: ["bank", "cash"],
    express_available: true,
  },
  {
    from: "USD",
    to: "VES",
    country_name: "Venezuela",
    country_code: "VE",
    flag: "🇻🇪",
    delivery_methods: ["bank", "cash", "mobile_money"],
    express_available: true,
  },
  {
    from: "EUR",
    to: "USD",
    country_name: "Estados Unidos",
    country_code: "US",
    flag: "🇺🇸",
    delivery_methods: ["bank"],
    express_available: true,
  },
  {
    from: "USD",
    to: "EUR",
    country_name: "Europa",
    country_code: "EU",
    flag: "🇪🇺",
    delivery_methods: ["bank"],
    express_available: true,
  },
];

export const CURRENCY_INFO: Record<Currency, { name: string; symbol: string; flag: string; flagUrl: string; country: string }> = {
  EUR: { name: "Euro", symbol: "€", flag: "🇪🇺", flagUrl: "https://flagcdn.com/24x18/eu.png", country: "Europa" },
  USD: { name: "Dólar Americano", symbol: "$", flag: "🇺🇸", flagUrl: "https://flagcdn.com/24x18/us.png", country: "EE.UU." },
  PEN: { name: "Sol Peruano", symbol: "S/", flag: "🇵🇪", flagUrl: "https://flagcdn.com/24x18/pe.png", country: "Perú" },
  VES: { name: "Bolívar Venezolano", symbol: "Bs.", flag: "🇻🇪", flagUrl: "https://flagcdn.com/24x18/ve.png", country: "Venezuela" },
};
