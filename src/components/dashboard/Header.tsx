"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/sidebar-store";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t } = useLanguage();
  const { toggle } = useSidebarStore();
  const admin = usePathname().startsWith("/admin");
  return (
    <header className="app-header flex min-h-[clamp(72px,4.2vw,104px)] items-center justify-between gap-4 border-b border-[#071A2D]/8 bg-white/90 px-[clamp(1rem,1.4vw,2.5rem)] backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={toggle} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#071A2D]/10 lg:hidden" aria-label={t("Abrir menú")}><Menu className="h-5 w-5" /></button>
        <div className="min-w-0"><h1 className="truncate text-[clamp(1.125rem,.62vw,1.55rem)] font-semibold tracking-[-.025em]">{t(title)}</h1>{subtitle && <p className="hidden truncate text-[clamp(.75rem,.36vw,.9rem)] text-[#071A2D]/45 sm:block">{t(subtitle)}</p>}</div>
      </div>
      <div className="flex items-center gap-3">
        <label className="relative hidden md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#071A2D]/35" /><input className="h-[clamp(2.5rem,2.2vw,3rem)] w-[clamp(16rem,16vw,34rem)] rounded-xl border border-[#071A2D]/10 bg-[#F5F7F2] pl-9 pr-3 text-[clamp(.75rem,.34vw,.875rem)] outline-none focus:border-[#4C7DFF]" placeholder={t(admin ? "Buscar referencia, cliente o wallet" : "Buscar operaciones o referencias")} /></label>
        <LanguageSwitcher compact />
        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#071A2D]/10 bg-white" aria-label={t("Notificaciones")}><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF765B]" /></button>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#071A2D] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(7,26,45,.14)]">{admin ? "AV" : "G"}</div>
      </div>
    </header>
  );
}
