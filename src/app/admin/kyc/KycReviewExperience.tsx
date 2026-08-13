"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Loader2, RefreshCw, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import type { KYCStatus } from "@/types";

interface KycUser {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  kyc_status: KYCStatus;
  kyc_document_url: string | null;
  kyc_rejection_reason: string | null;
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  updated_at: string;
}

const KYC = {
  not_submitted: { label: "Sin enviar", icon: AlertCircle, tone: "bg-slate-100 text-slate-600 border-slate-200" },
  pending: { label: "Pendiente", icon: Clock, tone: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Aprobado", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rechazado", icon: XCircle, tone: "bg-red-50 text-red-700 border-red-200" },
};

function dateLabel(value: string | null) {
  return value ? format(new Date(value), "d MMM yyyy, HH:mm", { locale: es }) : "—";
}

export default function KycReviewExperience() {
  const [users, setUsers] = useState<KycUser[]>([]);
  const [selected, setSelected] = useState<KycUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await createClient()
      .from("profiles")
      .select("id, full_name, email, country, kyc_status, kyc_document_url, kyc_rejection_reason, kyc_submitted_at, kyc_reviewed_at, updated_at")
      .eq("role", "user")
      .order("kyc_submitted_at", { ascending: false, nullsFirst: false });
    if (error) toast.error("No se pudieron cargar las solicitudes KYC.");
    else setUsers((data ?? []) as KycUser[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 20_000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [load]);

  const review = async (status: "approved" | "rejected") => {
    if (!selected) return;
    if (status === "rejected" && !rejectReason.trim()) { toast.error("Indica el motivo del rechazo."); return; }
    setReviewing(true);
    const { error } = await createClient().rpc("admin_review_kyc", {
      target_user_id: selected.id,
      review_status: status,
      rejection_reason: status === "rejected" ? rejectReason.trim() : null,
    });
    setReviewing(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "KYC aprobado" : "KYC rechazado con motivo");
    setSelected(null);
    setRejectReason("");
    setRejecting(false);
    await load();
  };

  const openDocument = async (user: KycUser) => {
    if (!user.kyc_document_url) { toast.error("Esta solicitud no tiene documento."); return; }
    const { data, error } = await createClient().storage.from("kyc-documents").createSignedUrl(user.kyc_document_url, 120);
    if (error || !data) { toast.error("No se pudo abrir el documento privado."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const pending = users.filter((user) => user.kyc_status === "pending");
  const submitted = users.filter((user) => user.kyc_status !== "not_submitted");

  return <>
    <Header title="Verificación KYC" subtitle={`${pending.length} solicitudes pendientes`} />
    <div className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{(["pending", "approved", "rejected", "not_submitted"] as KYCStatus[]).map((status) => { const config = KYC[status]; return <Card key={status} className="border-0 shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className={`grid h-10 w-10 place-items-center rounded-xl border ${config.tone}`}><span className="text-xl font-bold">{users.filter((user) => user.kyc_status === status).length}</span></div><p className="text-sm font-medium text-slate-700">{config.label}</p></CardContent></Card>; })}</div>

      <section><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700"><Clock className="h-4 w-4 text-amber-600" />Solicitudes pendientes</h2><Button size="sm" variant="ghost" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button></div>{loading ? <div className="grid min-h-32 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#087F62]" /></div> : pending.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-10 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" /><p className="text-sm font-medium text-slate-600">No hay documentos pendientes</p></CardContent></Card> : <div className="space-y-3">{pending.map((user) => <Card key={user.id} className="border-0 border-l-4 border-l-amber-400 shadow-sm"><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 font-bold text-amber-700">{user.full_name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="font-bold text-slate-800">{user.full_name}</p><p className="truncate text-xs text-slate-500">{user.email} · enviado {dateLabel(user.kyc_submitted_at)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { setSelected(user); setRejecting(false); }}><ExternalLink className="mr-1 h-3.5 w-3.5" />Revisar</Button><Button size="sm" onClick={() => { setSelected(user); setRejecting(false); }} className="bg-emerald-600 text-white"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Aprobar</Button><Button size="sm" variant="outline" onClick={() => { setSelected(user); setRejecting(true); }} className="border-red-200 text-red-600"><XCircle className="mr-1 h-3.5 w-3.5" />Rechazar</Button></div></CardContent></Card>)}</div>}</section>

      <section><h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700"><FileText className="h-4 w-4" />Historial KYC</h2><Card className="overflow-hidden border-0 shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead className="border-b bg-slate-50"><tr>{["Usuario", "Estado", "Enviado", "Revisado", "Documento"].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody>{submitted.map((user) => { const config = KYC[user.kyc_status]; const Icon = config.icon; return <tr key={user.id} className="border-t border-slate-100"><td className="px-4 py-3"><p className="text-sm font-semibold">{user.full_name}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-4 py-3"><Badge className={`inline-flex items-center gap-1 border ${config.tone}`}><Icon className="h-3 w-3" />{config.label}</Badge></td><td className="px-4 py-3 text-xs text-slate-500">{dateLabel(user.kyc_submitted_at)}</td><td className="px-4 py-3 text-xs text-slate-500">{dateLabel(user.kyc_reviewed_at)}</td><td className="px-4 py-3"><Button size="sm" variant="ghost" disabled={!user.kyc_document_url} onClick={() => void openDocument(user)}>Ver</Button></td></tr>; })}</tbody></table>{submitted.length === 0 && <div className="py-10 text-center text-sm text-slate-400">Todavía no hay solicitudes KYC.</div>}</div></Card></section>
    </div>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelected(null); setRejecting(false); setRejectReason(""); } }}>
      {selected && <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>KYC · {selected.full_name}</DialogTitle></DialogHeader><div className="space-y-4"><div className="rounded-xl bg-slate-50 p-4 text-sm"><dl className="space-y-2">{[["Correo", selected.email], ["País", selected.country || "—"], ["Enviado", dateLabel(selected.kyc_submitted_at)], ["Estado", KYC[selected.kyc_status].label]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}</dl></div><Button variant="outline" onClick={() => void openDocument(selected)} disabled={!selected.kyc_document_url} className="w-full"><ExternalLink className="mr-2 h-4 w-4" />Abrir documento privado</Button>{selected.kyc_rejection_reason && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><b>Motivo anterior:</b> {selected.kyc_rejection_reason}</div>}{rejecting && <div><Label htmlFor="reject-reason">Motivo del rechazo</Label><textarea id="reject-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} maxLength={500} placeholder="Explica exactamente qué debe corregir el cliente" className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-red-400" /></div>}{selected.kyc_status === "pending" && <div className="flex flex-col gap-2 sm:flex-row">{rejecting ? <><Button disabled={reviewing} onClick={() => void review("rejected")} className="flex-1 bg-red-600 text-white">Confirmar rechazo</Button><Button variant="outline" onClick={() => setRejecting(false)} className="flex-1">Cancelar</Button></> : <><Button disabled={reviewing} onClick={() => void review("approved")} className="flex-1 bg-emerald-600 text-white">Aprobar KYC</Button><Button variant="outline" onClick={() => setRejecting(true)} className="flex-1 border-red-200 text-red-600">Rechazar</Button></>}</div>}</div></DialogContent>}
    </Dialog>
  </>;
}
