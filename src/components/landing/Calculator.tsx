"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDownUp, Zap, ShieldCheck } from "lucide-react";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { useRatesStore, getEffectiveRate } from "@/lib/rates-store";
import type { Currency } from "@/types";

const SEND_CURRENCIES: Currency[] = ["EUR", "USD"];
const RECEIVE_CURRENCIES: Currency[] = ["PEN", "VES", "USD", "EUR"];

export default function Calculator() {
  const [sendAmount, setSendAmount] = useState("100");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [activeField, setActiveField] = useState<"send" | "receive">("send");
  const [sendCurrency, setSendCurrency] = useState<Currency>("EUR");
  const [receiveCurrency, setReceiveCurrency] = useState<Currency>("PEN");
  const { markups, liveRates, setLiveRates, setMarkups } = useRatesStore();
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => {
        setLiveRates(d.rates, d.updated_at, d.source);
        if (d.markups) setMarkups(d.markups);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pair = `${sendCurrency}-${receiveCurrency}`;
    const rate = getEffectiveRate(pair, liveRates, markups);
    setExchangeRate(rate);

    if (!rate || sendCurrency === receiveCurrency) {
      setReceiveAmount("");
      return;
    }

    if (activeField === "send") {
      const amt = parseFloat(sendAmount);
      setReceiveAmount(isNaN(amt) || amt <= 0 ? "" : (amt * rate).toFixed(2));
    } else {
      const amt = parseFloat(receiveAmount);
      setSendAmount(isNaN(amt) || amt <= 0 ? "" : (amt / rate).toFixed(2));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendAmount, receiveAmount, sendCurrency, receiveCurrency, liveRates, markups, activeField]);

  const handleSendChange = (v: string) => { setActiveField("send"); setSendAmount(v); };
  const handleReceiveChange = (v: string) => { setActiveField("receive"); setReceiveAmount(v); };

  const handleSendCurrencyChange = (c: Currency) => {
    setSendCurrency(c);
    if (c === receiveCurrency) setReceiveCurrency(c === "EUR" ? "PEN" : "EUR");
  };

  const sendAmt = parseFloat(sendAmount);
  const receiveAmt = parseFloat(receiveAmount);
  const showSummary = exchangeRate && !isNaN(sendAmt) && sendAmt > 0 && !isNaN(receiveAmt) && receiveAmt > 0;

  const availableReceive = RECEIVE_CURRENCIES.filter((c) => c !== sendCurrency);

  return (
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">Calcula tu envío</h3>
        <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-500/30">
          <Zap className="w-3 h-3" /> Llega en minutos
        </span>
      </div>

      <div className="p-6 space-y-4">
        {/* Send row */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Tú envías</p>
          <div className="flex gap-2">
            <div className={`flex-1 flex items-center rounded-xl px-4 h-14 transition-all border ${
              activeField === "send"
                ? "bg-slate-50 border-blue-400 ring-2 ring-blue-100"
                : "bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <span className="text-slate-400 text-sm mr-1">{CURRENCY_INFO[sendCurrency].symbol}</span>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => handleSendChange(e.target.value)}
                onFocus={() => setActiveField("send")}
                className="flex-1 bg-transparent text-xl font-bold text-slate-800 outline-none w-0"
                min="1"
                placeholder="100"
              />
            </div>
            <div className="flex gap-1.5">
              {SEND_CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleSendCurrencyChange(c)}
                  className={`px-3 h-14 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-0.5 min-w-[60px] ${
                    sendCurrency === c
                      ? "bg-blue-900 text-white border-blue-900 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <span className="text-base leading-none">{CURRENCY_INFO[c].flag}</span>
                  <span className="text-xs">{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider with swap icon */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ArrowDownUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Receive row */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Ellos reciben</p>
          <div className="flex gap-2">
            <div className={`flex-1 flex items-center rounded-xl px-4 h-14 transition-all border ${
              activeField === "receive"
                ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-100"
                : "bg-emerald-50 border-emerald-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100"
            }`}>
              <input
                type="number"
                value={receiveAmount}
                onChange={(e) => handleReceiveChange(e.target.value)}
                onFocus={() => setActiveField("receive")}
                className="flex-1 bg-transparent text-2xl font-bold text-emerald-700 outline-none w-0"
                min="0"
                placeholder="—"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {availableReceive.map((c) => (
                <button
                  key={c}
                  onClick={() => setReceiveCurrency(c)}
                  className={`px-3 h-14 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-0.5 min-w-[60px] ${
                    receiveCurrency === c
                      ? "bg-blue-900 text-white border-blue-900 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <span className="text-base leading-none">{CURRENCY_INFO[c].flag}</span>
                  <span className="text-xs">{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary card */}
        {showSummary && exchangeRate && (
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-xs text-slate-500">Tasa de cambio</span>
              <span className="text-xs font-semibold text-slate-700">
                1 {sendCurrency} = {exchangeRate.toFixed(4)} {receiveCurrency}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-xs text-slate-500">Tarifa</span>
              <span className="text-sm font-bold text-emerald-600 tracking-wide">GRATIS</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-sm font-semibold text-slate-700">Total a pagar</span>
              <span className="text-base font-bold text-slate-900">
                {CURRENCY_INFO[sendCurrency].symbol}{sendAmt.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        <Button asChild className="w-full h-13 bg-gradient-to-r from-blue-950 to-blue-700 hover:from-blue-900 hover:to-blue-600 text-white text-base font-semibold rounded-xl shadow-lg shadow-blue-900/30">
          <Link href="/auth/register">
            Enviar ahora <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>

        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Sin cargos ocultos
          </span>
          <span>·</span>
          <span>Tasa garantizada 30 min</span>
        </div>
      </div>
    </div>
  );
}
