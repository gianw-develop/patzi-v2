"use client";

import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBrandStore } from "@/lib/brand-store";
import { useUserStore } from "@/lib/user-store";
import Link from "next/link";
import {
  Send, Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ArrowRight, ShieldCheck, RefreshCw, Plus, Sparkles,
} from "lucide-react";
import { MOCK_WALLETS, MOCK_TRANSFERS } from "@/lib/mock-data";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG = {
  pending:    { label: "Pendiente",  color: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: Clock },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-700 border-blue-200",        icon: RefreshCw },
  completed:  { label: "Completado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed:     { label: "Fallido",    color: "bg-red-100 text-red-700 border-red-200",            icon: AlertCircle },
  cancelled:  { label: "Cancelado",  color: "bg-slate-100 text-slate-600 border-slate-200",      icon: AlertCircle },
};

const RATES = [
  { from: "EUR", to: "PEN", rate: "4.12",  flag1: "", flag2: "" },
  { from: "EUR", to: "VES", rate: "39.50", flag1: "", flag2: "" },
  { from: "USD", to: "PEN", rate: "3.79",  flag1: "", flag2: "" },
  { from: "USD", to: "VES", rate: "36.40", flag1: "", flag2: "" },
];

export default function DashboardPage() {
  const wallets = MOCK_WALLETS;
  const recentTransfers = MOCK_TRANSFERS.slice(0, 3);
  const { platformName } = useBrandStore();
  const { full_name } = useUserStore();
  const firstName = full_name ? full_name.split(" ")[0] : "bienvenido";
  const totalEUR = wallets.reduce((acc, w) => {
    if (w.currency === "EUR") return acc + w.balance;
    if (w.currency === "USD") return acc + w.balance * 0.921;
    return acc;
  }, 0);

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`Bienvenido, ${firstName} · ${format(new Date(), "EEEE d 'de' MMMM", { locale: es })}`}
      />

      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-5">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 rounded-2xl p-6 text-white">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-2">
                Balance total estimado
              </p>
              <p className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                €{totalEUR.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-blue-300 text-sm mt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Suma de todas tus billeteras activas
              </p>
            </div>

            <div className="flex flex-row gap-2.5">
              <Button
                asChild
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg shadow-emerald-900/30 h-10 px-3 sm:px-5 text-sm"
              >
                <Link href="/dashboard/send">
                  <Send className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Enviar dinero</span>
                  <span className="sm:hidden">Enviar</span>
                </Link>
              </Button>
              {/* FIXED: transparent bg + white text + white border — no outline variant */}
              <Button
                asChild
                className="bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold h-10 px-3 sm:px-5 shadow-none text-sm"
              >
                <Link href="/dashboard/wallet">
                  <Wallet className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Mi billetera</span>
                  <span className="sm:hidden">Billetera</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Wallets + Rates ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Wallet cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wallets.map((wallet) => {
              const info = CURRENCY_INFO[wallet.currency];
              const isEUR = wallet.currency === "EUR";
              return (
                <Card key={wallet.id} className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`h-1.5 w-full ${isEUR ? "bg-gradient-to-r from-blue-500 to-blue-700" : "bg-gradient-to-r from-emerald-500 to-teal-600"}`} />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{info.flag}</span>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{wallet.currency}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{info.name}</p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] font-semibold border ${isEUR ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          Activa
                        </Badge>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {info.symbol}{wallet.balance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button asChild size="sm" className={`h-7 text-xs flex-1 font-semibold ${isEUR ? "bg-blue-900 hover:bg-blue-800 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
                          <Link href="/dashboard/wallet">
                            <Plus className="w-3 h-3 mr-1" /> Recargar
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs flex-1">
                          <Link href="/dashboard/send">
                            <Send className="w-3 h-3 mr-1" /> Enviar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Rates card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Tasas del día</p>
                  <p className="text-[10px] text-slate-400">
                    {format(new Date(), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                {RATES.map((r) => (
                  <div key={`${r.from}-${r.to}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span>{r.flag1}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span>{r.flag2}</span>
                      <span className="text-xs text-slate-500 font-medium ml-0.5">{r.from}/{r.to}</span>
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{r.rate}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    <span className="font-bold">Comisión cero</span> · Sin cargos ocultos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Transfers + KYC ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent transfers */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <p className="font-bold text-slate-800">Últimas transferencias</p>
                  <Button asChild variant="ghost" size="sm" className="text-blue-600 text-xs h-7 px-2">
                    <Link href="/dashboard/history">
                      Ver todas <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentTransfers.map((t) => {
                    const cfg = STATUS_CONFIG[t.status];
                    const StatusIcon = cfg.icon;
                    const from = CURRENCY_INFO[t.send_currency];
                    const to = CURRENCY_INFO[t.receive_currency];
                    return (
                      <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-base">
                          {to.flag}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{t.beneficiary_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {from.symbol}{t.send_amount} → {to.symbol}{t.receive_amount.toFixed(2)} ·{" "}
                            {format(new Date(t.created_at), "d MMM", { locale: es })}
                          </p>
                        </div>
                        <Badge className={`text-[11px] border shrink-0 ${cfg.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-3 border-t border-slate-50">
                  <Button asChild variant="ghost" className="w-full h-9 text-sm text-slate-500 hover:text-blue-600">
                    <Link href="/dashboard/history">
                      Ver historial completo <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* KYC */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-bold text-white text-sm">Verifica tu identidad</p>
                  <p className="text-white/80 text-xs mt-1">
                    Desbloquea límites mayores y accede a todas las funcionalidades.
                  </p>
                </div>
                <div className="p-4">
                  <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-9 text-sm">
                    <Link href="/dashboard/profile">Verificar ahora →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Free transfer banner */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-600 to-teal-600 text-white overflow-hidden relative">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <CardContent className="p-5 relative">
                <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-bold mb-3">
                  PROMOCIÓN
                </Badge>
                <p className="font-bold text-lg leading-tight">Envíos sin comisión</p>
                <p className="text-emerald-100 text-xs mt-1 mb-4">
                  Todas tus transferencias internacionales son <strong className="text-white">100% gratis</strong>.
                </p>
                <Button asChild className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold h-9 text-sm">
                  <Link href="/dashboard/send">
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Enviar ahora
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
