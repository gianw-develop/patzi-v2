"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlagMark, type FlagCountry } from "@/components/brand/FinancialMarks";
import { RefreshCw, Save, AlertCircle, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { useRatesStore, getEffectiveRate, PAIRS, type Pair } from "@/lib/rates-store";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAIR_META = PAIRS.map((pair) => {
  const [from, to] = pair.split("-");
  return { pair: pair as Pair, from, to };
});

const FLAG_BY_CURRENCY: Record<string, FlagCountry> = {
  EUR: "ES",
  USD: "US",
  PEN: "PE",
  VES: "VE",
};

export default function AdminRatesPage() {
  const { markups, setMarkup, setMarkups, fees, activePairs, setPricing, liveRates, lastUpdated, source, setLiveRates } = useRatesStore();
  const [inputs, setInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(PAIRS.map((p) => [p, String(markups[p as Pair] ?? 0)]))
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [customRateInputs, setCustomRateInputs] = useState<Record<string, string>>({});
  const [customRateEnabled, setCustomRateEnabled] = useState<Record<string, boolean>>({});
  const [savingCustom, setSavingCustom] = useState<Record<string, boolean>>({});
  const [feeFixedInputs, setFeeFixedInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(PAIRS.map((p) => [p, String(fees[p]?.fixed ?? 0)]))
  );
  const [feePercentInputs, setFeePercentInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(PAIRS.map((p) => [p, String(fees[p]?.percent ?? 0)]))
  );
  const [activeInputs, setActiveInputs] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PAIRS.map((p) => [p, activePairs.includes(p)]))
  );

  const handleSavePair = async (pair: Pair) => {
    const v = parseFloat(inputs[pair]);
    const fixedFee = parseFloat(feeFixedInputs[pair] ?? "0");
    const percentFee = parseFloat(feePercentInputs[pair] ?? "0");
    if (isNaN(v) || v < -50 || v > 50) { toast.error("Introduce un margen entre -50% y 50%"); return; }
    if (isNaN(fixedFee) || fixedFee < 0 || fixedFee > 10000) { toast.error("La comisión fija debe estar entre 0 y 10.000"); return; }
    if (isNaN(percentFee) || percentFee < 0 || percentFee > 50) { toast.error("La comisión porcentual debe estar entre 0% y 50%"); return; }
    setSaving((s) => ({ ...s, [pair]: true }));
    try {
      const [from, to] = pair.split("-");
      const supabase = createClient();
      const { error } = await supabase
        .from("exchange_rates")
        .update({
          markup_percent: v,
          fee_fixed: fixedFee,
          fee_percent: percentFee,
          updated_at: new Date().toISOString(),
        })
        .eq("from_currency", from)
        .eq("to_currency", to);
      if (error) throw new Error(error.message);
      setMarkup(pair, v);
      setPricing({ ...fees, [pair]: { fixed: fixedFee, percent: percentFee } }, activePairs);
      toast.success(`Precio ${pair} actualizado`);
    } catch (err) {
      toast.error(`Error guardando: ${(err as Error).message}`);
    } finally {
      setSaving((s) => ({ ...s, [pair]: false }));
    }
  };

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      setLiveRates(data.rates, data.updated_at, data.source);
      if (data.markups) {
        setMarkups(data.markups);
        setInputs(Object.fromEntries(Object.entries(data.markups).map(([k, v]) => [k, String(v)])));
      }
      if (data.fees) {
        setFeeFixedInputs(Object.fromEntries(Object.entries(data.fees).map(([key, value]) => [key, String((value as { fixed: number }).fixed)])));
        setFeePercentInputs(Object.fromEntries(Object.entries(data.fees).map(([key, value]) => [key, String((value as { percent: number }).percent)])));
      }
      if (data.activePairs) {
        setActiveInputs(Object.fromEntries(PAIRS.map((pair) => [pair, data.activePairs.includes(pair)])));
      }
      setPricing(data.fees ?? {}, data.activePairs ?? []);
      if (data.customRates) {
        setCustomRateInputs(Object.fromEntries(Object.entries(data.customRates).map(([k, v]) => [k, String(v)])));
        setCustomRateEnabled(Object.fromEntries(Object.keys(data.customRates).map((k) => [k, true])));
      }
      toast.success("Tasas actualizadas desde el mercado");
    } catch {
      toast.error("Error al obtener tasas. Usando valores anteriores.");
    } finally {
      setLoading(false);
    }
  }, [setLiveRates, setMarkups, setPricing]);

  useEffect(() => {
    if (Object.keys(liveRates).length === 0) fetchRates();
  }, [liveRates, fetchRates]);

  const handleSaveCustomRate = async (pair: Pair) => {
    const v = parseFloat(customRateInputs[pair] ?? "");
    const enabled = customRateEnabled[pair] ?? false;
    if (enabled && (isNaN(v) || v <= 0)) { toast.error("Introduce una tasa positiva válida"); return; }
    setSavingCustom((s) => ({ ...s, [pair]: true }));
    try {
      const [from, to] = pair.split("-");
      const supabase = createClient();
      const { error } = await supabase
        .from("exchange_rates")
        .update({ custom_rate: enabled ? v : null, use_custom_rate: enabled, updated_at: new Date().toISOString() })
        .eq("from_currency", from)
        .eq("to_currency", to);
      if (error) throw new Error(error.message);
      toast.success(enabled ? `Tasa paralela ${pair} = ${v} guardada` : `Tasa paralela ${pair} desactivada`);
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setSavingCustom((s) => ({ ...s, [pair]: false }));
    }
  };

  const handleTogglePair = async (pair: Pair) => {
    const nextValue = !(activeInputs[pair] ?? true);
    setActiveInputs((state) => ({ ...state, [pair]: nextValue }));
    try {
      const [from, to] = pair.split("-");
      const supabase = createClient();
      const { error } = await supabase
        .from("exchange_rates")
        .update({ is_active: nextValue, updated_at: new Date().toISOString() })
        .eq("from_currency", from)
        .eq("to_currency", to);
      if (error) throw new Error(error.message);
      const nextActivePairs = nextValue
        ? Array.from(new Set([...activePairs, pair]))
        : activePairs.filter((item) => item !== pair);
      setPricing(fees, nextActivePairs);
      toast.success(`${pair} ${nextValue ? "activado" : "pausado"}`);
    } catch (error) {
      setActiveInputs((state) => ({ ...state, [pair]: !nextValue }));
      toast.error(`No se pudo actualizar: ${(error as Error).message}`);
    }
  };

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
            const marketRate = liveRates[pair];
            const effective = marketRate ? getEffectiveRate(pair, liveRates, markups) : null;
            const pairMarkup = markups[pair] ?? 0;
            return (
              <Card key={pair} className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <FlagMark country={FLAG_BY_CURRENCY[from]} className="h-4 w-6" />
                    <span className="text-slate-300">→</span>
                    <FlagMark country={FLAG_BY_CURRENCY[to]} className="h-4 w-6" />
                    <span className="font-bold text-slate-700 ml-1">{from} / {to}</span>
                    <button type="button" onClick={() => handleTogglePair(pair)} className="ml-auto flex items-center gap-1.5 text-xs">
                      {activeInputs[pair] ? <><ToggleRight className="h-5 w-5 text-emerald-600" /><span className="font-medium text-emerald-700">Activo</span></> : <><ToggleLeft className="h-5 w-5 text-slate-400" /><span className="text-slate-400">Pausado</span></>}
                    </button>
                  </div>

                  {/* Markup input per pair */}
                  <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">Margen Patzi</p>
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
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 text-[10px] font-medium text-slate-500">Comisión fija ({from})
                      <Input type="number" min="0" step="0.01" value={feeFixedInputs[pair] ?? "0"} onChange={(event) => setFeeFixedInputs((state) => ({ ...state, [pair]: event.target.value }))} className="h-9 font-semibold" />
                    </label>
                    <label className="space-y-1 text-[10px] font-medium text-slate-500">Comisión porcentual
                      <div className="relative"><Input type="number" min="0" max="50" step="0.1" value={feePercentInputs[pair] ?? "0"} onChange={(event) => setFeePercentInputs((state) => ({ ...state, [pair]: event.target.value }))} className="h-9 pr-7 font-semibold" /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">El margen se incluye en la tasa; la comisión se descuenta del monto antes de convertir.</p>

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

                  {/* Custom rate (parallel market) */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">Tasa paralela / manual</p>
                      <button
                        onClick={() => setCustomRateEnabled((s) => ({ ...s, [pair]: !s[pair] }))}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        {customRateEnabled[pair]
                          ? <><ToggleRight className="w-5 h-5 text-emerald-600" /><span className="text-emerald-600 font-medium">Activa</span></>
                          : <><ToggleLeft className="w-5 h-5 text-slate-400" /><span className="text-slate-400">Desactivada</span></>}
                      </button>
                    </div>
                    {customRateEnabled[pair] && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={customRateInputs[pair] ?? ""}
                          onChange={(e) => setCustomRateInputs((s) => ({ ...s, [pair]: e.target.value }))}
                          className="h-9 font-semibold"
                          step="0.0001" min="0"
                          placeholder="Ej: 605"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveCustomRate(pair)}
                          disabled={savingCustom[pair]}
                          className="h-9 bg-emerald-700 hover:bg-emerald-600 text-white px-3 whitespace-nowrap"
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          {savingCustom[pair] ? "..." : "Guardar"}
                        </Button>
                      </div>
                    )}
                    {!customRateEnabled[pair] && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleSaveCustomRate(pair)}
                        disabled={savingCustom[pair]}
                        className="h-8 text-xs w-full"
                      >
                        {savingCustom[pair] ? "..." : "Desactivar y usar API"}
                      </Button>
                    )}
                    <p className="text-[10px] text-slate-400">Cuando está activa, reemplaza la tasa de la API (útil para mercado paralelo VES).</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
