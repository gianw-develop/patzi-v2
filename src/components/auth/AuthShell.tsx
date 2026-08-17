"use client";

import Link from "next/link";
import { ArrowLeft, Check, FileCheck2, ShieldCheck } from "lucide-react";
import PathlineLogo from "@/components/brand/PathlineLogo";
import { AssetChip, AssetMark, FlagMark, FlowCircuit } from "@/components/brand/FinancialMarks";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function AuthShell({ children, variant = "login" }: { children: React.ReactNode; variant?: "login" | "register" }) {
  const { t } = useLanguage();
  return (
    <main className="premium-shell min-h-screen max-w-full overflow-x-clip bg-[#F2F6F3] text-[#071A2D] lg:grid lg:grid-cols-[.92fr_1.08fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#061827] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_14%,rgba(77,226,181,.18),transparent_30%),radial-gradient(circle_at_82%_77%,rgba(255,118,91,.13),transparent_27%)]" />
        <div className="relative z-10 flex items-center justify-between"><Link href="/" className="w-fit"><PathlineLogo inverse /></Link><LanguageSwitcher inverse /></div>

        <div className="relative z-10 my-auto max-w-[560px] py-14">
          <p className="premium-kicker text-[#4DE2B5]">{t("Tu cuenta Patzi")}</p>
          <h1 className="mt-4 text-[3.4rem] font-semibold leading-[.98] tracking-[-.055em] xl:text-[4.25rem]">{t("Tu dinero sigue una ruta segura.")}</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/55">{t("Remesas y operaciones Stable, con cada comprobante, wallet y estado en un solo lugar.")}</p>

          <div className="relative mt-10 min-h-[250px]">
            <div className="absolute inset-x-[-18%] top-16"><FlowCircuit id={`auth-${variant}`} dark className="w-full" /></div>
            <div className="depth-float relative z-10 w-[260px] rounded-[1.6rem] border border-white/12 bg-white/[.075] p-5 shadow-[0_28px_55px_rgba(0,0,0,.28)] backdrop-blur-xl">
              <div className="flex items-center justify-between"><div><p className="text-[9px] text-white/42">{t("Tú envías")}</p><p className="mt-1 text-2xl font-semibold">$1,000</p></div><span className="flex items-center gap-2 text-[9px] font-semibold"><FlagMark country="US" />USD</span></div>
              <div className="my-4 h-px bg-white/10" />
              <div className="flex items-center justify-between"><div><p className="text-[9px] text-white/42">{t("Tú recibes")}</p><p className="mt-1 text-2xl font-semibold text-[#4DE2B5]">900 USDT</p></div><AssetMark asset="USDT" className="h-10 w-10" /></div>
            </div>
            <div className="depth-float-delayed absolute bottom-0 right-0 z-10 rounded-2xl border border-white/12 bg-[#0D2A40]/90 p-4 shadow-[0_24px_50px_rgba(0,0,0,.3)] backdrop-blur-xl">
              <div className="flex gap-2"><AssetChip asset="USDT" dark /><AssetChip asset="ETH" dark /></div>
              <p className="mt-3 flex items-center gap-2 text-[10px] text-white/55"><FileCheck2 className="h-4 w-4 text-[#4DE2B5]" />Comprobante verificado</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[10px] text-white/45">
          {["Identidad protegida", "Estados en tiempo real", "Ethereum ERC-20"].map((item) => <p key={item} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#4DE2B5]/15 text-[#4DE2B5]"><Check className="h-3 w-3" /></span>{t(item)}</p>)}
        </div>
      </section>

      <section className="relative flex min-h-screen min-w-0 items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div className="absolute inset-0 pathline-grid opacity-70" />
        <div className="absolute -right-24 top-[-6rem] h-80 w-80 rounded-full bg-[#4DE2B5]/13 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[#FF765B]/10 blur-3xl" />
        <div className="absolute inset-x-[-28%] bottom-2 opacity-20 lg:hidden"><FlowCircuit id={`auth-mobile-${variant}`} className="w-full" /></div>

        <div className="relative z-10 min-w-0 w-full max-w-[560px]">
          <div className="mb-8 flex items-center justify-between gap-2 lg:hidden"><Link href="/"><PathlineLogo /></Link><LanguageSwitcher compact /><span className="hidden items-center gap-2 rounded-full border border-[#071A2D]/8 bg-white/75 px-3 py-2 text-[9px] font-semibold text-[#087F62] shadow-sm sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" />{t("Acceso protegido")}</span></div>
          {children}
          <Link href="/" className="mx-auto mt-6 flex w-fit items-center gap-2 text-xs font-medium text-[#071A2D]/48 transition-colors hover:text-[#071A2D]"><ArrowLeft className="h-4 w-4" />{t("Volver al inicio")}</Link>
        </div>
      </section>
    </main>
  );
}
