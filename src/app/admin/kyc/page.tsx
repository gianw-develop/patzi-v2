"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Eye, FileText, AlertCircle } from "lucide-react";
import { MOCK_USERS } from "@/lib/mock-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { User, KYCStatus } from "@/types";

export default function AdminKYCPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS.filter((u) => u.role === "user"));
  const [selected, setSelected] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const pendingUsers = users.filter((u) => u.kyc_status === "pending");
  const submittedAll = users.filter((u) => u.kyc_status !== "not_submitted");

  const handleApprove = (user: User) => {
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, kyc_status: "approved" as KYCStatus } : u));
    toast.success(`KYC de ${user.full_name} aprobado`);
    setSelected(null);
    setAction(null);
  };

  const handleReject = (user: User) => {
    if (!rejectReason.trim()) { toast.error("Ingresa un motivo de rechazo"); return; }
    setUsers((prev) => prev.map((u) =>
      u.id === user.id ? { ...u, kyc_status: "rejected" as KYCStatus, kyc_rejection_reason: rejectReason } : u
    ));
    toast.success(`KYC de ${user.full_name} rechazado`);
    setSelected(null);
    setAction(null);
    setRejectReason("");
  };

  const KYC_CONFIG = {
    not_submitted: { label: "Sin enviar", color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
    pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
    approved: { label: "Aprobado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    rejected: { label: "Rechazado", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  };

  return (
    <>
      <Header title="Verificación KYC" subtitle={`${pendingUsers.length} solicitudes pendientes de revisión`} />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Pendientes", count: users.filter((u) => u.kyc_status === "pending").length, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Aprobados", count: users.filter((u) => u.kyc_status === "approved").length, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Rechazados", count: users.filter((u) => u.kyc_status === "rejected").length, color: "text-red-600", bg: "bg-red-50" },
            { label: "Sin enviar", count: users.filter((u) => u.kyc_status === "not_submitted").length, color: "text-slate-600", bg: "bg-slate-100" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <span className={`text-xl font-bold ${s.color}`}>{s.count}</span>
                </div>
                <p className="text-sm font-medium text-slate-700">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingUsers.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" /> Solicitudes pendientes
            </h3>
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <Card key={user.id} className="border-0 shadow-sm border-l-4 border-l-yellow-400">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold flex-shrink-0">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email} · Enviado: {format(new Date(user.updated_at), "d MMM yyyy HH:mm", { locale: es })}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(user); setAction(null); }} className="text-slate-600">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(user)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelected(user); setAction("reject"); }} className="border-red-300 text-red-600 hover:bg-red-50">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" /> Historial de solicitudes
          </h3>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Usuario", "Email", "Estado KYC", "Fecha envío", "Acciones"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {submittedAll.map((user) => {
                    const cfg = KYC_CONFIG[user.kyc_status];
                    const CfgIcon = cfg.icon;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                              {user.full_name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-slate-800">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs border ${cfg.color} flex items-center gap-1 w-fit`}>
                            <CfgIcon className="w-3 h-3" /> {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {format(new Date(user.updated_at), "d MMM yyyy", { locale: es })}
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost" onClick={() => { setSelected(user); setAction(null); }} className="text-blue-600 h-7 text-xs">
                            Ver detalle
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setAction(null); setRejectReason(""); }}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>KYC · {selected.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ["Nombre", selected.full_name],
                  ["Email", selected.email],
                  ["País", selected.country || "—"],
                  ["Estado actual", KYC_CONFIG[selected.kyc_status].label],
                  ["Última actualización", format(new Date(selected.updated_at), "d MMM yyyy HH:mm", { locale: es })],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-700 font-medium">Documento de identidad</p>
                <p className="text-xs text-blue-500 mt-1">documento_identidad.jpg (simulado)</p>
                <Button size="sm" variant="outline" className="mt-2 border-blue-300 text-blue-700 text-xs">
                  Ver documento
                </Button>
              </div>

              {selected.kyc_rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Motivo de rechazo:</p>
                  <p className="text-xs text-red-600">{selected.kyc_rejection_reason}</p>
                </div>
              )}

              {action === "reject" && (
                <div>
                  <Label>Motivo de rechazo *</Label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ej: Documento ilegible, foto borrosa..."
                    className="mt-1.5"
                  />
                </div>
              )}

              {selected.kyc_status === "pending" && (
                <div className="flex gap-2">
                  {action !== "reject" ? (
                    <>
                      <Button onClick={() => handleApprove(selected)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar KYC
                      </Button>
                      <Button onClick={() => setAction("reject")} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                        <XCircle className="w-4 h-4 mr-1" /> Rechazar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => handleReject(selected)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                        Confirmar rechazo
                      </Button>
                      <Button onClick={() => setAction(null)} variant="outline" className="flex-1">Cancelar</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
