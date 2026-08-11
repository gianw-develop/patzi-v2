"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export default function UpdatePasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("El enlace no es válido o ha caducado. Solicita uno nuevo.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/auth/login?reset=1");
    router.refresh();
  };

  const inputShell = "mt-2 flex h-13 items-center rounded-xl border border-[#071A2D]/10 bg-white px-4 focus-within:border-[#2775CA] focus-within:ring-4 focus-within:ring-[#2775CA]/8";

  return (
    <AuthShell>
      <div className="premium-card rounded-[2rem] p-6 sm:p-9">
        <div className="relative z-10">
          <p className="premium-kicker text-[#087F62]">{t("Nuevo acceso")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{t("Crea una nueva contraseña")}</h1>
          <p className="mt-3 text-sm leading-6 text-[#071A2D]/50">Usa al menos 8 caracteres y evita repetir una contraseña anterior.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <p className="rounded-xl border border-[#FF765B]/25 bg-[#FFF0EC] p-3 text-xs text-[#A13E2C]">{error}</p>}
            <label className="block">
              <span className="text-[11px] font-semibold">{t("Nueva contraseña")}</span>
              <div className={inputShell}>
                <LockKeyhole className="h-4 w-4 text-[#071A2D]/32" />
                <input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="text-[#071A2D]/35">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold">{t("Confirmar contraseña")}</span>
              <div className={inputShell}>
                <LockKeyhole className="h-4 w-4 text-[#071A2D]/32" />
                <input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
              </div>
            </label>
            <Button type="submit" disabled={loading} className="h-13 w-full rounded-xl bg-[#071A2D] text-xs font-semibold text-white shadow-[0_16px_28px_rgba(7,26,45,.2)] hover:bg-[#0D2A40]">
              {loading ? t("Actualizando...") : <>{t("Guardar contraseña")} <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}
