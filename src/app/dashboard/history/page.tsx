"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, CheckCircle2, Clock, RefreshCw, AlertCircle,
  ArrowRight, Zap, Filter, FileCheck2, ExternalLink,
} from "lucide-react";
import { useTransferStore } from "@/lib/transfer-store";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Transfer } from "@/types";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-700 border-blue-200", icon: RefreshCw },
  completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
};

const TRACKER_STEPS = ["pending", "processing", "completed"];

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Transfer | null>(null);
  const allTransfers = useTransferStore((s) => s.transfers);

  const transfers = allTransfers.filter((t) => {
    const matchSearch = t.beneficiary_name.toLowerCase().includes(search.toLowerCase())
      || t.reference.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const currentStepIndex = (t: Transfer) => {
    const idx = TRACKER_STEPS.indexOf(t.status);
    return idx === -1 ? (t.status === "completed" ? 2 : 0) : idx;
  };

  return (
    <>
      <Header title="Historial de transferencias" subtitle="Consulta el estado de todos tus envíos" />
      <div className="flex-1 p-3 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o referencia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { value: "all", label: "Todos" },
              { value: "pending", label: "Pendientes" },
              { value: "processing", label: "En proceso" },
              { value: "completed", label: "Completados" },
              { value: "failed", label: "Fallidos" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filter === f.value ? "bg-blue-900 text-white border-blue-900" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {transfers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Filter className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No se encontraron transferencias</p>
              <p className="text-sm text-slate-400 mt-1">Intenta con otros filtros o términos de búsqueda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => {
              const config = STATUS_CONFIG[transfer.status];
              const StatusIcon = config.icon;
              const fromInfo = CURRENCY_INFO[transfer.send_currency];
              const toInfo = CURRENCY_INFO[transfer.receive_currency];
              return (
                <Card
                  key={transfer.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelected(transfer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-2xl flex-shrink-0">
                        <span>{fromInfo.flag}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-1" />
                        <span>{toInfo.flag}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-800 text-sm truncate">{transfer.beneficiary_name}</p>
                          {transfer.speed === "express" && (
                            <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
                              <Zap className="w-3 h-3" /> Express
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {fromInfo.symbol}{transfer.send_amount} → {toInfo.symbol}{transfer.receive_amount.toFixed(2)} {transfer.receive_currency}
                          {" · "}{format(new Date(transfer.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge className={`text-xs border ${config.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                        <p className="text-xs text-slate-400">{transfer.reference}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                {CURRENCY_INFO[selected.send_currency].flag} → {CURRENCY_INFO[selected.receive_currency].flag}{" "}
                Transferencia {selected.reference}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Enviado</p>
                  <p className="text-xl font-bold text-slate-800">
                    {CURRENCY_INFO[selected.send_currency].symbol}{selected.send_amount}
                  </p>
                  <p className="text-xs text-slate-500">{selected.send_currency}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Recibido</p>
                  <p className="text-xl font-bold text-blue-900">
                    {CURRENCY_INFO[selected.receive_currency].symbol}{selected.receive_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">{selected.receive_currency}</p>
                </div>
              </div>

              <div className="relative">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Seguimiento</p>
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 z-0" />
                  <div
                    className="absolute top-4 left-8 h-0.5 bg-emerald-500 z-0 transition-all"
                    style={{ width: `${(currentStepIndex(selected) / (TRACKER_STEPS.length - 1)) * (100 - 16)}%` }}
                  />
                  {TRACKER_STEPS.map((stepKey, idx) => {
                    const cfg = STATUS_CONFIG[stepKey as keyof typeof STATUS_CONFIG];
                    const StepIcon = cfg.icon;
                    const reached = idx <= currentStepIndex(selected);
                    return (
                      <div key={stepKey} className="relative z-10 flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reached ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <p className={`text-xs font-medium ${reached ? "text-emerald-600" : "text-slate-400"}`}>
                          {cfg.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ["Beneficiario", selected.beneficiary_name],
                  ["País destino", selected.beneficiary_country],
                  ["Método de entrega", selected.delivery_app || (selected.delivery_method === "bank" ? "Transferencia bancaria" : "Pago móvil")],
                  ["Tasa aplicada", `1 ${selected.send_currency} = ${selected.exchange_rate.toFixed(4)} ${selected.receive_currency}`],
                  ["Comisión", "Gratis ✓"],
                  ["Fecha", format(new Date(selected.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              {selected.status === "completed" && selected.proof_url && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">Comprobante de pago disponible</p>
                  </div>
                  {selected.proof_note && (
                    <p className="text-xs text-emerald-700 leading-relaxed">{selected.proof_note}</p>
                  )}
                  <a
                    href={selected.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver comprobante de pago
                  </a>
                </div>
              )}

              {selected.status === "completed" && !selected.proof_url && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">Comprobante no disponible aún</p>
                </div>
              )}

              <Button onClick={() => setSelected(null)} variant="outline" className="w-full">Cerrar</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
