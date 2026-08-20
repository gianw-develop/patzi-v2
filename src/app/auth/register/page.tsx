"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/user-store";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm_password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const { setUser } = useUserStore();
  const update = (field: string, value: string) => setForm((previous) => ({ ...previous, [field]: value }));

  const strength = (() => {
    if (!form.password) return 0;
    return Number(form.password.length >= 8) + Number(/[A-Z]/.test(form.password)) + Number(/[0-9]/.test(form.password)) + Number(/[^A-Za-z0-9]/.test(form.password));
  })();
  const strengthLabels = ["", "Débil", "Regular", "Buena", "Fuerte"];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedName = form.full_name.trim().replace(/\s+/g, " ");
    const phoneDigits = form.phone.replace(/\D/g, "");
    const realName = /^[\p{L}][\p{L}'’.-]+(?:\s+[\p{L}][\p{L}'’.-]+)+$/u.test(normalizedName);

    if (website || Date.now() - startedAt < 2500) {
      toast.error("No pudimos validar el registro. Inténtalo nuevamente.");
      return;
    }
    if (!realName || normalizedName.length < 5 || normalizedName.length > 100) {
      toast.error("Introduce tu nombre y apellido reales.");
      return;
    }
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      toast.error("Introduce un teléfono válido.");
      return;
    }
    if (form.password !== form.confirm_password) { toast.error("Las contraseñas no coinciden"); return; }
    if (form.password.length < 10 || strength < 4 || !/[a-z]/.test(form.password)) {
      toast.error("Usa al menos 10 caracteres, mayúscula, minúscula, número y símbolo.");
      return;
    }
    if (!agreed) { toast.error("Debes aceptar los términos y condiciones"); return; }
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/auth/confirmed`,
          data: {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
          },
        },
      });

      if (error) throw error;

      if (!data.session || !data.user) {
        toast.success("Cuenta creada. Revisa tu correo para confirmar el acceso.");
        router.replace("/auth/login?registered=1");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, kyc_status, stable_eligible, is_active")
        .eq("id", data.user.id)
        .single();

      if (profile) {
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
      }

      toast.success("¡Cuenta creada! Bienvenido a Patzi.");
      router.replace(profile?.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo crear la cuenta.";
      toast.error(message === "User already registered" ? "Este correo ya está registrado." : message);
    } finally {
      setLoading(false);
    }
  };

  const inputShell = "mt-2 flex h-12 items-center rounded-xl border border-[#071A2D]/10 bg-white px-4 shadow-[inset_0_1px_0_white] focus-within:border-[#2775CA] focus-within:ring-4 focus-within:ring-[#2775CA]/8";
  const input = "h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none";

  return (
    <AuthShell variant="register">
      <div className="premium-card rounded-[2rem] p-6 sm:p-8">
        <div className="relative z-10">
          <p className="premium-kicker text-[#087F62]">{t("Nueva cuenta")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{t("Crea tu espacio en Patzi")}</h1>
          <p className="mt-3 text-sm leading-6 text-[#071A2D]/50">{t("Comienza con remesas. El acceso Stable se habilita después de verificar tu cuenta.")}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="text-[11px] font-semibold">{t("Nombre completo")}</span><div className={inputShell}><UserRound className="h-4 w-4 text-[#071A2D]/32"/><input id="full_name" autoComplete="name" placeholder="María García" value={form.full_name} onChange={(event)=>update("full_name",event.target.value)} required minLength={5} maxLength={100} className={input}/></div></label>
              <label><span className="text-[11px] font-semibold">{t("Teléfono")}</span><div className={inputShell}><Phone className="h-4 w-4 text-[#071A2D]/32"/><input id="phone" type="tel" autoComplete="tel" placeholder="+34 612 345 678" value={form.phone} onChange={(event)=>update("phone",event.target.value)} required minLength={8} maxLength={24} pattern="[+0-9() .-]{8,24}" className={input}/></div></label>
            </div>

            <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event)=>setWebsite(event.target.value)}/>
            </div>
            <label className="block"><span className="text-[11px] font-semibold">{t("Correo electrónico")}</span><div className={inputShell}><Mail className="h-4 w-4 text-[#071A2D]/32"/><input id="email" type="email" autoComplete="email" placeholder="tu@email.com" value={form.email} onChange={(event)=>update("email",event.target.value)} required className={input}/></div></label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="text-[11px] font-semibold">{t("Contraseña")}</span><div className={inputShell}><LockKeyhole className="h-4 w-4 text-[#071A2D]/32"/><input id="password" type={showPass?"text":"password"} autoComplete="new-password" placeholder={t("Mínimo 10 caracteres")} value={form.password} onChange={(event)=>update("password",event.target.value)} required minLength={10} className={input}/><button type="button" onClick={()=>setShowPass(!showPass)} className="text-[#071A2D]/35" aria-label={showPass?"Ocultar contraseña":"Mostrar contraseña"}>{showPass?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>
              <label><span className="text-[11px] font-semibold">{t("Confirmar contraseña")}</span><div className={`${inputShell} ${form.confirm_password&&form.password!==form.confirm_password?"border-[#FF765B]":""}`}><LockKeyhole className="h-4 w-4 text-[#071A2D]/32"/><input id="confirm_password" type="password" autoComplete="new-password" placeholder={t("Repite tu contraseña")} value={form.confirm_password} onChange={(event)=>update("confirm_password",event.target.value)} required className={input}/>{form.confirm_password&&form.password===form.confirm_password&&<CheckCircle2 className="h-4 w-4 text-[#0AA883]"/>}</div></label>
            </div>

            {form.password && <div className="rounded-xl bg-[#F4F7F4] p-3"><div className="flex gap-1">{[1,2,3,4].map((level)=><span key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${level<=strength?(strength>=4?"bg-[#0AA883]":strength>=3?"bg-[#4C7DFF]":strength>=2?"bg-[#F2B84B]":"bg-[#FF765B]"):"bg-[#071A2D]/8"}`}/>)}</div><p className="mt-2 text-[9px] text-[#071A2D]/42">Seguridad: <b className="font-semibold">{strengthLabels[strength]}</b></p></div>}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#071A2D]/8 bg-white/70 p-3"><input type="checkbox" checked={agreed} onChange={(event)=>setAgreed(event.target.checked)} className="peer sr-only"/><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[#071A2D]/15 bg-white peer-checked:border-[#0AA883] peer-checked:bg-[#0AA883] peer-checked:text-white"><Check className={`h-3 w-3 ${agreed?"opacity-100":"opacity-0"}`}/></span><span className="text-[10px] leading-5 text-[#071A2D]/48">Acepto los <Link href="#" className="font-semibold text-[#2775CA]">términos y condiciones</Link> y la <Link href="#" className="font-semibold text-[#2775CA]">política de privacidad</Link> de Patzi.</span></label>

            <Button type="submit" disabled={loading} className="h-13 w-full rounded-xl bg-[#071A2D] text-xs font-semibold text-white shadow-[0_16px_28px_rgba(7,26,45,.2)] hover:bg-[#0D2A40]">{loading?t("Creando tu cuenta..."):<>{t("Crear cuenta")} <ArrowRight className="ml-2 h-4 w-4"/></>}</Button>
          </form>

          <p className="mt-5 text-center text-xs text-[#071A2D]/48">{t("¿Ya tienes una cuenta?")} <Link href="/auth/login" className="font-semibold text-[#087F62] hover:underline">{t("Iniciar sesión")}</Link></p>
        </div>
      </div>
    </AuthShell>
  );
}
