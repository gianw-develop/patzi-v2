"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, ArrowRight, Check, ChevronDown, RefreshCw, Route } from "lucide-react";
import { FlagMark, type FlagCountry } from "@/components/brand/FinancialMarks";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import {
  calcTransferLive,
  getEffectiveRate,
  useRatesStore,
  type PairFee,
} from "@/lib/rates-store";
import type { Currency } from "@/types";
import { useLanguage } from "@/lib/i18n";

const SEND_OPTIONS: Array<{ currency: Currency; country: FlagCountry; label: string }> = [
  { currency: "EUR", country: "ES", label: "España" },
  { currency: "USD", country: "US", label: "EE. UU." },
];

const RECEIVE_OPTIONS: Array<{ currency: Currency; country: FlagCountry; label: string }> = [
  { currency: "VES", country: "VE", label: "Venezuela" },
  { currency: "PEN", country: "PE", label: "Perú" },
];

function parseAmountInput(value: string) {
  const compact = value.trim().replace(/\s/g, "");
  if (!compact) return 0;
  const comma = compact.lastIndexOf(",");
  const dot = compact.lastIndexOf(".");
  let normalized = compact;
  if (comma >= 0 && dot >= 0) {
    normalized = comma > dot
      ? compact.replace(/\./g, "").replace(",", ".")
      : compact.replace(/,/g, "");
  } else if (comma >= 0) {
    normalized = compact.replace(",", ".");
  }
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function formatAmountInput(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function RemittanceCircuit({ routeKey }: { routeKey: string }) {
  const inputPath = "M492 70h78c35 0 28-28 62-28h28";
  const outputPath = "M1138 70h50c22 0 18 28 42 28h10";

  return (
    <svg
      key={routeKey}
      viewBox="0 0 1240 140"
      className="pointer-events-none absolute inset-x-0 top-[67%] z-0 hidden h-[140px] w-full -translate-y-1/2 overflow-visible lg:block"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="remittance-flow" x1="492" y1="70" x2="1240" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF765B" />
          <stop offset=".32" stopColor="#FF765B" />
          <stop offset=".68" stopColor="#4DE2B5" />
          <stop offset="1" stopColor="#4DE2B5" />
        </linearGradient>
        <filter id="remittance-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[inputPath, outputPath].map((path) => (
        <g key={path}>
          <path d={path} stroke="rgba(7,26,45,.08)" strokeWidth="13" strokeLinecap="round" />
          <path d={path} stroke="url(#remittance-flow)" strokeWidth="3.5" strokeLinecap="round" />
          <path d={path} className="remittance-circuit-dash" stroke="rgba(255,255,255,.94)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 14" />
        </g>
      ))}
      <circle cx="660" cy="42" r="14" fill="#FBFCF9" stroke="#FF765B" strokeOpacity=".42" strokeWidth="2" />
      <circle cx="660" cy="42" r="5" fill="#18A77D" filter="url(#remittance-glow)" />
      <circle cx="1138" cy="70" r="14" fill="#FBFCF9" stroke="#4DE2B5" strokeOpacity=".5" strokeWidth="2" />
      <circle cx="1138" cy="70" r="5" fill="#18A77D" filter="url(#remittance-glow)" />
      <circle className="circuit-moving" r="5" fill="#fff" stroke="#FF765B" strokeWidth="2" filter="url(#remittance-glow)">
        <animateMotion dur="2.6s" repeatCount="indefinite" path={inputPath} />
      </circle>
      <circle className="circuit-moving" r="5" fill="#fff" stroke="#4DE2B5" strokeWidth="2" filter="url(#remittance-glow)">
        <animateMotion dur="2.2s" repeatCount="indefinite" path={outputPath} />
      </circle>
    </svg>
  );
}

