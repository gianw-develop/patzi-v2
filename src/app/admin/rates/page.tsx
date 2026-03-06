"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Save, AlertCircle, Zap } from "lucide-react";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { useRatesStore, getEffectiveRate, PAIRS, type Pair } from "@/lib/rates-store";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAIR_META = PAIRS.map((pair) => {
  const [from, to] = pair.split("-");
  return { pair: pair as Pair, from, to };
});

export default function AdminRatesPage() {
  const { markups, setMarkup, liveRates, lastUpdated, source, setLiveRates } = useRatesStore();
  const [inputs, setInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(PAIRS.map((p) => [p, String(markups[p as Pair] ?? 0)]))
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const handleSavePair = async (pair: Pair) => {
    const v = parseFloat(inputs[pair]);
    if (isNaN(v) || v < -50 || v > 50) { toast.error("Introduce un margen entre -50% y 50%"); return; }
    setSaving((s) => ({ ...s, [pair]: true }));
    await new Promise((r) => setTimeout(r, 300));
    setMarkup(pair, v);
    setSaving((s) => ({ ...s, [pair]: false }));
    toast.success(`Margen ${pair} actualizado a ${v}%`);
  };

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      setLiveRates(data.rates, data.updated_at, data.source);
      toast.success("Tasas actualizadas desde el mercado");
    } catch {
      toast.error("Error al obtener tasas. Usando valores anteriores.");
    } finally {
      setLoading(false);
    }
  }, [setLiveRates]);

  useEffect(() => {
    if (Object.keys(liveRates).length === 0) fetchRates();
  }, [liveRates, fetchRates]);

  const hasRates = Object.keys(liveRates).length > 0;

  return (
    <>
      <Header title="Tasas de cambio" subtitle="Configura el margen por corredor y consulta las tasas del mercado" />
      <div className="flex-1 p-3 sm:p-6 space-y-5">

        {/* Live rates table */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Tasas del mercado hoy</h3>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                {source === "fallback" ? "Tasas de respaldo" : `Actualizado ${format(new Date(lastUpdated), "d MMM HH:mm", { locale: es })}`}
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRates}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Actualizando..." : "Actualizar ahora"}
            </Button>
          </div>
        </div>

        {!hasRates && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">Cargando tasas del mercado...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PAIR_META.map(({ pair, from, to }) => {
            const fromInfo = CURRENCY_INFO[from as keyof typeof CURRENCY_INFO];
            const toInfo = CURRENCY_INFO[to as keyof typeof CURRENCY_INFO];
            const marketRate = liveRates[pair];
            const effective = marketRate ? getEffectiveRate(pair, liveRates, markups) : null;
            const pairMarkup = markups[pair] ?? 0;
            return (
              <Card key={pair} className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{fromInfo?.flag}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-2xl">{toInfo?.flag}</span>
                    <span className="font-bold text-slate-700 ml-1">{from} / {to}</span>
                  </div>

                  {/* Markup input per pair */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={inputs[pair] ?? ""}
                        onChange={(e) => setInputs((s) => ({ ...s, [pair]: e.target.value }))}
                        className="h-9 pr-7 font-semibold"
                        step="0.1" min="-50" max="50"
                        placeholder="0"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSavePair(pair)}
                      disabled={saving[pair]}
                      className="h-9 bg-blue-900 hover:bg-blue-800 text-white px-3"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      {saving[pair] ? "..." : "Guardar"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400">Margen actual: <strong className="text-slate-600">{pairMarkup}%</strong></p>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Tasa de mercado</p>
                    <p className="text-base font-bold text-slate-700">
                      {marketRate ? `1 ${from} = ${marketRate.toFixed(4)} ${to}` : "—"}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Tasa cliente (margen {pairMarkup}%)</p>
                    <p className="text-base font-bold text-emerald-700">
                      {effective ? `1 ${from} = ${effective.toFixed(4)} ${to}` : "—"}
                    </p>
                  </div>
                  {marketRate && effective && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-500" />
                      Retienes: {(marketRate - effective).toFixed(4)} {to} por unidad
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
