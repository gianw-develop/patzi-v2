"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";

export default function ConfirmedPage() {
  return (
    <AuthShell>
      <section className="premium-card overflow-hidden rounded-[2rem] p-7 text-center sm:p-10">
        <div className="relative z-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.6rem] border border-[#0AA883]/20 bg-[#E7FAF3] text-[#087F62] shadow-[0_18px_36px_rgba(10,168,131,.16)]">
            <MailCheck className="h-9 w-9" />
          </div>
          <p className="premium-kicker mt-7 text-[#087F62]">Verificación completada</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Tu cuenta Patzi está lista</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#071A2D]/52">
            Confirmamos tu correo correctamente. Ya puedes entrar, gestionar tus remesas y seguir cada comprobante desde tu panel.
          </p>

          <div className="mt-7 grid gap-2 rounded-2xl border border-[#071A2D]/8 bg-white/75 p-4 text-left text-xs text-[#071A2D]/58 sm:grid-cols-2">
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#0AA883]" /> Correo verificado</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2775CA]" /> Acceso protegido</p>
          </div>

          <Button asChild className="mt-7 h-13 w-full rounded-xl bg-[#071A2D] text-xs font-semibold text-white shadow-[0_16px_28px_rgba(7,26,45,.2)] hover:bg-[#0D2A40]">
            <Link href="/dashboard">Entrar a mi panel <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </AuthShell>
  );
}
