"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, CircleHelp, KeyRound, Loader2, Lock, Mail, Moon, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { useUserStore } from "@/lib/user-store";

interface Preferences {
  email_transfers: boolean;
  email_promotions: boolean;
  push_transfers: boolean;
  push_rates: boolean;
}

interface TotpEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
}

const defaults: Preferences = { email_transfers: true, email_promotions: false, push_transfers: true, push_rates: false };

export default function SettingsExperience() {
  const { id, email } = useUserStore();
  const { darkMode, setDarkMode } = useThemeStore();
  const [preferences, setPreferences] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [closureRequested, setClosureRequested] = useState(false);
  const [closureBusy, setClosureBusy] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: profile } = await supabase.from("profiles").select("notification_preferences").eq("id", id).single();
    if (profile?.notification_preferences) setPreferences({ ...defaults, ...(profile.notification_preferences as Partial<Preferences>) });
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp.find((factor) => factor.status === "verified");
    setFactorId(verified?.id ?? null);
    const { data: requests } = await supabase.from("account_closure_requests").select("id").eq("user_id", id).in("status", ["pending", "reviewing"]).limit(1);
    setClosureRequested(Boolean(requests?.length));
    setLoading(false);
  }, [id]);

  useEffect(() => { if (!id) return; const initial = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(initial); }, [id, load]);

  const savePreferences = async () => {
    setSavingPreferences(true);
    const { error } = await createClient().from("profiles").update({ notification_preferences: preferences }).eq("id", id);
    setSavingPreferences(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Preferencias guardadas");
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) { toast.error("Las contraseñas no coinciden"); return; }
    if (passwords.next.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (passwords.current === passwords.next) { toast.error("La nueva contraseña debe ser diferente"); return; }
    setSavingPassword(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: passwords.current });
    if (signInError) { setSavingPassword(false); toast.error("La contraseña actual no es correcta"); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setSavingPassword(false);
    if (error) { toast.error(error.message); return; }
    setPasswords({ current: "", next: "", confirm: "" });
    toast.success("Contraseña actualizada correctamente");
  };

  const beginMfa = async () => {
    setMfaBusy(true);
    const { data, error } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "Patzi Authenticator" });
    setMfaBusy(false);
    if (error || !data) { toast.error(error?.message || "No se pudo iniciar 2FA"); return; }
    setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  };

  const verifyMfa = async () => {
    if (!enrollment || !/^\d{6}$/.test(totpCode)) { toast.error("Introduce el código de 6 dígitos"); return; }
    setMfaBusy(true);
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
    if (challengeError || !challenge) { setMfaBusy(false); toast.error(challengeError?.message || "No se pudo validar 2FA"); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId: enrollment.factorId, challengeId: challenge.id, code: totpCode });
    setMfaBusy(false);
    if (error) { toast.error("El código no es válido"); return; }
    setFactorId(enrollment.factorId);
    setEnrollment(null);
    setTotpCode("");
    toast.success("Autenticación de dos factores activada");
  };

  const cancelEnrollment = async () => {
    if (enrollment) await createClient().auth.mfa.unenroll({ factorId: enrollment.factorId });
    setEnrollment(null);
    setTotpCode("");
  };

  const disableMfa = async () => {
    if (!factorId) return;
    setMfaBusy(true);
    const { error } = await createClient().auth.mfa.unenroll({ factorId });
    setMfaBusy(false);
    if (error) { toast.error(error.message); return; }
    setFactorId(null);
    toast.success("Autenticación de dos factores desactivada");
  };

  const requestClosure = async () => {
    if (!window.confirm("¿Quieres enviar una solicitud de cierre? El equipo revisará antes de eliminar cualquier dato.")) return;
    setClosureBusy(true);
    const { error } = await createClient().from("account_closure_requests").insert({ user_id: id, reason: "Solicitud creada desde Configuración" });
    setClosureBusy(false);
    if (error) { toast.error(error.code === "23505" ? "Ya existe una solicitud activa" : error.message); return; }
    setClosureRequested(true);
    toast.success("Solicitud de cierre enviada");
  };

  if (loading) return <><Header title="Configuración" subtitle="Seguridad y preferencias de tu cuenta" /><div className="grid flex-1 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#087F62]" /></div></>;

  const notificationOptions: { key: keyof Preferences; label: string; description: string }[] = [
    { key: "email_transfers", label: "Email: estado de operaciones", description: "Cambios en tus remesas y operaciones Stable" },
    { key: "email_promotions", label: "Email: novedades", description: "Nuevos servicios y actualizaciones de Patzi" },
    { key: "push_transfers", label: "Panel: estado de operaciones", description: "Alertas operativas dentro de Patzi" },
    { key: "push_rates", label: "Panel: tasas", description: "Avisos cuando cambien las tasas publicadas" },
  ];

  return <>
    <Header title="Configuración" subtitle="Seguridad y preferencias de tu cuenta" />
    <div className="w-full max-w-3xl flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-[#087F62]" />Notificaciones</CardTitle></CardHeader><CardContent className="space-y-4">{notificationOptions.map((option) => <div key={option.key} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-slate-800">{option.label}</p><p className="text-xs text-slate-500">{option.description}</p></div><Switch checked={preferences[option.key]} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, [option.key]: checked }))} /></div>)}<Button size="sm" disabled={savingPreferences} onClick={() => void savePreferences()} className="bg-[#071A2D] text-white">{savingPreferences ? "Guardando…" : "Guardar preferencias"}</Button></CardContent></Card>

      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Moon className="h-4 w-4 text-[#087F62]" />Apariencia</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Modo oscuro</p><p className="text-xs text-slate-500">Ajusta la apariencia de la plataforma</p></div><Switch checked={darkMode} onCheckedChange={setDarkMode} /></div></CardContent></Card>

      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-[#087F62]" />Seguridad</CardTitle></CardHeader><CardContent className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">Autenticación de dos factores (2FA)</p><p className="text-xs text-slate-500">Código temporal desde Google Authenticator, 1Password o similar</p></div>{factorId ? <Button variant="outline" size="sm" disabled={mfaBusy} onClick={() => void disableMfa()} className="border-red-200 text-red-600"><ShieldCheck className="mr-2 h-4 w-4" />Desactivar 2FA</Button> : <Button variant="outline" size="sm" disabled={mfaBusy || Boolean(enrollment)} onClick={() => void beginMfa()}><KeyRound className="mr-2 h-4 w-4" />Activar 2FA</Button>}</div>
        {enrollment && <div className="rounded-2xl border border-[#0AA883]/20 bg-[#E7FAF3]/60 p-4"><p className="text-sm font-semibold">Escanea el QR con tu autenticador</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center"><Image src={enrollment.qrCode} alt="Código QR para activar 2FA" width={160} height={160} unoptimized className="rounded-xl bg-white p-2" /><div className="min-w-0 flex-1"><p className="text-xs text-slate-500">Clave manual</p><code className="mt-1 block break-all rounded-lg bg-white p-2 text-xs">{enrollment.secret}</code><Label htmlFor="totp-code" className="mt-3 block">Código de 6 dígitos</Label><Input id="totp-code" inputMode="numeric" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))} className="mt-1.5" /><div className="mt-3 flex gap-2"><Button size="sm" disabled={mfaBusy} onClick={() => void verifyMfa()} className="bg-[#071A2D] text-white">Confirmar</Button><Button size="sm" variant="outline" onClick={() => void cancelEnrollment()}>Cancelar</Button></div></div></div></div>}
        <Separator />
        <form onSubmit={changePassword} className="space-y-3"><p className="text-sm font-semibold">Cambiar contraseña</p><div><Label htmlFor="current-password">Contraseña actual</Label><Input id="current-password" type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} className="mt-1.5" required /></div><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="new-password">Nueva contraseña</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} className="mt-1.5" required /></div><div><Label htmlFor="confirm-password">Confirmar contraseña</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} className="mt-1.5" required /></div></div><Button type="submit" size="sm" disabled={savingPassword} className="bg-[#071A2D] text-white">{savingPassword ? "Actualizando…" : "Cambiar contraseña"}</Button></form>
      </CardContent></Card>

      <Card id="support" className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleHelp className="h-4 w-4 text-[#087F62]" />Ayuda</CardTitle></CardHeader><CardContent><div className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">¿Necesitas ayuda con una operación?</p><p className="text-xs text-slate-500">Incluye la referencia Patzi en tu mensaje para atenderte más rápido.</p></div><Button variant="outline" asChild><a href="mailto:soporte@patzi.net"><Mail className="mr-2 h-4 w-4" />soporte@patzi.net</a></Button></div></CardContent></Card>

      <Card className="border border-red-100 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-red-600"><Trash2 className="h-4 w-4" />Cierre de cuenta</CardTitle></CardHeader><CardContent><div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" /><div className="flex-1"><p className="text-sm font-semibold text-red-800">Solicitar cierre</p><p className="mb-3 mt-1 text-xs leading-5 text-red-600">Patzi revisará saldos, operaciones y documentos antes de eliminar datos. Nada se elimina automáticamente.</p><Button size="sm" variant="outline" disabled={closureRequested || closureBusy} onClick={() => void requestClosure()} className="border-red-300 text-red-600">{closureRequested ? "Solicitud en revisión" : closureBusy ? "Enviando…" : "Solicitar cierre de cuenta"}</Button></div></div></CardContent></Card>
    </div>
  </>;
}
