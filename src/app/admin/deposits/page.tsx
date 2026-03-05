"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Clock, CheckCircle2, XCircle, Building2,
  Smartphone, Filter, ZoomIn, Eye,
} from "lucide-react";
import { useDepositStore } from "@/lib/deposit-store";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DepositRequest } from "@/lib/deposit-store";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending:  { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: Clock },
  approved: { label: "Aprobado",  color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-700 border-red-200",             icon: XCircle },
};

export default function AdminDepositsPage() {
  const { requests, updateStatus } = useDepositStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<DepositRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [imageZoom, setImageZoom] = useState(false);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const handleApprove = (r: DepositRequest) => {
    updateStatus(r.id, "approved");
    toast.success(`Recarga de ${CURRENCY_INFO[r.currency].symbol}${r.amount.toFixed(2)} aprobada`);
    setSelected(null);
  };

  const handleReject = (r: DepositRequest) => {
    updateStatus(r.id, "rejected", rejectNote || "Comprobante no válido");
    toast.error(`Recarga rechazada`);
    setRejectNote("");
    setSelected(null);
  };

  return (
    <>
      <Header
        title="Solicitudes de recarga"
        subtitle="Revisa y aprueba los comprobantes de pago enviados por los usuarios"
      />
      <div className="flex-1 p-3 sm:p-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pendientes", value: requests.filter((r) => r.status === "pending").length, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
            { label: "Aprobadas", value: requests.filter((r) => r.status === "approved").length, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            { label: "Rechazadas", value: requests.filter((r) => r.status === "rejected").length, color: "text-red-700 bg-red-50 border-red-200" },
          ].map((s) => (
            <Card key={s.label} className={`border ${s.color} shadow-none`}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-xs font-semibold mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por usuario o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: "all", label: "Todos" },
              { value: "pending", label: `Pendientes${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
              { value: "approved", label: "Aprobados" },
              { value: "rejected", label: "Rechazados" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filter === f.value
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Filter className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay solicitudes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const CfgIcon = cfg.icon;
              const info = CURRENCY_INFO[r.currency];
              return (
                <Card key={r.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(r)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Proof thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        {r.proof_data_url.startsWith("data:image") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.proof_data_url} alt="proof" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Eye className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-800 text-sm">{r.user_name}</p>
                          <Badge className={`text-[10px] border ${cfg.color} flex items-center gap-1`}>
                            <CfgIcon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          <span className="font-bold text-slate-800">{info.symbol}{r.amount.toFixed(2)} {r.currency}</span>
                          {" · "}{r.method_label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(r.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                          {" · "}{r.proof_file_name}
                        </p>
                      </div>

                      {r.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs"
                            onClick={(e) => { e.stopPropagation(); handleApprove(r); }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-3 text-xs"
                            onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Revisar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setRejectNote(""); }}>
        {selected && (
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                {selected.method === "bank"
                  ? <Building2 className="w-4 h-4 text-blue-700" />
                  : <Smartphone className="w-4 h-4 text-emerald-600" />
                }
                Solicitud de recarga · {selected.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Usuario", selected.user_name],
                  ["Importe", `${CURRENCY_INFO[selected.currency].symbol}${selected.amount.toFixed(2)} ${selected.currency}`],
                  ["Método", selected.method_label],
                  ["Fecha", format(new Date(selected.created_at), "d MMM yyyy, HH:mm", { locale: es })],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Proof preview */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Comprobante adjunto</p>
                {selected.proof_data_url.startsWith("data:image") ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.proof_data_url}
                      alt="comprobante"
                      className={`w-full object-contain transition-all cursor-zoom-in ${imageZoom ? "max-h-none" : "max-h-48"}`}
                      onClick={() => setImageZoom((z) => !z)}
                    />
                    <button
                      className="absolute top-2 right-2 bg-white/80 rounded-lg p-1 shadow text-slate-600 hover:bg-white"
                      onClick={() => setImageZoom((z) => !z)}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-3 bg-slate-50">
                    <Eye className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{selected.proof_file_name}</p>
                      <p className="text-xs text-slate-400">PDF · haz clic para descargar</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status badge */}
              {selected.status !== "pending" && (
                <div className={`rounded-xl p-3 border text-sm ${STATUS_CONFIG[selected.status].color}`}>
                  <p className="font-semibold">
                    {selected.status === "approved" ? "✓ Aprobado" : "✗ Rechazado"}
                    {selected.reviewed_at && ` · ${format(new Date(selected.reviewed_at), "d MMM yyyy, HH:mm", { locale: es })}`}
                  </p>
                  {selected.admin_note && (
                    <p className="text-xs mt-0.5 opacity-80">{selected.admin_note}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              {selected.status === "pending" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</p>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Nota (opcional, visible al rechazar)</label>
                    <Input
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Ej: Imagen borrosa, monto incorrecto..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(selected)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar recarga
                    </Button>
                    <Button
                      onClick={() => handleReject(selected)}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Rechazar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
