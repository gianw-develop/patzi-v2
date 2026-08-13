"use client";

import { FormEvent, useState } from "react";
import { Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import DashboardNotifications from "@/components/dashboard/DashboardNotifications";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useUserStore } from "@/lib/user-store";

export default function HeaderExperience({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t } = useLanguage();
  const { toggle } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();
  const fullName = useUserStore((state) => state.full_name);
  const admin = pathname.startsWith("/admin");
  const [search, setSearch] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    router.push(`${admin ? "/admin" : "/dashboard/history"}?search=${encodeURIComponent(value)}`);
  };

  const initials = fullName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || (admin ? "AV" : "P");

  return <header className="app-header flex min-h-[clamp(72px,4.2vw,104px)] items-center justify-between gap-3 border-b border-[#071A2D]/8 bg-white/90 px-[clamp(1rem,1.4vw,2.5rem)] backdrop-blur-xl">
    <div className="flex min-w-0 items-center gap-3"><button onClick={toggle} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#071A2D]/10 lg:hidden" aria-label={t("Abrir menú")}><Menu className="h-5 w-5" /></button><div className="min-w-0"><h1 className="truncate text-[clamp(1.125rem,.9vw,1.55rem)] font-semibold tracking-[-.025em]">{t(title)}</h1>{subtitle && <p className="hidden truncate text-[clamp(.75rem,.55vw,.9rem)] text-[#071A2D]/45 sm:block">{t(subtitle)}</p>}</div></div>
    <div className="flex items-center gap-2 sm:gap-3"><form onSubmit={submit} className="relative hidden md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#071A2D]/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-[clamp(2.5rem,2.2vw,3rem)] w-[clamp(14rem,16vw,32rem)] rounded-xl border border-[#071A2D]/10 bg-[#F5F7F2] pl-9 pr-3 text-[clamp(.75rem,.6vw,.875rem)] outline-none focus:border-[#4C7DFF]" aria-label={t(admin ? "Buscar referencia, cliente o wallet" : "Buscar operaciones o referencias")} placeholder={t(admin ? "Buscar referencia, cliente o wallet" : "Buscar operaciones o referencias")} /></form><LanguageSwitcher compact /><DashboardNotifications admin={admin} label={t("Notificaciones")} /><div title={fullName} className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#071A2D] sm:grid text-xs font-semibold text-white shadow-[0_8px_18px_rgba(7,26,45,.14)]">{initials}</div></div>
  </header>;
}
