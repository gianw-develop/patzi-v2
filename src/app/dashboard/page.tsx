"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Clipboard, Copy, Download, ExternalLink, FileText, Landmark, RefreshCw, Send, ShieldCheck, Upload, WalletCards } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import OperationDocuments from "@/components/stable/OperationDocuments";
import { AssetChip, AssetMark, FlagMark, FlowCircuit } from "@/components/brand/FinancialMarks";
import { useUserStore } from "@/lib/user-store";
import { downloadProof, formatUsd, shortWallet, STABLE_STATUS, type StableStatus, useStableStore } from "@/lib/stable-store";

const timeline: { status: StableStatus; label: string }[] = [
  { status: "waiting_payment", label: "Creada" },
  { status: "proof_submitted", label: "Pago enviado" },
  { status: "verifying", label: "Verificando" },
  { status: "payment_received", label: "Pago recibido" },
  { status: "preparing", label: "Preparando" },
  { status: "completed", label: "Completada" },
];

const order: StableStatus[] = ["waiting_payment", "proof_submitted", "verifying", "payment_received", "preparing", "completed"];

function StatusBadge({ status }: { status: StableStatus }) {
  const info = STABLE_STATUS[status];
  return <span className={`status-pill status-${info.tone}`}>{info.label}</span>;
}

