"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, RefreshCw, Save, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { useRatesStore, getEffectiveRate } from "@/lib/rates-store";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAIRS = [
  { pair: "EUR-PEN", from: "EUR", to: "PEN" },
  { pair: "EUR-VES", from: "EUR", to: "VES" },
  { pair: "EUR-USD", from: "EUR", to: "USD" },
  { pair: "USD-PEN", from: "USD", to: "PEN" },
  { pair: "USD-VES", from: "USD", to: "VES" },
  { pair: "USD-EUR", from: "USD", to: "EUR" },
];

export default function AdminRatesPage() {
  const { markup, setMarkup, liveRates, lastUpdated, source, setLiveRates } = useRatesStore();
  const [markupInput, setMarkupInput] = useState(String(markup));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSaveMarkup = async () => {
    const v = parseFloat(markupInput);
    if (isNaN(v) || v < 0 || v > 20) {
      toast.error("Introduce un margen entre 0% y 20%");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setMarkup(v);
    setSaving(false);
    toast.success(`Margen global actualizado a ${v}%`);
  };

  const hasRates = Object.keys(liveRates).length > 0;

  return (
    <>
      <Header title="Tasas de cambio" subtitle="Tasas del mercado en tiempo real con tu margen aplicado" />
      <div className="flex-1 p-3 sm:p-6 space-y-5">

        {/* Markup editor */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Margen global (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Este porcentaje se descuenta de la tasa de mercado en todos los corredores.
              Por ejemplo, con un margen de <strong>2%</strong>, si el mercado ofrece
              1 EUR = 4.20 PEN, el cliente recibe 1 EUR = 4.116 PEN y t\u00fa retienes la diferencia.
            </p>
            <div className="flex items-end gap-3 max-w-xs">
              <div className="flex-1">
                <Label>Margen aplicado</Label>
                <div className="relative mt-1.5">
                  <Input
                    type="number"
                    value={markupInput}
                    onChange={(e) => setMarkupInput(e.target.value)}
                    className="h-11 pr-8 text-lg font-bold"
                    step="0.1"
                    min="0"
                    max="20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">%</span>
                </div>
              </div>
              <Button
                onClick={handleSaveMarkup}
                disabled={saving}
                className="h-11 bg-blue-900 hover:bg-blue-800 text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Margen actual: <strong className="ml-1">{markup}%</strong>
            </p>
          </CardContent>
        </Card>

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
          {PAIRS.map(({ pair, from, to }) => {
            const fromInfo = CURRENCY_INFO[from as keyof typeof CURRENCY_INFO];
            const toInfo = CURRENCY_INFO[to as keyof typeof CURRENCY_INFO];
            const marketRate = liveRates[pair];
            const effective = marketRate ? getEffectiveRate(pair, liveRates, markup) : null;
            return (
              <Card key={pair} className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{fromInfo?.flag}</span>
                    <span className="text-slate-300">\u2192</span>
                    <span className="text-2xl">{toInfo?.flag}</span>
                    <span className="font-bold text-slate-700 ml-1">{from} / {to}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Tasa de mercado</p>
                    <p className="text-lg font-bold text-slate-700">
                      {marketRate ? `1 ${from} = ${marketRate.toFixed(4)} ${to}` : "—"}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Tasa cliente (margen {markup}%)</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {effective ? `1 ${from} = ${effective.toFixed(4)} ${to}` : "—"}
                    </p>
                  </div>
                  {marketRate && effective && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-500" />
                      Diferencia: {(marketRate - effective).toFixed(4)} {to} por unidad
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
