"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, ArrowLeftRight,
  TrendingUp, Settings, Zap, LogOut, ChevronRight, Landmark, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useBrandStore } from "@/lib/brand-store";
import { useSidebarStore } from "@/lib/sidebar-store";
import Image from "next/image";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/kyc", label: "Verificación KYC", icon: ShieldCheck },
  { href: "/admin/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/admin/deposits", label: "Recargas", icon: Wallet },
  { href: "/admin/accounts", label: "Cuentas de cobro", icon: Landmark },
  { href: "/admin/rates", label: "Tasas de cambio", icon: TrendingUp },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logoUrl, platformName } = useBrandStore();
  const { isOpen, close } = useSidebarStore();

  const handleLogout = () => {
    toast.success("Sesión cerrada");
    router.push("/");
    close();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={close} />
      )}
      <aside className={cn(
        "w-64 bg-[var(--sidebar)] flex flex-col flex-shrink-0 overflow-y-auto z-50 transition-transform duration-300",
        "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        "fixed top-0 left-0 h-full",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      <div className="p-6 border-b border-[var(--sidebar-border)]">
        <Link href="/" className="flex items-center gap-2 mb-2">
          {logoUrl ? (
            <Image src={logoUrl} alt={platformName} width={120} height={32} className="h-8 w-auto object-contain" unoptimized />
          ) : (
            <>
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-white">{platformName}</span>
            </>
          )}
        </Link>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
          Panel Admin
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] shadow-sm"
                  : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)]"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Admin Patzi</p>
            <p className="text-[var(--sidebar-foreground)]/50 text-xs">Superadmin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-[var(--sidebar-foreground)]/60 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
    </>
  );
}
