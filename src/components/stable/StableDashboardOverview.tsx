"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Send, ShieldCheck, WalletCards } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { AssetMark } from "@/components/brand/FinancialMarks";
import { useUserStore } from "@/lib/user-store";
import { balanceFor, formatMoney, formatUsdt, maskWallet, useStableLedgerStore } from "@/lib/stable-ledger-store";
import { useTransferStore } from "@/lib/transfer-store";

const labels: Record<string, string> = {
  waiting_payment: "Pendiente de comprobante",
  proof_submitted: "En revisión",
  verifying: "Verificando",
  correction_requested: "Requiere corrección",
  payment_received: "USDT acreditado",
  preparing: "USDT acreditado",
  completed: "Completado",
  blocked: "No aprobado",
};

export default function StableDashboardOverview() {
  const { id: userId, full_name, stable_eligible } = useUserStore();
  const { operations, wallets, payouts, load } = useStableLedgerStore();
  const { transfers, loadTransfers } = useTransferStore();

  const wallet = wallets.find((item) => item.userId === userId) ?? wallets[0];
  const balance = balanceFor(operations, payouts, userId);

  useEffect(() => {
    void load("user");
    void loadTransfers("user");
  }, [load, loadTransfers]);

  return <>
    <Header title={`Hola, ${full_name?.split(" ")[0] || "bienvenido"}`} subtitle="Tu dinero y tus operaciones, en una sola vista." />
    <main className="pathline-grid flex-1 bg-[#F5F7F2] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="grid gap-4 lg:grid-cols-2">
          <Link href="/dashboard/send" className="group relative flex min-h-32 items-center justify-between overflow-hidden rounded-[1.6rem] bg-[#0AA883] p-6 text-white shadow-[0_20px_45px_rgba(10,168,131,.2)]">
            <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/12 blur-2xl" />
            <div className="relative flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/15"><Send className="h-6 w-6" /></div><div><p className="premium-kicker text-white/60">Remesas</p><h2 className="mt-1 text-xl font-semibold">Enviar dinero</h2><p className="mt-1 text-sm text-white/70">España a Venezuela o Perú</p></div></div><ArrowRight className="relative transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/dashboard/stable" className="premium-card group flex min-h-32 items-center justify-between rounded-[1.6rem] p-6">
            <div className="relative z-10 flex items-center gap-4"><AssetMark asset="USDT" className="h-12 w-12" /><div><div className="flex items-center gap-2"><p className="premium-kicker text-[#087F62]">Patzi Stable</p><span className="rounded-full bg-[#4DE2B5] px-2 py-0.5 text-[10px] font-semibold">USDT</span></div><h2 className="mt-1 text-xl font-semibold">Gestionar saldo Stable</h2><p className="mt-1 text-sm text-[#071A2D]/50">Depósitos USD y pagos USDT por ERC-20</p></div></div><ArrowRight className="relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
          <div className="overflow-hidden rounded-[1.7rem] bg-[#071A2D] p-6 text-white shadow-[0_24px_55px_rgba(7,26,45,.18)] sm:p-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="premium-kicker text-[#4DE2B5]">Saldo disponible</p><p className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{formatUsdt(balance.available)}</p><p className="mt-2 text-sm text-white/46">Listo para solicitar un abono parcial o total.</p></div><AssetMark asset="USDT" className="h-14 w-14 ring-4 ring-white/8" /></div>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm"><div><p className="text-xs text-white/40">USDT generado</p><b className="mt-1 block">{formatUsdt(balance.credited)}</b></div><div><p className="text-xs text-white/40">USDT pagado</p><b className="mt-1 block">{formatUsdt(balance.paid)}</b></div></div>
          </div>
          <div className="rounded-[1.7rem] border border-[#071A2D]/7 bg-white p-6 shadow-[0_18px_45px_rgba(7,26,45,.05)]">
            <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E7FAF3] text-[#087F62]"><WalletCards className="h-5 w-5" /></div><div><p className="font-semibold">Wallet USDT</p><p className="mt-1 text-xs text-[#071A2D]/45">Ethereum · ERC-20</p></div></div>{wallet && <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${wallet.verified ? "bg-[#E7FAF3] text-[#087F62]" : "bg-amber-50 text-amber-700"}`}>{wallet.verified ? "Verificada" : "Pendiente"}</span>}</div>
            <p className="mt-6 truncate font-mono text-base font-semibold">{wallet ? maskWallet(wallet.address) : "Configúrala una sola vez"}</p><p className="mt-2 text-xs leading-5 text-[#071A2D]/45">Esta dirección permanente se utilizará para todos tus pagos.</p><Link href="/dashboard/stable" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#071A2D]/10 text-sm font-semibold">Gestionar wallet</Link>
          </div>
        </section>

        {stable_eligible && <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#0AA883]/20 bg-[#E7FAF3] px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#087F62]"/><div><p className="font-semibold">Patzi Stable habilitado</p><p className="text-xs text-[#071A2D]/50">Tu cuenta puede registrar depósitos USD para generar saldo USDT.</p></div></div><span className="text-xs font-semibold text-[#087F62]">KYC verificado · Cuenta apta</span></div>}

        <section className="rounded-[1.7rem] border border-[#071A2D]/7 bg-white shadow-[0_18px_45px_rgba(7,26,45,.05)]">
          <div className="flex items-center justify-between border-b border-[#071A2D]/7 px-5 py-4 sm:px-6"><div><p className="premium-kicker text-[#087F62]">Actividad</p><h2 className="mt-1 text-xl font-semibold">Últimos depósitos Stable</h2></div><Link href="/dashboard/stable" className="inline-flex items-center gap-2 text-xs font-semibold text-[#087F62]">Ver todos <ArrowRight className="h-4 w-4"/></Link></div>
          <div className="divide-y divide-[#071A2D]/6">{operations.slice(0,5).map((operation)=><div key={operation.id} className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-[1fr_.7fr_.8fr_auto] sm:items-center sm:px-6"><div><b>{operation.senderName}</b><p className="mt-1 text-xs text-[#071A2D]/42">{new Date(`${operation.depositDate}T12:00:00`).toLocaleDateString("es-ES",{dateStyle:"medium"})}</p></div><b>{formatMoney(operation.declaredAmount)}</b><span className="inline-flex items-center gap-2 text-xs text-[#071A2D]/55"><Clock3 className="h-4 w-4"/>{labels[operation.status]??"En revisión"}</span><span className="text-xs font-semibold text-[#087F62]">{operation.bankReceivedAmount==null?"Pendiente":formatUsdt(operation.generatedUsdt)}</span></div>)}{operations.length===0&&<p className="px-6 py-8 text-center text-sm text-[#071A2D]/45">Aún no tienes depósitos Stable registrados.</p>}</div>
        </section>
        {transfers.length > 0 && <p className="text-center text-xs text-[#071A2D]/42">También tienes {transfers.length} remesa{transfers.length===1?"":"s"} en tu historial.</p>}
      </div>
    </main>
  </>;
}
