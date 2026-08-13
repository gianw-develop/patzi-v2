"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Edit2, ExternalLink, Globe, Loader2, Mail, MapPin, Phone, Save, ShieldCheck, Upload, User } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase";
import { useUserStore } from "@/lib/user-store";
import type { KYCStatus } from "@/types";

interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  address: string | null;
  role: "user" | "admin";
  kyc_status: KYCStatus;
  kyc_document_url: string | null;
  kyc_rejection_reason: string | null;
  stable_eligible: boolean;
  is_active: boolean;
}

const KYC = {
  not_submitted: { label: "Sin verificar", icon: AlertCircle, tone: "bg-slate-100 text-slate-600 border-slate-200" },
  pending: { label: "En revisión", icon: Clock, tone: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Verificado", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Requiere corrección", icon: AlertCircle, tone: "bg-red-50 text-red-700 border-red-200" },
};

const empty = { full_name: "", email: "", phone: "", country: "", address: "" };
type FormValues = typeof empty;

export default function ProfileExperience() {
  const setUser = useUserStore((state) => state.setUser);
  const [record, setRecord] = useState<ProfileRecord | null>(null);
  const [profile, setProfile] = useState<FormValues>(empty);
  const [draft, setDraft] = useState<FormValues>(empty);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hydrateUser = useCallback((next: ProfileRecord) => {
    setUser({
      id: next.id,
      full_name: next.full_name,
      email: next.email,
      phone: next.phone ?? "",
      role: next.role,
      kyc_status: next.kyc_status,
      stable_eligible: next.stable_eligible,
      is_active: next.is_active,
    });
  }, [setUser]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, country, address, role, kyc_status, kyc_document_url, kyc_rejection_reason, stable_eligible, is_active")
      .eq("id", authData.user.id)
      .single();
    if (error || !data) {
      toast.error("No se pudo cargar tu perfil.");
      setLoading(false);
      return;
    }
    const next = data as ProfileRecord;
    const values = { full_name: next.full_name ?? "", email: next.email ?? "", phone: next.phone ?? "", country: next.country ?? "", address: next.address ?? "" };
    setRecord(next);
    setProfile(values);
    setDraft(values);
    hydrateUser(next);
    setLoading(false);
  }, [hydrateUser]);

  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(initial); }, [load]);

  const save = async () => {
    if (!record || !draft.full_name.trim()) { toast.error("El nombre completo es obligatorio."); return; }
    setSaving(true);
    const values = { full_name: draft.full_name.trim(), phone: draft.phone.trim() || null, country: draft.country.trim() || null, address: draft.address.trim() || null };
    const { error } = await createClient().from("profiles").update(values).eq("id", record.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    const nextRecord = { ...record, ...values };
    const nextValues = { ...draft, full_name: values.full_name };
    setRecord(nextRecord);
    setProfile(nextValues);
    setDraft(nextValues);
    hydrateUser(nextRecord);
    setEditing(false);
    toast.success("Perfil actualizado correctamente");
  };

  const chooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    if (next && !["image/jpeg", "image/png", "application/pdf"].includes(next.type)) { toast.error("Usa un archivo JPG, PNG o PDF."); event.target.value = ""; return; }
    if (next && next.size > 10 * 1024 * 1024) { toast.error("El archivo supera 10 MB."); event.target.value = ""; return; }
    setFile(next);
  };

  const submitKyc = async () => {
    if (!record || !file) return;
    setUploading(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${record.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setUploading(false); toast.error(uploadError.message); return; }
    const { error } = await supabase.rpc("submit_my_kyc_document", { document_path: path });
    if (error) {
      await supabase.storage.from("kyc-documents").remove([path]);
      setUploading(false);
      toast.error(error.message);
      return;
    }
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    await load();
    setUploading(false);
    toast.success("Documento enviado para revisión.");
  };

  const openDocument = async () => {
    if (!record?.kyc_document_url) return;
    const { data, error } = await createClient().storage.from("kyc-documents").createSignedUrl(record.kyc_document_url, 60);
    if (error || !data) { toast.error("No se pudo abrir el documento privado."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (loading || !record) return <><Header title="Perfil y verificación" subtitle="Gestiona tu información personal" /><div className="grid flex-1 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#087F62]" /></div></>;

  const config = KYC[record.kyc_status];
  const KycIcon = config.icon;
  const checks = [Boolean(profile.email), Boolean(profile.full_name && profile.phone && profile.country), record.kyc_status === "approved"];
  const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const fields: { key: keyof FormValues; label: string; icon: typeof User; placeholder: string }[] = [
    { key: "full_name", label: "Nombre completo", icon: User, placeholder: "Tu nombre" },
    { key: "email", label: "Correo electrónico", icon: Mail, placeholder: "tu@email.com" },
    { key: "phone", label: "Teléfono", icon: Phone, placeholder: "+34 000 000 000" },
    { key: "country", label: "País", icon: Globe, placeholder: "España" },
    { key: "address", label: "Dirección", icon: MapPin, placeholder: "Tu dirección" },
  ];

  return <>
    <Header title="Perfil y verificación" subtitle="Gestiona tus datos y el acceso a Patzi Stable" />
    <div className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">
      <Card className="border-0 shadow-sm"><CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#071A2D] text-2xl font-bold text-white">{profile.full_name.charAt(0).toUpperCase() || "P"}</div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-slate-800">{profile.full_name}</h2><Badge className={`flex items-center gap-1 border text-xs ${config.tone}`}><KycIcon className="h-3 w-3" />{config.label}</Badge></div><p className="mt-1 text-sm text-slate-500">{profile.email}</p></div><div><p className="text-xs text-slate-500">Perfil completado</p><p className="text-2xl font-bold text-[#071A2D]">{progress}%</p></div></div>
        <Progress value={progress} className="h-2" />
      </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-[#087F62]" />Información personal</CardTitle>{editing ? <Button size="sm" disabled={saving} onClick={() => void save()} className="bg-[#071A2D] text-white"><Save className="mr-1 h-3.5 w-3.5" />{saving ? "Guardando…" : "Guardar"}</Button> : <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-[#087F62]"><Edit2 className="mr-1 h-3.5 w-3.5" />Editar</Button>}</CardHeader><CardContent className="space-y-4">
          {fields.map(({ key, label, icon: Icon, placeholder }) => <div key={key}><Label className="mb-1.5 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500"><Icon className="h-3 w-3" />{label}</Label>{editing && key !== "email" ? <Input value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} /> : <p className="py-1 text-sm font-medium text-slate-800">{profile[key] || <span className="italic text-slate-400">No configurado</span>}</p>}</div>)}
          {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(profile); }}>Cancelar</Button>}
        </CardContent></Card>

        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-[#087F62]" />Verificación de identidad (KYC)</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${config.tone}`}><KycIcon className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-semibold">Estado: {config.label}</p><p className="mt-1 text-xs leading-5">{record.kyc_status === "approved" ? "Tu identidad está verificada. El acceso Stable requiere además aprobación administrativa." : record.kyc_status === "pending" ? "Tu documento está en revisión. El resultado aparecerá aquí." : record.kyc_status === "rejected" ? record.kyc_rejection_reason || "Necesitamos un documento más claro o actualizado." : "Envía un documento válido para solicitar la verificación."}</p></div></div>
          {record.kyc_document_url && <Button variant="outline" onClick={() => void openDocument()} className="w-full"><ExternalLink className="mr-2 h-4 w-4" />Ver documento enviado</Button>}
          {(record.kyc_status === "not_submitted" || record.kyc_status === "rejected") && <div className="space-y-3"><input ref={fileRef} id="kyc-file" type="file" accept="image/jpeg,image/png,application/pdf" onChange={chooseFile} className="hidden" /><label htmlFor="kyc-file" className={`block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${file ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-[#0AA883]"}`}>{file ? <><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" /><p className="break-all text-sm font-semibold text-emerald-700">{file.name}</p><p className="mt-1 text-xs text-emerald-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p></> : <><Upload className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-sm font-medium">DNI, pasaporte o NIE</p><p className="mt-1 text-xs text-slate-400">JPG, PNG o PDF · máximo 10 MB</p></>}</label><Button disabled={!file || uploading} onClick={() => void submitKyc()} className="w-full bg-[#071A2D] text-white">{uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</> : "Enviar a revisión"}</Button></div>}
        </CardContent></Card>
      </div>
    </div>
  </>;
}
