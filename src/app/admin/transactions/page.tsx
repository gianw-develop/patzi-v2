"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, CheckCircle2, Clock, RefreshCw, AlertCircle,
  ArrowRight, Zap, MoreVertical, Eye, Upload, FileCheck2, ExternalLink,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_TRANSFERS, MOCK_USERS } from "@/lib/mock-data";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Transfer, TransferStatus } from "@/types";

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-700 border-blue-200", icon: RefreshCw },
  completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
};

export default function AdminTransactionsPage() {
  const [transfers, setTransfers] = useState<Transfer[]>(MOCK_TRANSFERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [proofDialog, setProofDialog] = useState<Transfer | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofUploading, setProofUploading] = useState(false);

  const filtered = transfers.filter((t) => {
    const matchSearch =
      t.beneficiary_name.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const changeStatus = (id: string, newStatus: TransferStatus, proofUrl?: string, note?: string) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              proof_url: proofUrl ?? t.proof_url,
              proof_note: note ?? t.proof_note,
              status_history: [
                ...t.status_history,
                { status: newStatus, timestamp: new Date().toISOString(), note: note || "Actualizado por admin" },
              ],
            }
          : t
      )
    );
    toast.success(`Estado actualizado a: ${STATUS_CONFIG[newStatus].label}`);
    setSelected(null);
  };

  const handleOpenProofDialog = (t: Transfer) => {
    setProofDialog(t);
    setProofNote("");
    setProofFile(null);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("El archivo no puede superar 5 MB"); return; }
    setProofUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofFile(ev.target?.result as string);
      setProofUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteWithProof = () => {
    if (!proofDialog) return;
    const url = proofFile || `https://placehold.co/600x400/e8f5e9/2e7d32?text=Comprobante+${proofDialog.reference}`;
    changeStatus(proofDialog.id, "completed", url, proofNote || "Pago completado y verificado por el equipo Patzi");
    setProofDialog(null);
    toast.success("Transferencia completada con comprobante adjunto");
  };

  const totalVolume = filtered.reduce((acc, t) => acc + t.send_amount, 0);
  const totalFees = filtered.reduce((acc, t) => acc + t.fee, 0);

  return (
    <>
      <Header title="Transacciones" subtitle={`${filtered.length} transacciones · Volumen: €${totalVolume.toFixed(2)}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["all", "pending", "processing", "completed"] as const).map((s) => {
            const count = s === "all" ? transfers.length : transfers.filter((t) => t.status === s).length;
            const cfg = s === "all" ? null : STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${statusFilter === s ? "border-blue-900 bg-blue-50" : "border-slate-200 hover:border-blue-300 bg-white"}`}
              >
                <p className="text-xl font-bold text-slate-800">{count}</p>
                <p className={`text-xs font-medium mt-0.5 ${cfg ? cfg.color.split(" ")[1] : "text-slate-500"}`}>
                  {s === "all" ? "Total" : cfg?.label}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por beneficiario o referencia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-10">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {(Object.keys(STATUS_CONFIG) as TransferStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Referencia", "Usuario", "Corredor", "Monto envío", "Monto recibido", "Fee", "Velocidad", "Estado", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => {
                  const cfg = STATUS_CONFIG[t.status];
                  const StatusIcon = cfg.icon;
                  const user = MOCK_USERS.find((u) => u.id === t.user_id);
                  const fromInfo = CURRENCY_INFO[t.send_currency];
                  const toInfo = CURRENCY_INFO[t.receive_currency];
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-blue-700 font-semibold">{t.reference}</p>
                        <p className="text-xs text-slate-400">{format(new Date(t.created_at), "d MMM HH:mm", { locale: es })}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">{user?.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-lg">
                          <span>{fromInfo.flag}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span>{toInfo.flag}</span>
                        </div>
                        <p className="text-xs text-slate-500">{t.send_currency}→{t.receive_currency}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {fromInfo.symbol}{t.send_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-900">
                        {toInfo.symbol}{t.receive_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-medium">
                        {fromInfo.symbol}{t.fee.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {t.speed === "express" ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <Zap className="w-3 h-3" /> Express
                          </span>
                        ) : (
                          <span className="text-blue-600 text-xs font-medium">Economy</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border ${cfg.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelected(t)} className="cursor-pointer">
                              <Eye className="w-3.5 h-3.5 mr-2" /> Ver detalle
                            </DropdownMenuItem>
                            {t.status === "pending" && (
                              <DropdownMenuItem onClick={() => changeStatus(t.id, "processing")} className="cursor-pointer text-blue-600">
                                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Marcar procesando
                              </DropdownMenuItem>
                            )}
                            {t.status === "processing" && (
                              <DropdownMenuItem onClick={() => handleOpenProofDialog(t)} className="cursor-pointer text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Completar con comprobante
                              </DropdownMenuItem>
                            )}
                            {["pending", "processing"].includes(t.status) && (
                              <DropdownMenuItem onClick={() => changeStatus(t.id, "failed")} className="cursor-pointer text-red-600">
                                <AlertCircle className="w-3.5 h-3.5 mr-2" /> Marcar fallido
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm">No se encontraron transacciones</p>
              </div>
            )}
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">{filtered.length} transacciones</span>
            <div className="flex gap-4">
              <span className="text-slate-600">Volumen: <strong className="text-slate-800">€{totalVolume.toFixed(2)}</strong></span>
              <span className="text-emerald-600">Fees: <strong>€{totalFees.toFixed(2)}</strong></span>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                {CURRENCY_INFO[selected.send_currency].flag} → {CURRENCY_INFO[selected.receive_currency].flag} {selected.reference}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Enviado</p>
                  <p className="text-xl font-bold text-slate-800">
                    {CURRENCY_INFO[selected.send_currency].symbol}{selected.send_amount}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className="text-center">
                  <p className="text-xs text-slate-500">Recibido</p>
                  <p className="text-xl font-bold text-blue-900">
                    {CURRENCY_INFO[selected.receive_currency].symbol}{selected.receive_amount.toFixed(2)}
                  </p>
                </div>
              </div>
              {[
                ["Beneficiario", selected.beneficiary_name],
                ["Método", selected.delivery_app || (selected.delivery_method === "bank" ? "Transferencia bancaria" : "Pago móvil")],
                ["Tasa", `1 ${selected.send_currency} = ${selected.exchange_rate.toFixed(4)} ${selected.receive_currency}`],
                ["Fee cobrado", `${CURRENCY_INFO[selected.send_currency].symbol}${selected.fee.toFixed(2)}`],
                ["Velocidad", selected.speed === "express" ? "⚡ Express" : "🕐 Economy"],
                ["Creado", format(new Date(selected.created_at), "d MMM yyyy HH:mm", { locale: es })],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-slate-50 py-1.5">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800">{value}</span>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Historial de estados</p>
                <div className="space-y-1.5">
                  {selected.status_history.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[h.status].color.split(" ")[0]}`} />
                      <span className="font-medium text-slate-700">{STATUS_CONFIG[h.status].label}</span>
                      <span className="text-slate-400 ml-auto">{format(new Date(h.timestamp), "d MMM HH:mm", { locale: es })}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selected.proof_url && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-800">Comprobante adjunto</p>
                  </div>
                  {selected.proof_note && <p className="text-xs text-emerald-700">{selected.proof_note}</p>}
                  <a href={selected.proof_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline">
                    <ExternalLink className="w-3 h-3" /> Ver comprobante
                  </a>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {selected.status === "pending" && (
                  <Button size="sm" onClick={() => changeStatus(selected.id, "processing")} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    Marcar procesando
                  </Button>
                )}
                {selected.status === "processing" && (
                  <Button size="sm" onClick={() => { setSelected(null); handleOpenProofDialog(selected); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completar con comprobante
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelected(null)} className="flex-1 text-xs">Cerrar</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!proofDialog} onOpenChange={() => setProofDialog(null)}>
        {proofDialog && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Completar transferencia · {proofDialog.reference}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="bg-slate-50 rounded-xl p-3 text-sm flex justify-between">
                <span className="text-slate-500">Beneficiario</span>
                <span className="font-semibold text-slate-800">{proofDialog.beneficiary_name}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-sm flex justify-between">
                <span className="text-slate-500">Monto</span>
                <span className="font-bold text-blue-900">
                  {CURRENCY_INFO[proofDialog.receive_currency].symbol}
                  {proofDialog.receive_amount.toFixed(2)} {proofDialog.receive_currency}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Comprobante de pago <span className="text-slate-400 font-normal">(imagen o PDF · máx. 5 MB)</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${proofFile ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-blue-300 bg-slate-50"}`}>
                  <input type="file" accept="image/*,application/pdf" onChange={handleProofFileChange} className="hidden" />
                  {proofFile ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-700">Comprobante cargado ✓</p>
                      <p className="text-xs text-emerald-600">Haz clic para reemplazar</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300" />
                      <p className="text-sm text-slate-500">{proofUploading ? "Procesando..." : "Haz clic para subir el comprobante"}</p>
                      <p className="text-xs text-slate-400">PNG, JPG, PDF</p>
                    </>
                  )}
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Nota de verificación <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Ej: Transferencia BCP completada. Ref: BCP-20260305-1234."
                  className="w-full min-h-[72px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/40"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setProofDialog(null)} className="flex-1">Cancelar</Button>
                <Button
                  onClick={handleCompleteWithProof}
                  disabled={proofUploading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {proofUploading ? "Procesando..." : "Confirmar y completar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
