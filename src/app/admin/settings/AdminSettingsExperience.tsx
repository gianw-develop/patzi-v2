"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileWarning, ImageIcon, Loader2, RefreshCw, Save, Trash2, Upload, UserRoundX, Zap } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { useBrandStore } from "@/lib/brand-store";

interface ErrorReport {
  id: string;
  message: string;
  digest: string | null;
  path: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ClosureRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: "pending" | "reviewing" | "completed" | "cancelled";
  created_at: string;
  customer: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
}

function firstCustomer(value: ClosureRequest["customer"]) { return Array.isArray(value) ? value[0] ?? null : value; }

export default function AdminSettingsExperience() {
  const { logoUrl, platformName, setLogo, setPlatformName } = useBrandStore();
  const [name, setName] = useState(platformName || "Patzi");
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [savingBrand, setSavingBrand] = useState(false);
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [closures, setClosures] = useState<ClosureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [brandResponse, errorRows, closureRows] = await Promise.all([
      fetch("/api/brand", { cache: "no-store" }).then((response) => response.json()).catch(() => null),
      supabase.from("client_error_reports").select("id, message, digest, path, user_agent, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("account_closure_requests").select("id, user_id, reason, status, created_at, customer:profiles!account_closure_requests_user_id_fkey(full_name, email)").in("status", ["pending", "reviewing"]).order("created_at", { ascending: true }),
    ]);
    if (brandResponse) {
      const nextName = brandResponse.platformName || "Patzi";
      const nextLogo = brandResponse.logoUrl || null;
      setName(nextName);
      setPreview(nextLogo);
      setPlatformName(nextName);
      setLogo(nextLogo);
    }
    if (!errorRows.error) setErrors((errorRows.data ?? []) as ErrorReport[]);
    if (!closureRows.error) setClosures((closureRows.data ?? []) as unknown as ClosureRequest[]);
    setLoading(false);
  }, [setLogo, setPlatformName]);

  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(initial); }, [load]);

  const updateBrand = async (payload: { platformName?: string; logoUrl?: string | null }) => {
    setSavingBrand(true);
    const response = await fetch("/api/brand", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => null);
    setSavingBrand(false);
    if (!response.ok || !result?.ok) { toast.error(result?.error || "No se pudo guardar la identidad"); return false; }
    return true;
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("El nombre no puede estar vacío"); return; }
    if (await updateBrand({ platformName: trimmed })) { setPlatformName(trimmed); toast.success("Nombre actualizado"); }
  };

  const selectLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type)) { toast.error("Usa PNG, JPG, SVG o WebP"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("El logo supera 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const value = String(reader.result ?? "");
      if (await updateBrand({ logoUrl: value })) { setPreview(value); setLogo(value); toast.success("Logo actualizado"); }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async () => {
    if (await updateBrand({ logoUrl: null })) { setPreview(null); setLogo(null); if (fileRef.current) fileRef.current.value = ""; toast.success("Logo predeterminado restaurado"); }
  };

  const updateClosure = async (request: ClosureRequest, status: "reviewing" | "cancelled") => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase.from("account_closure_requests").update({ status, reviewed_at: new Date().toISOString(), reviewed_by: authData.user?.id ?? null }).eq("id", request.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "reviewing" ? "Solicitud marcada en revisión" : "Solicitud cancelada");
    await load();
  };

  return <>
    <Header title="Configuración del sistema" subtitle="Identidad, incidencias y solicitudes operativas" />
    <div className="w-full max-w-5xl flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="h-4 w-4 text-[#087F62]" />Identidad de la plataforma</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">{preview ? <Image src={preview} alt="Logo Patzi" width={96} height={96} unoptimized className="h-full w-full object-contain p-2" /> : <Zap className="h-9 w-9 text-[#0AA883]" />}</div><div className="flex-1"><p className="text-sm font-medium">Logo activo</p><p className="mt-1 text-xs text-slate-500">PNG, JPG, SVG o WebP · máximo 2 MB</p><div className="mt-3 flex flex-wrap gap-2"><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={selectLogo} className="hidden" /><Button size="sm" variant="outline" disabled={savingBrand} onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{preview ? "Cambiar logo" : "Subir logo"}</Button>{preview && <Button size="sm" variant="outline" disabled={savingBrand} onClick={() => void removeLogo()} className="border-red-200 text-red-600"><Trash2 className="mr-2 h-4 w-4" />Restaurar</Button>}</div></div></div><div><Label htmlFor="platform-name">Nombre de la plataforma</Label><div className="mt-1.5 flex gap-2"><Input id="platform-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} /><Button disabled={savingBrand} onClick={() => void saveName()} className="bg-[#071A2D] text-white"><Save className="mr-2 h-4 w-4" />Guardar</Button></div></div><div className="rounded-xl border border-[#0AA883]/20 bg-[#E7FAF3]/60 p-3 text-xs text-[#087F62]">Las tasas, comisiones y corredores se administran en <Link href="/admin/rates" className="font-bold underline">Tasas y comisiones</Link>. Los límites bancarios se administran en <Link href="/admin/accounts" className="font-bold underline">Cuentas receptoras</Link>.</div></CardContent></Card>

      <Card className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><UserRoundX className="h-4 w-4 text-amber-600" />Solicitudes de cierre <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{closures.length}</span></CardTitle><Button size="sm" variant="ghost" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button></CardHeader><CardContent>{closures.length === 0 ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500" /><p className="text-sm text-slate-500">No hay solicitudes activas</p></div> : <div className="space-y-2">{closures.map((request) => { const customer = firstCustomer(request.customer); return <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="text-sm font-semibold">{customer?.full_name || request.user_id}</p><p className="text-xs text-slate-500">{customer?.email} · {new Date(request.created_at).toLocaleString("es-ES")}</p><p className="mt-1 text-xs text-slate-600">{request.reason || "Sin motivo"}</p></div><div className="flex gap-2"><Button size="sm" disabled={request.status === "reviewing"} onClick={() => void updateClosure(request, "reviewing")} className="bg-[#071A2D] text-white">{request.status === "reviewing" ? "En revisión" : "Revisar"}</Button><Button size="sm" variant="outline" onClick={() => void updateClosure(request, "cancelled")}>Cancelar solicitud</Button></div></div>; })}</div>}</CardContent></Card>

      <Card id="errors" className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><FileWarning className="h-4 w-4 text-red-500" />Errores autenticados recientes <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">{errors.length}</span></CardTitle><Button size="sm" variant="ghost" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button></CardHeader><CardContent>{loading ? <div className="grid min-h-24 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#087F62]" /></div> : errors.length === 0 ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500" /><p className="text-sm text-slate-500">No hay errores autenticados registrados</p></div> : <div className="space-y-2">{errors.map((report) => <details key={report.id} className="rounded-xl border border-slate-200 p-3"><summary className="flex cursor-pointer list-none items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{report.message}</p><p className="mt-1 truncate text-xs text-slate-500">{report.path || "Ruta desconocida"} · {new Date(report.created_at).toLocaleString("es-ES")}</p></div></summary><div className="mt-3 border-t pt-3 text-xs text-slate-600"><p><b>Digest:</b> {report.digest || "—"}</p><p className="mt-1 break-all"><b>Navegador:</b> {report.user_agent || "—"}</p></div></details>)}</div>}</CardContent></Card>
    </div>
  </>;
}
