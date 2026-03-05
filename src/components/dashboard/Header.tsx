"use client";

import { Bell, Search, CheckCheck, ArrowLeftRight, ShieldCheck, Wallet, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserNotifications, useAdminNotifications } from "@/lib/notifications-store";
import type { Notification } from "@/lib/notifications-store";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useSidebarStore } from "@/lib/sidebar-store";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const TYPE_ICON: Record<Notification["type"], React.ElementType> = {
  transfer: ArrowLeftRight,
  kyc: ShieldCheck,
  wallet: Wallet,
  system: Settings,
};

const TYPE_COLOR: Record<Notification["type"], string> = {
  transfer: "bg-blue-100 text-blue-600",
  kyc: "bg-emerald-100 text-emerald-600",
  wallet: "bg-purple-100 text-purple-600",
  system: "bg-slate-100 text-slate-600",
};

export default function Header({ title, subtitle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith("/admin");
  const { toggle } = useSidebarStore();

  const userStore = useUserNotifications();
  const adminStore = useAdminNotifications();
  const store = isAdmin ? adminStore : userStore;

  const unread = store.notifications.filter((n) => !n.read).length;

  const handleClick = (n: Notification) => {
    store.markRead(n.id);
    if (n.href) router.push(n.href);
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar..." className="pl-9 h-9 w-48 bg-slate-50 border-slate-200 text-sm" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-slate-600" />
              {unread > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0 pointer-events-none">
                  {unread > 9 ? "9+" : unread}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-800 text-sm">Notificaciones</span>
                {unread > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 h-4">
                    {unread} nueva{unread > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={() => store.markAllRead()}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todo leído
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {store.notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin notificaciones</p>
                </div>
              ) : (
                store.notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_COLOR[n.type]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${!n.read ? "text-slate-800" : "text-slate-600"}`}>
                            {n.title}
                          </p>
                          {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-100">
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las notificaciones →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
