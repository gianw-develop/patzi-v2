"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/update-password` },
    );

    setLoading(false);
    if (resetError) {
      setError("No pudimos enviar el enlace ahora. Inténtalo de nuevo en unos minutos.");
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell>
      <div className="premium-card rounded-[2rem] p-6 sm:p-9">
        <div className="relative z-10">
          <p className="premium-kicker text-[#087F62]">{t("Recuperar acceso")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{t("Restablece tu contraseña")}</h1>
          <p className="mt-3 text-sm leading-6 text-[#071A2D]/50">{t("Te enviaremos un enlace seguro si el correo está registrado en Patzi.")}</p>

          {sent ? (
            <div className="mt-8 rounded-2xl border border-[#0AA883]/20 bg-[#EAF8F3] p-5 text-sm leading-6 text-[#087F62]">
              <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />Revisa tu correo</p>
              <p className="mt-2 text-[#071A2D]/58">Si existe una cuenta asociada, recibirás el enlace en los próximos minutos.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && <p className="rounded-xl border border-[#FF765B]/25 bg-[#FFF0EC] p-3 text-xs text-[#A13E2C]">{error}</p>}
              <label className="block">
                <span className="text-[11px] font-semibold">{t("Correo electrónico")}</span>
                <div className="mt-2 flex h-13 items-center rounded-xl border border-[#071A2D]/10 bg-white px-4 focus-within:border-[#2775CA] focus-within:ring-4 focus-within:ring-[#2775CA]/8">
                  <Mail className="h-4 w-4 text-[#071A2D]/32" />
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="tu@email.com" />
                </div>
              </label>
              <Button type="submit" disabled={loading} className="h-13 w-full rounded-xl bg-[#071A2D] text-xs font-semibold text-white shadow-[0_16px_28px_rgba(7,26,45,.2)] hover:bg-[#0D2A40]">
                {loading ? t("Enviando enlace...") : <>{t("Enviar enlace")} <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          )}

          <Link href="/auth/login" className="mx-auto mt-6 flex w-fit items-center gap-2 text-xs font-semibold text-[#2775CA] hover:underline"><ArrowLeft className="h-4 w-4" />{t("Volver a iniciar sesión")}</Link>
        </div>
      </div>
    </AuthShell>
  );
}
