"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp, ContactRound, FileText, History, LogOut, Send, Settings, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import PathlineLogo from "@/components/brand/PathlineLogo";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useUserStore } from "@/lib/user-store";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: UserRound },
  { href: "/dashboard/send", label: "Enviar dinero", icon: Send },
  { href: "/dashboard/history", label: "Operaciones", icon: History },
  { href: "/dashboard/beneficiaries", label: "Destinatarios", icon: Users },
  { href: "/dashboard/profile", label: "Perfil y KYC", icon: FileText },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebarStore();
  const { full_name, email, stable_eligible, clearUser } = useUserStore();
  const visibleNavItems = stable_eligible
    ? [...navItems.slice(0, 3), { href: "/dashboard/senders", label: "Remitentes USD", icon: ContactRound }, ...navItems.slice(3)]
    : navItems;

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    toast.success(t("Sesión cerrada"));
    close();
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <>
      {isOpen && <button className="fixed inset-0 z-40 bg-black/55 lg:hidden" onClick={close} aria-label={t("Cerrar menú")} />}
      <aside className={cn(
        "pathline-sidebar fixed inset-y-0 left-0 z-50 flex w-[238px] flex-col overflow-y-auto transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="px-6 pb-7 pt-6"><Link href="/" onClick={close}><PathlineLogo inverse /></Link></div>
        <nav className="flex-1 space-y-1 px-3">
          {visibleNavItems.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={close} className={cn("pathline-nav-item", active && "active")}>
                <item.icon className="h-[18px] w-[18px]" /><span>{t(item.label)}</span>
              </Link>
            );
          })}
          <Link href="/dashboard/settings#support" onClick={close} className="pathline-nav-item"><CircleHelp className="h-[18px] w-[18px]" />{t("Ayuda")}</Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#4DE2B5] font-black text-[#071A2D]">{full_name?.[0]?.toUpperCase() || "G"}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{full_name || "Gian"}</p><p className="truncate text-[11px] text-white/50">{email || t("Cliente verificado")}</p></div>
          </div>
          <button onClick={logout} className="pathline-nav-item w-full"><LogOut className="h-[18px] w-[18px]" />{t("Cerrar sesión")}</button>
        </div>
      </aside>
    </>
  );
}
