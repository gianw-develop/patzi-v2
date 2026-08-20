"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, ArrowLeftRight, Building2, LogOut, Percent, Settings, ShieldCheck, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import PathlineLogo from "@/components/brand/PathlineLogo";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useUserStore } from "@/lib/user-store";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

const nav = [
  { href: "/admin", label: "Resumen", icon: Activity },
  { href: "/admin/transactions", label: "Remesas", icon: ArrowLeftRight },
  { href: "/admin/stable", label: "Stable", icon: ShieldCheck },
  { href: "/admin/users", label: "Clientes", icon: Users },
  { href: "/admin/accounts", label: "Cuentas receptoras", icon: Building2 },
  { href: "/admin/rates", label: "Tasas y comisiones", icon: Percent },
  { href: "/admin/kyc", label: "Verificación KYC", icon: UserCheck },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export default function AdminSidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebarStore();
  const clearUser = useUserStore((state) => state.clearUser);
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
      {isOpen && <button className="fixed inset-0 z-40 bg-[#071A2D]/45 backdrop-blur-sm lg:hidden" onClick={close} aria-label={t("Cerrar menú")} />}
      <aside className={cn("light-sidebar fixed inset-y-0 left-0 z-50 flex w-[clamp(232px,13vw,300px)] flex-col overflow-y-auto transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="px-5 pb-7 pt-6"><Link href="/" onClick={close}><PathlineLogo admin /></Link></div>
        <div className="px-5 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#071A2D]/35">{t("Centro operativo")}</div>
        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((item, index) => {
            const active = index === 0 ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={`${item.href}-${item.label}`} href={item.href} onClick={close} className={cn("pathline-nav-item", active && "active")}>
                <item.icon className="h-4 w-4" /><span className="flex-1">{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="m-3 rounded-2xl border border-[#0AA883]/16 bg-[#EAF8F3] p-3 text-[11px] text-[#071A2D]/55 shadow-sm"><div className="mb-1 flex items-center gap-2 font-semibold text-[#087F62]"><span className="h-2 w-2 rounded-full bg-[#0AA883] shadow-[0_0_0_4px_rgba(10,168,131,.12)]" />{t("Sistema operativo")}</div>{t("Todos los servicios disponibles.")}</div>
        <div className="border-t border-[#071A2D]/8 p-3"><button onClick={logout} className="pathline-nav-item w-full"><LogOut className="h-4 w-4" />{t("Cerrar sesión")}</button></div>
      </aside>
    </>
  );
}
