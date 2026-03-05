"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, Edit2, Save, RefreshCw, AlertCircle } from "lucide-react";
import { EXCHANGE_RATES, CURRENCY_INFO } from "@/lib/exchange-rates";
import type { ExchangeRate } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>(Object.values(EXCHANGE_RATES));
  const [editing, setEditing] = useState<ExchangeRate | null>(null);
  const [form, setForm] = useState({ rate: "", markup_percent: "", fee_fixed: "", fee_percent: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (r: ExchangeRate) => {
    setEditing(r);
    setForm({
      rate: String(r.rate),
      markup_percent: String(r.markup_percent),
      fee_fixed: String(r.fee_fixed),
      fee_percent: String(r.fee_percent),
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setRates((prev) =>
      prev.map((r) =>
        r.id === editing.id
          ? {
              ...r,
              rate: parseFloat(form.rate),
              markup_percent: parseFloat(form.markup_percent),
              fee_fixed: parseFloat(form.fee_fixed),
              fee_percent: parseFloat(form.fee_percent),
              updated_at: new Date().toISOString(),
            }
          : r
      )
    );
    setSaving(false);
    setEditing(null);
    toast.success(`Tasa ${editing.from_currency}→${editing.to_currency} actualizada`);
  };

  const effectiveRate = (r: ExchangeRate) => r.rate * (1 - r.markup_percent / 100);

  return (
    <>
      <Header title="Tasas de cambio" subtitle="Configura las tasas y fees para cada corredor" />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Cambios en tiempo real</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Los cambios en tasas afectarán a todos los cálculos nuevos. Las transferencias confirmadas mantienen la tasa original garantizada.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rates.map((rate) => {
            const fromInfo = CURRENCY_INFO[rate.from_currency];
            const toInfo = CURRENCY_INFO[rate.to_currency];
            const effective = effectiveRate(rate);
            return (
              <Card key={rate.id} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{fromInfo.flag}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-2xl">{toInfo.flag}</span>
                      <CardTitle className="text-base font-bold text-slate-800">
                        {rate.from_currency}/{rate.to_currency}
                      </CardTitle>
                    </div>
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-blue-600" onClick={() => openEdit(rate)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Tasa de mercado</p>
                    <p className="text-xl font-bold text-blue-900">
                      1 {rate.from_currency} = {rate.rate.toFixed(4)} {rate.to_currency}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Tasa efectiva (con markup {rate.markup_percent}%)</p>
                    <p className="text-lg font-bold text-emerald-700">
                      1 {rate.from_currency} = {effective.toFixed(4)} {rate.to_currency}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Tarifa fija</p>
                      <p className="font-bold text-slate-800">{fromInfo.symbol}{rate.fee_fixed.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500">Tarifa %</p>
                      <p className="font-bold text-slate-800">{rate.fee_percent}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Actualizado {format(new Date(rate.updated_at), "d MMM yyyy HH:mm", { locale: es })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        {editing && (
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Editar {editing.from_currency} → {editing.to_currency}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div>
                <Label>Tasa de mercado base</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    1 {editing.from_currency} =
                  </span>
                  <Input
                    type="number"
                    value={form.rate}
                    onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
                    className="pl-24 h-10"
                    step="0.0001"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label>Markup / spread (%)</Label>
                <p className="text-xs text-slate-500 mb-1">Margen aplicado sobre la tasa de mercado</p>
                <Input
                  type="number"
                  value={form.markup_percent}
                  onChange={(e) => setForm((p) => ({ ...p, markup_percent: e.target.value }))}
                  className="h-10"
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tarifa fija ({CURRENCY_INFO[editing.from_currency].symbol})</Label>
                  <Input
                    type="number"
                    value={form.fee_fixed}
                    onChange={(e) => setForm((p) => ({ ...p, fee_fixed: e.target.value }))}
                    className="mt-1.5 h-10"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Tarifa porcentual (%)</Label>
                  <Input
                    type="number"
                    value={form.fee_percent}
                    onChange={(e) => setForm((p) => ({ ...p, fee_percent: e.target.value }))}
                    className="mt-1.5 h-10"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              {form.rate && form.markup_percent && (
                <div className="bg-blue-50 rounded-lg p-3 text-xs">
                  <p className="text-slate-500 mb-0.5">Vista previa tasa efectiva:</p>
                  <p className="font-bold text-blue-900 text-sm">
                    1 {editing.from_currency} = {(parseFloat(form.rate) * (1 - parseFloat(form.markup_percent) / 100)).toFixed(4)} {editing.to_currency}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-900 hover:bg-blue-800 text-white">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {saving ? "Guardando..." : "Guardar tasa"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
