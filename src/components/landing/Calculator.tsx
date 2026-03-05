"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Zap, Clock } from "lucide-react";
import { calculateTransfer, CURRENCY_INFO } from "@/lib/exchange-rates";
import type { Currency, TransferSpeed } from "@/types";

const SEND_CURRENCIES: Currency[] = ["EUR", "USD"];
const RECEIVE_CURRENCIES: Currency[] = ["PEN", "VES", "USD", "EUR"];

export default function Calculator() {
  const [sendAmount, setSendAmount] = useState("200");
  const [sendCurrency, setSendCurrency] = useState<Currency>("EUR");
  const [receiveCurrency, setReceiveCurrency] = useState<Currency>("PEN");
  const [speed, setSpeed] = useState<TransferSpeed>("express");
  const [result, setResult] = useState<{
    receiveAmount: number;
    exchangeRate: number;
    fee: number;
    totalCharged: number;
  } | null>(null);

  useEffect(() => {
    const amount = parseFloat(sendAmount);
    if (!isNaN(amount) && amount > 0 && sendCurrency !== receiveCurrency) {
      const calc = calculateTransfer(sendCurrency, receiveCurrency, amount, speed);
      setResult(calc);
    } else {
      setResult(null);
    }
  }, [sendAmount, sendCurrency, receiveCurrency, speed]);

  const handleSendCurrencyChange = (c: Currency) => {
    setSendCurrency(c);
    if (c === receiveCurrency) {
      setReceiveCurrency(c === "EUR" ? "PEN" : "EUR");
    }
  };

  const availableReceive = RECEIVE_CURRENCIES.filter((c) => c !== sendCurrency);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-slate-800 mb-5">Calcula tu envío</h3>

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
            Tú envías
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="flex-1 text-lg font-semibold h-12"
              min="1"
              placeholder="200"
            />
            <div className="flex gap-1.5">
              {SEND_CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleSendCurrencyChange(c)}
                  className={`px-3 h-12 rounded-lg text-sm font-semibold border-2 transition-all ${
                    sendCurrency === c
                      ? "bg-blue-900 text-white border-blue-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {CURRENCY_INFO[c].flag} {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 border-t border-dashed border-slate-200" />
          <div className="flex gap-2">
            <button
              onClick={() => setSpeed("express")}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                speed === "express"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <Zap className="w-3 h-3" /> Express
            </button>
            <button
              onClick={() => setSpeed("economy")}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                speed === "economy"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <Clock className="w-3 h-3" /> Economy
            </button>
          </div>
          <div className="flex-1 border-t border-dashed border-slate-200" />
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
            El receptor recibe
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center px-3">
              <span className="text-lg font-bold text-blue-900">
                {result ? result.receiveAmount.toFixed(2) : "—"}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {availableReceive.map((c) => (
                <button
                  key={c}
                  onClick={() => setReceiveCurrency(c)}
                  className={`px-3 h-12 rounded-lg text-sm font-semibold border-2 transition-all ${
                    receiveCurrency === c
                      ? "bg-blue-900 text-white border-blue-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {CURRENCY_INFO[c].flag} {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Tasa de cambio</span>
              <span className="font-medium">1 {sendCurrency} = {result.exchangeRate.toFixed(4)} {receiveCurrency}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tarifa</span>
              <span className="font-medium">{CURRENCY_INFO[sendCurrency].symbol}{result.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
              <span>Total cobrado</span>
              <span>{CURRENCY_INFO[sendCurrency].symbol}{result.totalCharged.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {speed === "express" ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Llega en minutos
                </span>
              ) : (
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Llega en 1-3 días hábiles
                </span>
              )}
            </div>
          </div>
        )}

        <Button asChild className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white text-base font-semibold">
          <Link href="/auth/register">
            Enviar ahora <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>

        <p className="text-xs text-center text-slate-400">
          Sin cargos ocultos · Tasa garantizada por 30 min
        </p>
      </div>
    </div>
  );
}
