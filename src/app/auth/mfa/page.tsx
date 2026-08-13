"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

export default function MfaPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.replace("/auth/login"); return; }
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      if (assurance?.currentLevel === "aal2" || assurance?.nextLevel !== "aal2") { router.replace(safeNext); return; }
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp.find((factor) => factor.status === "verified");
      if (error || !verified) { toast.error("No encontramos un autenticador activo."); router.replace("/auth/login"); return; }
      setFactorId(verified.id);
      setLoading(false);
    };
    void load();
  }, [router]);

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) { toast.error("Introduce el código de 6 dígitos."); return; }
    setVerifying(true);
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) { setVerifying(false); toast.error(challengeError?.message || "No se pudo crear el desafío."); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    setVerifying(false);
    if (error) { toast.error("Código incorrecto o caducado."); return; }
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    toast.success("Identidad confirmada");
    router.replace(safeNext);
    router.refresh();
  };

  return <AuthShell><div className="premium-card rounded-[2rem] p-6 sm:p-9"><div className="relative z-10">{loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#087F62]" /></div> : <><div className="flex items-start justify-between gap-4"><div><p className="premium-kicker text-[#087F62]">Seguridad</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Confirma tu acceso</h1><p className="mt-3 text-sm leading-6 text-[#071A2D]/55">Introduce el código de tu aplicación autenticadora.</p></div><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF8F3] text-[#087F62]"><ShieldCheck className="h-6 w-6" /></div></div><form onSubmit={verify} className="mt-8 space-y-5"><div><Label htmlFor="mfa-code">Código de 6 dígitos</Label><div className="mt-2 flex h-13 items-center rounded-xl border border-[#071A2D]/10 bg-white px-4 focus-within:border-[#2775CA]"><KeyRound className="h-4 w-4 text-[#071A2D]/35" /><Input id="mfa-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus className="h-full border-0 bg-transparent text-center text-xl tracking-[.35em] shadow-none focus-visible:ring-0" /></div></div><Button type="submit" disabled={verifying} className="h-13 w-full rounded-xl bg-[#071A2D] text-white">{verifying ? "Verificando…" : "Confirmar acceso"}</Button></form></>}</div></div></AuthShell>;
}