function CurrencySelect({
  options,
  value,
  onChange,
  activePairs,
  counterpart,
  sending,
}: {
  options: Array<{ currency: Currency; country: FlagCountry; label: string }>;
  value: Currency;
  onChange: (currency: Currency) => void;
  activePairs: string[];
  counterpart: Currency;
  sending: boolean;
}) {
  const { t } = useLanguage();
  const selected = options.find((option) => option.currency === value) ?? options[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={t(sending ? "Moneda de envío" : "Moneda de recepción")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 items-center gap-1.5 rounded-2xl border bg-white px-2.5 text-[#071A2D] shadow-[0_7px_18px_rgba(7,26,45,.06)] transition-all sm:h-12 sm:gap-2 sm:px-3 ${open ? "border-[#4DE2B5]/70 shadow-[0_0_0_4px_rgba(77,226,181,.12),0_12px_28px_rgba(7,26,45,.1)]" : "border-[#071A2D]/9 hover:-translate-y-0.5 hover:border-[#071A2D]/18"}`}
      >
        <FlagMark country={selected.country} className="h-4 w-6 sm:h-5 sm:w-7" />
        <span className="text-[11px] font-semibold sm:text-xs">{selected.currency}</span>
        <ChevronDown className={`ml-0.5 h-3.5 w-3.5 text-[#071A2D]/42 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" aria-label={t(sending ? "Seleccionar moneda de envío" : "Seleccionar moneda de recepción")} className="absolute right-0 top-[calc(100%+8px)] z-50 w-[184px] origin-top-right rounded-2xl border border-[#071A2D]/9 bg-white/98 p-1.5 shadow-[0_22px_55px_rgba(7,26,45,.18),inset_0_1px_0_white] backdrop-blur-xl">
          {options.map((option) => {
            const optionPair = sending ? `${option.currency}-${counterpart}` : `${counterpart}-${option.currency}`;
            const available = activePairs.includes(optionPair);
            const active = option.currency === value;
            return (
              <button
                key={option.currency}
                type="button"
                role="option"
                aria-selected={active}
                disabled={!available}
                onClick={() => {
                  onChange(option.currency);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-[#EAF8F2] text-[#087F62]" : "text-[#071A2D] hover:bg-[#F5F8F5]"}`}
              >
                <FlagMark country={option.country} className="h-5 w-8" />
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold">{option.currency}</span><span className="mt-0.5 block text-[8px] text-[#071A2D]/42">{t(option.label)}</span></span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RemittanceExperience() {
  const { language, t } = useLanguage();
  const {
    markups,
    fees,
    activePairs,
    liveRates,
    source,
    setLiveRates,
    setMarkups,
    setPricing,
  } = useRatesStore();
  const [sendCurrency, setSendCurrency] = useState<Currency>("EUR");
  const [receiveCurrency, setReceiveCurrency] = useState<Currency>("VES");
  const [sendAmount, setSendAmount] = useState("100");
  const [receiveDraft, setReceiveDraft] = useState("");
  const [editingField, setEditingField] = useState<"send" | "receive" | null>(null);
  const [loading, setLoading] = useState(true);
  const [vesSource, setVesSource] = useState<"paralelo" | "oficial" | null>(null);

  const pair = `${sendCurrency}-${receiveCurrency}`;
  const exchangeRate = getEffectiveRate(pair, liveRates, markups);
  const pairFee: PairFee = fees[pair] ?? { fixed: 0, percent: 0 };

  useEffect(() => {
    let active = true;
    fetch("/api/rates")
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setLiveRates(data.rates ?? {}, data.updated_at, data.source);
        if (data.markups) setMarkups(data.markups);
        setPricing(data.fees ?? {}, data.activePairs ?? []);
        setVesSource(data.ves_source ?? null);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [setLiveRates, setMarkups, setPricing]);

  const result = useMemo(
    () => calcTransferLive(pair, parseAmountInput(sendAmount), liveRates, markups, fees),
    [fees, liveRates, markups, pair, sendAmount],
  );
  const calculatedReceive = result?.receiveAmount ?? null;
  const displayedReceive = editingField === "receive"
    ? receiveDraft
    : calculatedReceive == null ? "" : formatAmountInput(calculatedReceive);

  const chooseCorridor = (currency: Currency) => {
    setSendCurrency("EUR");
    setReceiveCurrency(currency);
  };

  const handleReceiveChange = (value: string) => {
    setReceiveDraft(value);
    const desiredReceive = parseAmountInput(value);
    const percentFactor = 1 - pairFee.percent / 100;
    if (!exchangeRate || !desiredReceive || percentFactor <= 0) {
      setSendAmount("");
      return;
    }
    const requiredSend = (desiredReceive / exchangeRate + pairFee.fixed) / percentFactor;
    setSendAmount(formatAmountInput(requiredSend));
  };

  const sendOption = SEND_OPTIONS.find((option) => option.currency === sendCurrency) ?? SEND_OPTIONS[0];
  const receiveOption = RECEIVE_OPTIONS.find((option) => option.currency === receiveCurrency) ?? RECEIVE_OPTIONS[0];
  const isAvailable = activePairs.includes(pair);
  const routeKey = pair;

  return (
    <section id="remesas" className="relative overflow-hidden bg-[#FBFCF9]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_55%,rgba(77,226,181,.11),transparent_26%),radial-gradient(circle_at_88%_24%,rgba(255,118,91,.09),transparent_24%)]" />
      <div className="relative mx-auto grid max-w-[1240px] gap-16 px-5 pb-28 pt-20 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-20 lg:px-8 lg:py-24 xl:gap-24">
        <RemittanceCircuit routeKey={routeKey} />
        <div className="relative z-20 min-w-0">
          <p className="premium-kicker text-[#087F62]">{t("Remesas internacionales")}</p>
          <h2 className="mt-4 max-w-[570px] text-[2.9rem] font-semibold leading-[.98] tracking-[-.055em] sm:text-[3.8rem] xl:text-[4rem]">
            {language === "en" ? <>Send from Spain. They receive in <span className="text-[#087F62]">Venezuela</span> or <span className="text-[#E86650]">Peru.</span></> : <>Envía desde España. Ellos reciben en <span className="text-[#087F62]">Venezuela</span> o <span className="text-[#E86650]">Perú.</span></>}
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#071A2D]/55">
            {t("Elige el corredor, calcula con la tasa Patzi y revisa cuánto recibe tu destinatario antes de crear la remesa.")}
          </p>

          <div className="mt-8 space-y-3">
            {RECEIVE_OPTIONS.map((destination) => {
              const corridorPair = `EUR-${destination.currency}`;
              const selected = sendCurrency === "EUR" && receiveCurrency === destination.currency;
              const available = activePairs.includes(corridorPair);
              return (
                <button
                  key={destination.currency}
                  type="button"
                  disabled={!available}
                  onClick={() => chooseCorridor(destination.currency)}
                  className={`group flex w-full max-w-[540px] items-center gap-3 rounded-2xl border bg-white px-4 py-4 text-left transition-all sm:gap-4 sm:px-5 disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "corridor-card-active border-[#4DE2B5]/65 shadow-[0_18px_42px_rgba(7,26,45,.1)]" : "border-[#071A2D]/9 shadow-[0_10px_26px_rgba(7,26,45,.06)] hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(7,26,45,.1)]"}`}
                >
                  <FlagMark country="ES" className="h-8 w-11" />
                  <div><p className="text-xs font-semibold">{t("España")}</p><p className="mt-0.5 text-[9px] text-[#071A2D]/40">{t("Envías EUR")}</p></div>
                  <div className="relative mx-1 h-px flex-1 overflow-visible bg-[#071A2D]/10">
                    <span className="corridor-route-dot absolute -top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#4DE2B5] shadow-[0_0_0_4px_rgba(77,226,181,.16)]" />
                  </div>
                  <FlagMark country={destination.country} className="h-8 w-11" />
                  <div className="min-w-[86px]"><p className="text-xs font-semibold">{t(destination.label)}</p><p className="mt-0.5 text-[9px] text-[#071A2D]/40">{t(`Reciben ${destination.currency}`)}</p></div>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${selected ? "bg-[#35BF97] text-white shadow-[0_7px_16px_rgba(53,191,151,.25)]" : "text-[#071A2D]/30"}`}>
                    {selected ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-[10px] text-[#071A2D]/48">
            <span className="flex items-center gap-2"><span className="live-rate-dot h-2.5 w-2.5 rounded-full bg-[#18A77D]" />{t(source === "fallback" ? "Tasa de respaldo disponible" : "Tasas actualizadas en tiempo real")}</span>
            {receiveCurrency === "VES" && vesSource && <span className="rounded-full bg-[#EAF8F2] px-3 py-1.5 font-semibold text-[#087F62]">VES · {t("mercado")} {t(vesSource)}</span>}
          </div>
        </div>

        <div className="relative z-10 min-w-0">
          <div className="remittance-calculator-card premium-card relative mx-auto w-full max-w-[540px] rounded-[2rem] border border-white/90 p-5 shadow-[0_34px_76px_rgba(7,26,45,.14),inset_0_1px_0_white] sm:p-7">
            <span className="absolute left-[-11px] top-[67%] hidden h-6 w-6 -translate-y-1/2 rounded-full border-2 border-[#FF765B]/45 bg-[#FBFCF9] shadow-[0_0_0_7px_rgba(255,118,91,.08)] lg:block"><span className="absolute inset-[6px] rounded-full bg-[#18A77D]" /></span>
            <span className="absolute right-[-11px] top-[67%] hidden h-6 w-6 -translate-y-1/2 rounded-full border-2 border-[#4DE2B5]/55 bg-[#FBFCF9] shadow-[0_0_0_7px_rgba(77,226,181,.08)] lg:block"><span className="absolute inset-[6px] rounded-full bg-[#18A77D]" /></span>

            <div className="relative z-10 flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold tracking-[-.04em]">{t("Calcula tu envío")}</h3>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#071A2D]/8 bg-white px-3 py-2 text-[9px] font-medium text-[#071A2D]/55 shadow-sm">
                <ArrowDownUp className="h-3.5 w-3.5 text-[#071A2D]" />
                <span className="hidden sm:inline">{t(source === "fallback" ? "Tasa de respaldo" : "Tasa en tiempo real")}</span>
                <span className="live-rate-dot h-2 w-2 rounded-full bg-[#18A77D]" />
              </span>
            </div>

            <div className="relative z-30 mt-6 space-y-4">
              <div className="rounded-2xl border border-[#071A2D]/9 bg-[#F8FAF8] p-4 shadow-[inset_0_1px_0_white] sm:p-5">
                <label htmlFor="remittance-send" className="text-[11px] font-medium text-[#071A2D]/48">{t("Tú envías")}</label>
                <div className="mt-3 flex items-center gap-3">
                  <input id="remittance-send" type="text" inputMode="decimal" value={sendAmount} onFocus={() => setEditingField("send")} onBlur={() => setEditingField(null)} onChange={(event) => setSendAmount(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[2rem] font-semibold tracking-[-.055em] outline-none sm:text-[2.7rem]" aria-label={t("Monto que envías")} autoComplete="off" />
                  <CurrencySelect options={SEND_OPTIONS} value={sendCurrency} onChange={setSendCurrency} activePairs={activePairs} counterpart={receiveCurrency} sending />
                </div>
              </div>

              <div className="rounded-2xl border border-[#4DE2B5]/38 bg-[#EDFCF7] p-4 shadow-[inset_0_1px_0_white] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="remittance-receive" className="text-[11px] font-medium text-[#071A2D]/48">{t("Ellos reciben")}</label>
                  <span className="text-right text-[9px] font-semibold text-[#071A2D]/65">{exchangeRate ? `1 ${sendCurrency} = ${exchangeRate.toFixed(4)} ${receiveCurrency}` : t("No disponible")}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input id="remittance-receive" type="text" inputMode="decimal" value={displayedReceive} onFocus={() => { setReceiveDraft(displayedReceive); setEditingField("receive"); }} onBlur={() => setEditingField(null)} onChange={(event) => handleReceiveChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[2rem] font-semibold tracking-[-.055em] text-[#087F62] outline-none sm:text-[2.7rem]" aria-label={t("Monto que recibe el destinatario")} autoComplete="off" />
                  <CurrencySelect options={RECEIVE_OPTIONS} value={receiveCurrency} onChange={setReceiveCurrency} activePairs={activePairs} counterpart={sendCurrency} sending={false} />
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-5 overflow-hidden rounded-2xl border border-[#071A2D]/8 bg-white/88 text-[11px]">
              <div className="flex items-center justify-between border-b border-[#071A2D]/7 px-4 py-3.5"><span className="text-[#071A2D]/45">{t("Tasa Patzi")}</span><strong>{exchangeRate ? `1 ${sendCurrency} = ${exchangeRate.toFixed(4)} ${receiveCurrency}` : t("No disponible")}</strong></div>
              <div className="flex items-center justify-between border-b border-[#071A2D]/7 px-4 py-3.5"><span className="text-[#071A2D]/45">{t("Margen incluido")}</span><strong>{markups[pair as keyof typeof markups] ?? 0}%</strong></div>
              <div className="flex items-center justify-between px-4 py-3.5"><span className="text-[#071A2D]/45">{t("Comisión")}</span><strong>{result && result.fee > 0 ? `${CURRENCY_INFO[sendCurrency].symbol}${result.fee.toFixed(2)} ${sendCurrency}` : t("Sin comisión adicional")}</strong></div>
            </div>

            <Link aria-disabled={!isAvailable || loading || !result} href={isAvailable && result ? "/auth/register" : "#remesas"} className={`relative z-10 mt-5 flex h-14 items-center justify-center gap-3 rounded-xl text-xs font-semibold text-white transition-all ${isAvailable && result ? "bg-[#071A2D] shadow-[0_16px_28px_rgba(7,26,45,.2)] hover:-translate-y-0.5" : "cursor-not-allowed bg-[#071A2D]/40"}`}>
              {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />{t("Actualizando tasa")}</> : <>{t("Continuar envío")} <ArrowRight className="h-4 w-4" /></>}
            </Link>

            <div className="depth-float-delayed absolute -bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-2xl border border-[#4DE2B5]/55 bg-white/94 px-4 py-3 shadow-[0_18px_40px_rgba(7,26,45,.14)] backdrop-blur-xl">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF8F2] text-[#087F62]"><Route className="h-4 w-4" /></div>
              <div><p className="text-[8px] text-[#071A2D]/40">{t("Corredor activo")}</p><p className="mt-1 text-[10px] font-semibold">{t(sendOption.label)} → {t(receiveOption.label)}</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
