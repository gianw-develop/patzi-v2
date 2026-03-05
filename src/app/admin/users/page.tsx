"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, CheckCircle2, Clock, AlertCircle, XCircle,
  User, Mail, Phone, Globe, ShieldCheck, MoreVertical,
  Ban, UserCheck,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_USERS } from "@/lib/mock-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { User as UserType } from "@/types";

const KYC_CONFIG = {
  not_submitted: { label: "Sin enviar", color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  approved: { label: "Aprobado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>(MOCK_USERS.filter((u) => u.role === "user"));
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [selected, setSelected] = useState<UserType | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === "all" || u.kyc_status === kycFilter;
    return matchSearch && matchKyc;
  });

  const toggleActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => u.id === id ? { ...u, is_active: !u.is_active } : u)
    );
    const user = users.find((u) => u.id === id);
    toast.success(user?.is_active ? "Usuario suspendido" : "Usuario reactivado");
  };

  return (
    <>
      <Header title="Gestión de usuarios" subtitle={`${users.length} usuarios registrados`} />
      <div className="flex-1 p-3 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { value: "all", label: "Todos" },
              { value: "pending", label: "KYC Pendiente" },
              { value: "approved", label: "Verificados" },
              { value: "not_submitted", label: "Sin verificar" },
              { value: "rejected", label: "Rechazados" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setKycFilter(f.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  kycFilter === f.value
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Usuario", "Email", "País", "KYC", "Estado", "Registro", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((user) => {
                  const kycCfg = KYC_CONFIG[user.kyc_status];
                  const KycIcon = kycCfg.icon;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{user.full_name}</p>
                            <p className="text-xs text-slate-400">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.country || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border ${kycCfg.color} flex items-center gap-1 w-fit`}>
                          <KycIcon className="w-3 h-3" />
                          {kycCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border w-fit ${user.is_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                          {user.is_active ? "Activo" : "Suspendido"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setSelected(user)} className="cursor-pointer">
                              <User className="w-3.5 h-3.5 mr-2" /> Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleActive(user.id)}
                              className={`cursor-pointer ${user.is_active ? "text-red-600" : "text-emerald-600"}`}
                            >
                              {user.is_active
                                ? <><Ban className="w-3.5 h-3.5 mr-2" /> Suspender</>
                                : <><UserCheck className="w-3.5 h-3.5 mr-2" /> Reactivar</>
                              }
                            </DropdownMenuItem>
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
                <User className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No se encontraron usuarios</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                  {selected.full_name.charAt(0)}
                </div>
                {selected.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              {[
                { icon: Mail, label: "Email", value: selected.email },
                { icon: Phone, label: "Teléfono", value: selected.phone || "No registrado" },
                { icon: Globe, label: "País", value: selected.country || "No registrado" },
                { icon: ShieldCheck, label: "KYC", value: KYC_CONFIG[selected.kyc_status].label },
                { icon: User, label: "Estado", value: selected.is_active ? "Activo" : "Suspendido" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-50">
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500 w-20">{label}</span>
                  <span className="font-medium text-slate-800">{value}</span>
                </div>
              ))}
              {selected.kyc_rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Motivo de rechazo KYC:</p>
                  <p className="text-xs text-red-600">{selected.kyc_rejection_reason}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => { toggleActive(selected.id); setSelected(null); }}
                  variant="outline"
                  size="sm"
                  className={`flex-1 ${selected.is_active ? "border-red-300 text-red-600 hover:bg-red-50" : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"}`}
                >
                  {selected.is_active ? "Suspender usuario" : "Reactivar usuario"}
                </Button>
                <Button onClick={() => setSelected(null)} size="sm" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white">
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
