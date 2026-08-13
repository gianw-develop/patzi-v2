"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/user-store";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1") {
      setNotice("Cuenta creada. Confirma el enlace enviado a tu correo antes de iniciar sesión.");
    } else if (params.get("reset") === "1") {
      setNotice("Contraseña actualizada. Ya puedes iniciar sesión.");
    } else if (params.get("error") === "confirmation") {
      setError("El enlace de acceso no es válido o ha caducado. Solicita uno nuevo.");
    } else if (params.get("error") === "inactive") {
      setError("Tu cuenta está desactivada. Contacta con soporte.");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError || !data.user) {
        throw new Error(signInError?.message ?? "No se pudo iniciar sesión.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, kyc_status, stable_eligible, is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) throw new Error("No encontramos tu perfil de Patzi.");
      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("Tu cuenta está desactivada. Contacta con soporte.");
      }

      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
        const requestedNext = new URLSearchParams(window.location.search).get("next");
        const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
          ? requestedNext
          : profile.role === "admin" ? "/admin" : "/dashboard";
        router.replace(`/auth/mfa?next=${encodeURIComponent(safeNext)}`);
        return;
      }

      setUser({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone ?? "",
        role: profile.role,
        kyc_status: profile.kyc_status,
        stable_eligible: profile.stable_eligible,
        is_active: profile.is_active,
      });

      toast.success(profile.role === "admin" ? "Bienvenido al centro operativo" : "Sesión iniciada correctamente");
      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : null;
      router.replace(safeNext ?? (profile.role === "admin" ? "/admin" : "/dashboard"));
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo iniciar sesión.";
      setError(
        message === "Invalid login credentials"
          ? "No pudimos validar el acceso. Si es tu primera vez en esta versión de Patzi, crea tu cuenta; si ya la creaste, recupera tu contraseña."
          : message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="premium-card min-w-0 max-w-full overflow-hidden rounded-[2rem] p-5 sm:p-9">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4"><div><p className="premium-kicker text-[#087F62]">{t("Bienvenido de nuevo")}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{t("Inicia sesión en Patzi")}</h1><p className="mt-3 text-sm leading-6 text-[#071A2D]/50">{t("Accede a tus remesas, operaciones Stable y comprobantes.")}</p></div><div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF8F3] text-[#087F62] sm:grid"><ShieldCheck className="h-6 w-6" /></div></div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {notice && <div className="flex items-start gap-3 rounded-xl border border-[#0AA883]/20 bg-[#EAF8F3] p-3 text-xs text-[#087F62]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}
            {error && <div className="flex items-start gap-3 rounded-xl border border-[#FF765B]/25 bg-[#FFF0EC] p-3 text-xs text-[#A13E2C]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

            <label className="block"><span className="text-[11px] font-semibold">{t("Correo electrónico")}</span><div className="mt-2 flex h-13 items-center rounded-xl border border-[#071A2D]/10 bg-white px-4 shadow-[inset_0_1px_0_white] focus-within:border-[#2775CA] focus-within:ring-4 focus-within:ring-[#2775CA]/8"><Mail className="h-4 w-4 text-[#071A2D]/32" /><input id="email" type="email" autoComplete="email" placeholder="tu@email.com" value={email} onChange={(event)=>setEmail(event.target.value)} required className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /></div></label>

            <label className="block"><span className="flex items-center justify-between text-[11px] font-semibold">{t("Contraseña")}<Link href="/auth/forgot-password" className="font-medium text-[#2775CA] hover:underline">{t("¿La olvidaste?")}</Link></span><div className="mt-2 flex h-13 items-center rounded-xl border border-[#071A2D]/10 bg-white px-4 shadow-[inset_0_1px_0_white] focus-within:border-[#2775CA] focus-within:ring-4 focus-within:ring-[#2775CA]/8"><LockKeyhole className="h-4 w-4 text-[#071A2D]/32" /><input id="password" type={showPass?"text":"password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event)=>setPassword(event.target.value)} required className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /><button type="button" onClick={()=>setShowPass(!showPass)} className="text-[#071A2D]/35 transition-colors hover:text-[#071A2D]" aria-label={showPass?"Ocultar contraseña":"Mostrar contraseña"}>{showPass?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>

            <Button type="submit" disabled={loading} className="h-13 w-full rounded-xl bg-[#071A2D] text-xs font-semibold text-white shadow-[0_16px_28px_rgba(7,26,45,.2)] hover:bg-[#0D2A40]">{loading?t("Verificando acceso..."):<>{t("Iniciar sesión")} <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
          </form>

          <div className="mt-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#071A2D]/8" /><span className="text-[9px] uppercase tracking-[.14em] text-[#071A2D]/32">{t("¿Primera vez?")}</span><span className="h-px flex-1 bg-[#071A2D]/8" /></div>
          <p className="mt-5 text-center text-xs text-[#071A2D]/48">{t("¿No tienes una cuenta?")} <Link href="/auth/register" className="font-semibold text-[#087F62] hover:underline">{t("Crear cuenta")}</Link></p>
        </div>
      </div>
    </AuthShell>
  );
}