function copy(value: string, label: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${label} copiado`);
}

export default function DashboardPage() {
  const { full_name } = useUserStore();
  const { operations, accounts, stableEligible, uploadProof, load } = useStableStore();
  const [selectedId, setSelectedId] = useState(operations[0]?.id ?? "");
  const [filter, setFilter] = useState<"all" | "remittance" | "stable">("all");
  const selected = operations.find((operation) => operation.id === selectedId) ?? operations[0];
  const account = accounts.find((item) => item.id === selected?.accountId) ?? accounts[0];
  const currentStep = selected ? order.indexOf(selected.status) : 0;
  const accountCopyText = selected && account ? [
    "DATOS BANCARIOS PATZI",
    `Referencia: ${selected.reference}`,
    `Monto: ${formatUsd(selected.usdAmount)}`,
    `Método: ${selected.paymentRail}`,
    `Beneficiario: ${account.holder}`,
    `Banco: ${account.bank}`,
    `Número de cuenta: ${account.accountNumber}`,
    `Tipo de cuenta: ${account.accountType}`,
    `Routing ${selected.paymentRail}: ${selected.paymentRail === "ACH" ? account.achRoutingNumber : account.wireRoutingNumber}`,
    account.instructions ? `Instrucciones: ${account.instructions}` : null,
  ].filter(Boolean).join("\n") : "";

  useEffect(() => {
    void load("user");
    const interval = window.setInterval(() => void load("user"), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const context = useMemo(() => {
    if (!selected) return { title: "Sin operaciones", text: "Crea tu primera operación para comenzar." };
    if (selected.status === "waiting_payment") return { title: "Realiza el pago en USD", text: "Usa únicamente la cuenta asignada y conserva tu comprobante." };
    if (selected.status === "correction_requested") return { title: "Necesitamos una corrección", text: selected.adminNote || "Revisa los datos y reemplaza el comprobante." };
    if (["proof_submitted", "verifying"].includes(selected.status)) return { title: "Estamos revisando tu comprobante", text: "Verificaremos el ingreso bancario y te notificaremos cuando esté confirmado." };
    if (selected.status === "payment_received") return { title: "Tu pago fue recibido", text: `Prepararemos ${selected.asset} para la wallet confirmada.` };
    if (selected.status === "preparing") return { title: `Estamos preparando ${selected.asset}`, text: "La wallet y la red ya no se pueden modificar en esta etapa." };
    return { title: "Operación completada", text: "Tu hash de transacción ya está disponible." };
  }, [selected]);

  const handleProof = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selected || !file) return;
    if (file.type !== "application/pdf") { toast.error("El comprobante debe estar en formato PDF"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("El PDF debe pesar menos de 5 MB"); return; }
    try {
      await uploadProof(selected.id, file);
      toast.success("Comprobante PDF cargado");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "No se pudo subir el comprobante.");
    }
  };

  const handleDownload = async () => {
    if (!selected?.proof) return;
    if (!(await downloadProof(selected.proof))) toast.error("No se pudo abrir el comprobante privado.");
  };

  return (
    <>
      <Header title={`Buenos días, ${full_name?.split(" ")[0] || "Gian"}`} subtitle="Aquí tienes el estado de tu dinero." />
      <div className="pathline-grid flex-1 bg-[#F5F7F2] p-4 sm:p-6">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Link href="/dashboard/send" className="group relative flex min-h-28 items-center justify-between overflow-hidden rounded-[1.5rem] bg-[#0aa883] p-5 text-white shadow-[0_20px_45px_rgba(10,168,131,.2)]"><div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl"/><div className="relative flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-lg"><Send className="h-6 w-6" /></div><div><p className="premium-kicker text-white/60">Remesas</p><h2 className="mt-1 text-lg font-semibold">Enviar dinero</h2><p className="text-sm text-white/70">Haz una remesa internacional</p></div></div><ArrowRight className="relative transition-transform group-hover:translate-x-1" /></Link>
            <Link href="/dashboard/stable" className="premium-card group flex min-h-28 items-center justify-between rounded-[1.5rem] p-5"><div className="relative z-10 flex items-center gap-4"><div className="flex -space-x-2"><AssetMark asset="USDT" className="h-12 w-12 ring-4 ring-white"/><AssetMark asset="USDC" className="h-12 w-12 ring-4 ring-white"/></div><div><div className="flex items-center gap-2"><p className="premium-kicker text-[#087F62]">Patzi Stable</p><span className="rounded-full bg-[#4DE2B5] px-2 py-0.5 text-[8px] font-semibold">NUEVO</span></div><h2 className="mt-1 text-lg font-semibold">Cambiar a stablecoin</h2><p className="text-sm text-[#071A2D]/50">Recibe USDT o USDC en tu wallet</p></div></div><ArrowRight className="relative z-10 transition-transform group-hover:translate-x-1" /></Link>
          </section>

          <section className="premium-card overflow-hidden rounded-[1.6rem] p-4 sm:p-5">
            <div className="relative z-10 grid items-center gap-3 md:grid-cols-[180px_1fr_180px]">
              <div className="rounded-2xl border border-[#071A2D]/8 bg-white p-4 shadow-[0_12px_26px_rgba(7,26,45,.07)]"><p className="text-[9px] text-[#071A2D]/42">Dinero enviado</p><div className="mt-2 flex items-center justify-between"><p className="text-xl font-semibold">$1,000</p><span className="flex items-center gap-2 text-[9px] font-semibold"><FlagMark country="US"/>USD</span></div></div>
              <div className="relative min-h-[95px]"><FlowCircuit id="dashboard-circuit" className="absolute inset-0 h-full w-full"/><span className="absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-full border border-[#071A2D]/8 bg-white px-3 py-1 text-[8px] font-semibold shadow-sm">Comprobante en revisión</span></div>
              <div className="rounded-2xl bg-[#071A2D] p-4 text-white shadow-[0_16px_32px_rgba(7,26,45,.18)]"><p className="text-[9px] text-white/42">Entrega estimada</p><div className="mt-2 flex items-center justify-between"><p className="text-xl font-semibold">900</p><div className="flex -space-x-1"><AssetMark asset="USDT" className="h-7 w-7 ring-2 ring-[#071A2D]"/><AssetMark asset="ETH" className="h-7 w-7 ring-2 ring-[#071A2D]"/></div></div></div>
            </div>
          </section>

          {stableEligible && <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#0aa883]/25 bg-[#4DE2B5]/10 px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#0aa883] text-white"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-black">Patzi Stable habilitado</p><p className="text-xs text-[#071A2D]/55">Puedes crear operaciones en USDT o USDC.</p></div></div><span className="text-xs font-bold text-[#087f62]">KYC verificado · Cuenta apta</span></div>}

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#071A2D]/35">Tu actividad</p><h2 className="mt-1 text-2xl font-black">Operaciones activas</h2></div><div className="flex rounded-xl border border-[#071A2D]/10 bg-white p-1 text-xs font-bold">{[["all","Todas"],["remittance","Remesas"],["stable","Stable"]].map(([id,label]) => <button key={id} onClick={() => setFilter(id as typeof filter)} className={`rounded-lg px-4 py-2 ${filter === id ? "bg-[#071A2D] text-white" : "text-[#071A2D]/50"}`}>{label}</button>)}</div></div>

          <section className="grid gap-4 2xl:grid-cols-[285px_minmax(0,1fr)_260px]">
            <div className="pathline-surface overflow-hidden rounded-2xl">
              {(filter === "all" || filter === "stable") && operations.map(operation => <button key={operation.id} onClick={() => setSelectedId(operation.id)} className={`w-full border-b border-[#071A2D]/7 p-4 text-left transition-colors ${selected?.id === operation.id ? "bg-[#4DE2B5]/10 shadow-[inset_4px_0_0_#0aa883]" : "hover:bg-[#071A2D]/[.025]"}`}><div className="flex items-start gap-3"><AssetMark asset={operation.asset} className="h-10 w-10"/><div className="min-w-0"><span className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#087f62]">Stable</span><p className="font-semibold">{operation.reference}</p><p className="mt-1 text-xs font-medium">{formatUsd(operation.usdAmount)} → {operation.deliveryAmount.toLocaleString()} {operation.asset}</p><p className="mt-1 truncate text-[10px] text-[#071A2D]/42">{operation.senderLegalName ?? "Remitente histórico no registrado"}</p><div className="mt-2"><StatusBadge status={operation.status} /></div></div></div></button>)}
              {(filter === "all" || filter === "remittance") && <button className="w-full border-b border-[#071A2D]/7 p-4 text-left hover:bg-[#071A2D]/[.025]"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#4C7DFF]/10 text-[#356de5]"><Send className="h-5 w-5" /></div><div><span className="text-[9px] font-black uppercase tracking-[.13em] text-[#356de5]">Remesa</span><p className="font-black">RM-826417</p><p className="mt-1 text-xs font-semibold">$500 USD → S/ 1,860 PEN</p><div className="mt-2"><span className="status-pill status-received">Pago recibido</span></div></div></div></button>}
            </div>

            {selected && <div className="pathline-surface min-w-0 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-3 border-b border-[#071A2D]/8 pb-5 sm:flex-row sm:items-start"><div className="flex items-center gap-3"><AssetMark asset={selected.asset} className="h-11 w-11"/><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#087f62]">Patzi Stable</p><h3 className="mt-1 text-2xl font-semibold">{selected.reference}</h3><p className="mt-1 text-sm font-medium">{formatUsd(selected.usdAmount)} → {selected.deliveryAmount.toLocaleString()} {selected.asset}</p></div></div><StatusBadge status={selected.status} /></div>
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">{timeline.map((step,index) => { const done = index <= currentStep && currentStep >= 0; const active = index === currentStep; return <div key={step.status} className="relative text-center"><div className={`mx-auto grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-black ${active ? "border-[#071A2D] bg-[#4DE2B5]" : done ? "border-[#0aa883] bg-[#0aa883] text-white" : "border-[#071A2D]/10 bg-white text-[#071A2D]/25"}`}>{done && !active ? <Check className="h-3.5 w-3.5" /> : index+1}</div><p className={`mt-2 text-[10px] font-bold ${active ? "text-[#356de5]" : done ? "text-[#071A2D]" : "text-[#071A2D]/30"}`}>{step.label}</p></div>; })}</div>
              <div className={`mt-6 flex gap-3 rounded-2xl border p-4 ${selected.status === "correction_requested" ? "border-[#FF765B]/35 bg-[#FF765B]/10" : "border-[#4C7DFF]/20 bg-[#4C7DFF]/[.06]"}`}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#4C7DFF] text-white">{selected.status === "correction_requested" ? <AlertTriangle className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}</div><div><h4 className="font-black">{context.title}</h4><p className="mt-1 text-xs leading-5 text-[#071A2D]/55">{context.text}</p></div></div>
              {selected.senderLegalName && <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-[#0AA883]/18 bg-[#E7FAF3]/55 p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#071A2D] text-sm font-semibold text-white">{selected.senderType === "business" ? "LLC" : selected.senderLegalName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#087F62]">Titular que envía los USD</p><p className="mt-1 text-sm font-semibold">{selected.senderLegalName}</p><p className="mt-1 text-[10px] text-[#071A2D]/45">{selected.senderEmail} · {selected.senderPhone}</p></div></div><span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold text-[#087F62] shadow-sm">Identidad registrada</span></div>}
              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-[#071A2D]/9 p-4"><div className="mb-4 flex items-center gap-2 text-xs font-black"><Landmark className="h-4 w-4" />Cuenta asignada para recibir USD</div><dl className="space-y-2 text-xs">{[["Banco",account.bank],["Titular",account.holder],["Cuenta",account.accountNumber],["Método",selected.paymentRail],[`Routing ${selected.paymentRail}`,selected.paymentRail === "ACH" ? account.achRoutingNumber : account.wireRoutingNumber]].map(([label,value]) => <div key={label} className="flex items-center justify-between gap-2"><dt className="text-[#071A2D]/45">{label}</dt><dd className="flex items-center gap-1 font-bold text-right">{value}{label !== "Método" && <button onClick={() => copy(value,String(label))} aria-label={`Copiar ${label}`}><Copy className="h-3 w-3 text-[#087f62]" /></button>}</dd></div>)}</dl><button type="button" onClick={()=>copy(accountCopyText,"Datos bancarios completos")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071A2D] px-3 py-2.5 text-xs font-semibold text-white"><Copy className="h-4 w-4" />Copiar datos completos</button></div>
                <div className="rounded-2xl border border-[#071A2D]/9 p-4"><div className="mb-4 flex items-center gap-2 text-xs font-black"><FileText className="h-4 w-4" />Comprobante de pago</div>{selected.proof ? <><div className="flex items-center gap-3 rounded-xl bg-[#F5F7F2] p-3"><FileText className="h-7 w-7 text-[#d95943]" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{selected.proof.name}</p><p className="text-[10px] text-[#071A2D]/40">{Math.round(selected.proof.size/1024)} KB · PDF</p></div><button onClick={handleDownload} aria-label="Descargar PDF"><Download className="h-4 w-4" /></button></div>{selected.status === "correction_requested" && <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#071A2D]/10 py-2 text-xs font-bold"><Upload className="h-3.5 w-3.5" />Reemplazar PDF<input type="file" accept="application/pdf" className="hidden" onChange={handleProof} /></label>}</> : <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#071A2D]/12 p-5 text-center"><Upload className="h-6 w-6 text-[#087f62]" /><span className="mt-2 text-xs font-black">Subir comprobante PDF</span><span className="mt-1 text-[10px] text-[#071A2D]/40">Máximo 5 MB</span><input type="file" accept="application/pdf" className="hidden" onChange={handleProof} /></label>}</div>
                <div className="rounded-2xl border border-[#071A2D]/9 p-4"><div className="mb-4 flex items-center justify-between text-xs font-semibold"><span className="flex items-center gap-2"><WalletCards className="h-4 w-4" />Wallet de destino</span><AssetChip asset="ETH"/></div><p className="break-all text-sm font-semibold">{shortWallet(selected.walletAddress)}</p><p className="mt-1 text-xs text-[#071A2D]/45">{selected.network}</p><div className="mt-4 flex gap-2"><button onClick={() => copy(selected.walletAddress,"Wallet")} className="grid h-9 w-9 place-items-center rounded-lg bg-[#F5F7F2]"><Copy className="h-4 w-4" /></button><button className="grid h-9 w-9 place-items-center rounded-lg bg-[#F5F7F2]"><ExternalLink className="h-4 w-4" /></button></div><p className="mt-4 rounded-xl bg-[#FF765B]/10 p-3 text-[10px] leading-4 text-[#a13e2c]">La wallet y red no pueden cambiarse después de verificar el pago.</p></div>
              </div>
              <div className="mt-5"><div className="mb-3"><p className="text-sm font-semibold">Documentos de la operación</p><p className="mt-1 text-[10px] text-[#071A2D]/42">Comprobante, factura y contrato privados</p></div><OperationDocuments operation={selected} /></div>
              <div className="mt-5 grid gap-3 rounded-2xl bg-[#F5F7F2] p-4 sm:grid-cols-3"><div><p className="text-[10px] text-[#071A2D]/40">Envías</p><p className="mt-1 text-lg font-black">{formatUsd(selected.usdAmount)}</p></div><div><p className="text-[10px] text-[#071A2D]/40">Comisión Patzi 10%</p><p className="mt-1 text-lg font-black text-[#d95943]">{formatUsd(selected.feeAmount)}</p></div><div><p className="text-[10px] text-[#071A2D]/40">Recibirás</p><p className="mt-1 text-lg font-black text-[#087f62]">{selected.deliveryAmount.toLocaleString()} {selected.asset}</p></div></div>
            </div>}

            <aside className="pathline-surface rounded-2xl p-4"><h3 className="flex items-center gap-2 text-sm font-black"><Clipboard className="h-4 w-4" />Actividad reciente</h3><div className="mt-5 space-y-5">{selected?.history.slice().reverse().map((entry,index) => <div key={entry.id} className="relative flex gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${index===0 ? "bg-[#0aa883]" : "bg-[#071A2D]/18"}`} /><div><p className="text-xs font-black">{entry.label}</p><p className="mt-1 text-[10px] text-[#071A2D]/40">{new Date(entry.createdAt).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}</p></div></div>)}</div>{selected?.txHash && <div className="mt-6 rounded-xl border border-[#071A2D]/10 p-3"><p className="text-[10px] font-bold text-[#071A2D]/40">Hash de transacción</p><button onClick={() => copy(selected.txHash!,"Hash")} className="mt-2 flex w-full items-center gap-2 text-left text-xs font-black"><span className="truncate">{selected.txHash}</span><Copy className="h-3 w-3 shrink-0" /></button></div>}</aside>
          </section>
        </div>
      </div>
    </>
  );
}
