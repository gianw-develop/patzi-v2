"use client";

import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, ArrowLeftRight, TrendingUp, DollarSign,
  ArrowRight, ShieldCheck, Clock, CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MOCK_ADMIN_STATS, MOCK_VOLUME_CHART, MOCK_CURRENCY_DISTRIBUTION, MOCK_TRANSFERS, MOCK_USERS } from "@/lib/mock-data";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-700 border-blue-200", icon: RefreshCw },
  completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
};

export default function AdminDashboardPage() {
  const stats = MOCK_ADMIN_STATS;

  const statCards = [
    { title: "Usuarios totales", value: stats.total_users.toLocaleString(), sub: `${stats.active_users} activos`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Transacciones", value: stats.total_transactions.toLocaleString(), sub: `${stats.transactions_today} hoy`, icon: ArrowLeftRight, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Volumen total", value: `€${(stats.total_volume / 1000).toFixed(0)}K`, sub: `€${stats.volume_today.toLocaleString()} hoy`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Fees cobrados", value: `€${stats.total_fees_collected.toLocaleString()}`, sub: "comisiones acumuladas", icon: DollarSign, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <>
      <Header title="Panel de Administración" subtitle={`Resumen general · ${format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        {stats.pending_kyc > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">
                {stats.pending_kyc} verificaciones KYC pendientes de revisión
              </p>
            </div>
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              <Link href="/admin/kyc">Revisar ahora</Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.title} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.title}</p>
                  <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800">Volumen de transferencias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={MOCK_VOLUME_CHART}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => [`€${Number(value).toLocaleString()}`, "Volumen"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                  <Area type="monotone" dataKey="volume" stroke="#1e3a8a" strokeWidth={2.5} fill="url(#volGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800">Distribución por corredor</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={MOCK_CURRENCY_DISTRIBUTION} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {MOCK_CURRENCY_DISTRIBUTION.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value)}%`, "Participación"]} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {MOCK_CURRENCY_DISTRIBUTION.map((d) => (
                  <div key={d.currency} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.currency}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{d.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800">Transacciones por mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MOCK_VOLUME_CHART} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="transactions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold text-slate-800">Últimas transacciones</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-blue-600 text-xs">
                <Link href="/admin/transactions">Ver todas <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_TRANSFERS.map((t) => {
                const cfg = STATUS_CONFIG[t.status];
                const StatusIcon = cfg.icon;
                const user = MOCK_USERS.find((u) => u.id === t.user_id);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center text-lg flex-shrink-0">
                      <span>{CURRENCY_INFO[t.send_currency].flag}</span>
                      <span className="text-slate-300 text-xs mx-0.5">→</span>
                      <span>{CURRENCY_INFO[t.receive_currency].flag}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || "Usuario"}</p>
                      <p className="text-xs text-slate-500">
                        {CURRENCY_INFO[t.send_currency].symbol}{t.send_amount} → {CURRENCY_INFO[t.receive_currency].symbol}{t.receive_amount.toFixed(2)} · {t.reference}
                      </p>
                    </div>
                    <Badge className={`text-xs border ${cfg.color} flex items-center gap-1 flex-shrink-0`}>
                      <StatusIcon className="w-3 h-3" />{cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
