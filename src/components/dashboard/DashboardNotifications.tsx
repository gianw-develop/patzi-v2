"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock, FileCheck2, ShieldCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

interface NotificationItem {
  id: string;
  label: string;
  description: string;
  href: string;
  count: number;
  icon: typeof Clock;
}

export default function DashboardNotifications({ admin, label }: { admin: boolean; label: string }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (admin) {
      const [kyc, stable, remittances, errors] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").eq("kyc_status", "pending"),
        supabase.from("stable_operations").select("id", { count: "exact", head: true }).in("status", ["proof_submitted", "verifying", "correction_requested"]),
        supabase.from("transfers").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
        supabase.from("client_error_reports").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);
      setItems([
        { id: "kyc", label: "KYC por revisar", description: "Documentos pendientes", href: "/admin/kyc", count: kyc.count ?? 0, icon: ShieldCheck },
        { id: "stable", label: "Stable requiere atención", description: "Comprobantes y correcciones", href: "/admin/stable", count: stable.count ?? 0, icon: FileCheck2 },
        { id: "remittances", label: "Remesas activas", description: "Pendientes o procesando", href: "/admin/transactions", count: remittances.count ?? 0, icon: Clock },
        { id: "errors", label: "Errores recientes", description: "Reportes autenticados en 24 h", href: "/admin/settings#errors", count: errors.count ?? 0, icon: Bell },
      ].filter((item) => item.count > 0));
      return;
    }

    const [stable, remittances, profile] = await Promise.all([
      supabase.from("stable_operations").select("id", { count: "exact", head: true }).neq("status", "completed").neq("status", "blocked"),
      supabase.from("transfers").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
      supabase.from("profiles").select("kyc_status, kyc_rejection_reason").single(),
    ]);
    const next: NotificationItem[] = [];
    if ((stable.count ?? 0) > 0) next.push({ id: "stable", label: "Operaciones Stable", description: "Consulta sus estados", href: "/dashboard", count: stable.count ?? 0, icon: FileCheck2 });
    if ((remittances.count ?? 0) > 0) next.push({ id: "remittances", label: "Remesas en curso", description: "Pendientes o procesando", href: "/dashboard/history", count: remittances.count ?? 0, icon: Clock });
    if (profile.data?.kyc_status === "pending") next.push({ id: "kyc", label: "KYC en revisión", description: "Te avisaremos al finalizar", href: "/dashboard/profile", count: 1, icon: ShieldCheck });
    if (profile.data?.kyc_status === "rejected") next.push({ id: "kyc", label: "Corrige tu KYC", description: profile.data.kyc_rejection_reason || "Revisa el documento", href: "/dashboard/profile", count: 1, icon: ShieldCheck });
    setItems(next);
  }, [admin]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 30_000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [load]);

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return <DropdownMenu>
    <DropdownMenuTrigger asChild><button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#071A2D]/10 bg-white" aria-label={label}><Bell className="h-4 w-4" />{total > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF765B] px-1 text-[8px] font-bold text-white">{Math.min(total, 99)}</span>}</button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl p-2 shadow-xl"><DropdownMenuLabel className="flex items-center justify-between px-3 py-2"><span>{t("Notificaciones")}</span><button type="button" onClick={() => void load()} className="text-xs font-medium text-[#087F62]">{t("Actualizar")}</button></DropdownMenuLabel><DropdownMenuSeparator />{items.length === 0 ? <div className="px-3 py-8 text-center"><CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500" /><p className="text-sm font-medium">{t("Todo al día")}</p><p className="mt-1 text-xs text-slate-500">{t("No hay acciones pendientes.")}</p></div> : items.map((item) => <DropdownMenuItem key={item.id} asChild className="rounded-xl p-0"><Link href={item.href} className="flex items-start gap-3 px-3 py-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E7FAF3] text-[#087F62]"><item.icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{t(item.label)}</p><span className="rounded-full bg-[#071A2D] px-2 py-0.5 text-[10px] font-bold text-white">{item.count}</span></div><p className="mt-1 truncate text-xs text-slate-500">{t(item.description)}</p></div></Link></DropdownMenuItem>)}</DropdownMenuContent>
  </DropdownMenu>;
}
