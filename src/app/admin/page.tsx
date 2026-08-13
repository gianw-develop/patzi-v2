"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, Check, CheckCircle2, Clock3, Copy,
  Download, ExternalLink, FileCheck2, FileText, Filter, Landmark, Search, WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import OperationDocuments from "@/components/stable/OperationDocuments";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AssetChip, AssetMark, FlagMark, FlowCircuit } from "@/components/brand/FinancialMarks";
import { downloadProof, formatUsd, shortWallet, STABLE_STATUS, type StableStatus, useStableStore } from "@/lib/stable-store";

const verifiedStatuses: StableStatus[] = ["payment_received", "preparing", "completed"];

function StatusBadge({ status }: { status: StableStatus }) {
  const info = STABLE_STATUS[status];
  return <span className={`status-pill status-${info.tone}`}>{info.label}</span>;
}

function formatElapsed(createdAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export default function AdminPage() {
  const { operations, accounts, load, setStableEligible, updateStatus, setTransactionHash, assignAccount } = useStableStore();
  const [selectedId, setSelectedId] = useState(operations[0]?.id ?? "");
  const [txHash, setTxHash] = useState("");
  const [tab, setTab] = useState<"detail" | "files" | "history">("detail");
  const [search, setSearch] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const selected = operations.find((item) => item.id === selectedId) ?? operations[0];
  const proofValid = Boolean(selected?.proof);
  const paymentMatched = selected ? verifiedStatuses.includes(selected.status) : false;
  const walletValid = Boolean(selected && /^0x[a-fA-F0-9]{40}$/.test(selected.walletAddress));
  const selectedEligible = Boolean(selected?.customerStableEligible);
  const selectedKycVerified = selected?.customerKycStatus === "approved";
  const senderIdentityValid = Boolean(selected?.senderLegalName && selected.senderEmail && selected.senderPhone);
  const checklistComplete = selectedEligible && selectedKycVerified && senderIdentityValid && proofValid && walletValid;
  const canReassignAccount = Boolean(selected && ["waiting_payment", "correction_requested"].includes(selected.status));
  const compatibleAccounts = selected ? accounts.filter((item) => {
    const supportsRail = selected.paymentRail === "ACH" ? item.achEnabled : item.wireEnabled;
    return supportsRail && item.active && (item.capacityAvailable || item.id === selected.accountId);
  }) : [];
  const pending = operations.filter((item) => item.status === "waiting_payment").length;
  const verifying = operations.filter((item) => ["proof_submitted", "verifying"].includes(item.status)).length;
  const ready = operations.filter((item) => item.status === "preparing").length;
  const alerts = operations.filter((item) => ["blocked", "correction_requested"].includes(item.status)).length;
  const totalUsd = operations.reduce((sum, item) => sum + item.usdAmount, 0);
  const totalStable = operations.reduce((sum, item) => sum + item.deliveryAmount, 0);
  const filteredOperations = operations.filter((item) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || [item.reference, item.customerName, item.customerEmail, item.senderLegalName, item.walletAddress].some((value) => value?.toLowerCase().includes(needle));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesAccount = accountFilter === "all" || item.accountId === accountFilter;
    const matchesRisk = riskFilter === "all" || item.risk === riskFilter;
    return matchesSearch && matchesStatus && matchesAccount && matchesRisk;
  });

  useEffect(() => {
    void load("admin");
    const interval = window.setInterval(() => void load("admin"), 10_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const performStatus = async (status: StableStatus, label: string, note?: string) => {
    if (!selected) return;
    try {
      await updateStatus(selected.id, status, label, undefined, note);
      toast.success(`Estado actualizado: ${STABLE_STATUS[status].label}`);
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "No se pudo actualizar la operación.");
    }
  };

  const nextAction = !selected
    ? null
    : ["proof_submitted", "verifying", "correction_requested"].includes(selected.status)
      ? { label: "Confirmar pago recibido", action: () => void performStatus("payment_received", "Pago recibido") }
      : selected.status === "payment_received"
        ? { label: `Preparar ${selected.asset}`, action: () => void performStatus("preparing", `Preparando ${selected.asset}`) }
        : null;

  const requestCorrection = async () => {
    if (!selected) return;
    await performStatus("correction_requested", "Corrección solicitada", "El comprobante no coincide con el ingreso bancario. Reemplázalo por el PDF correcto.");
  };

  const download = async () => {
    if (!selected?.proof) return;
    if (!(await downloadProof(selected.proof))) toast.error("No se pudo abrir el comprobante privado.");
  };

  const complete = async () => {
    if (!selected) return;
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) { toast.error("Introduce un hash Ethereum válido de 66 caracteres"); return; }
    try {
      await setTransactionHash(selected.id, txHash);
      setTxHash("");
      toast.success("Hash registrado y operación completada");
    } catch (hashError) {
      toast.error(hashError instanceof Error ? hashError.message : "No se pudo registrar el hash.");
    }
  };

  const changeEligibility = async (eligible: boolean) => {
    if (!selected) return;
    try {
      await setStableEligible(selected.userId, eligible);
      toast.success(eligible ? "Cliente habilitado para Stable" : "Acceso Stable retirado");
    } catch (eligibilityError) {
      toast.error(eligibilityError instanceof Error ? eligibilityError.message : "No se pudo cambiar el acceso.");
    }
  };

  const changeAccount = async (accountId: string) => {
    if (!selected) return;
    if (!canReassignAccount) { toast.error("Solo puedes reasignar mientras la operación espera el pago."); return; }
    if (accountId === selected.accountId) return;
    try {
      await assignAccount(selected.id, accountId);
      toast.success("Cuenta receptora actualizada");
    } catch (accountError) {
      toast.error(accountError instanceof Error ? accountError.message : "No se pudo asignar la cuenta.");
    }
  };

  return (
    <>
      <Header title="Centro de operaciones" subtitle="Conciliación, riesgo y entrega en una sola vista" />
      <div className="admin-operations pathline-grid min-h-0 flex-1 bg-[#F1F5F2] p-[clamp(.75rem,1.15vw,2.5rem)] text-[#071A2D]">
        <div className="mx-auto w-full max-w-[1920px] space-y-[clamp(1rem,1vw,1.75rem)]">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div><p className="premium-kicker text-[clamp(.7rem,.65vw,.85rem)] text-[#087F62]">Operación en vivo</p><h1 className="mt-1 text-[clamp(1.65rem,1.65vw,2.35rem)] font-semibold tracking-[-.035em]">Control de fondos y entregas</h1><p className="mt-1 text-[clamp(.75rem,.7vw,.9rem)] text-[#071A2D]/46">Actualizado ahora · todos los importes en USD</p></div>
            <div className="flex gap-2"><label className="relative flex-1 xl:w-[clamp(360px,24vw,520px)]"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#071A2D]/35"/><input value={search} onChange={(event)=>setSearch(event.target.value)} className="h-12 w-full rounded-2xl border border-[#071A2D]/9 bg-white pl-12 pr-4 text-sm shadow-sm outline-none focus:border-[#2775CA] 2xl:h-14" placeholder="Referencia, cliente o wallet"/></label><button type="button" onClick={()=>{setSearch("");setStatusFilter("all");setAccountFilter("all");setRiskFilter("all")}} className="grid h-12 w-12 place-items-center rounded-2xl border border-[#071A2D]/9 bg-white shadow-sm 2xl:h-14 2xl:w-14" aria-label="Limpiar filtros" title="Limpiar filtros"><Filter className="h-5 w-5"/></button></div>
          </div>

          <section className="premium-card overflow-hidden rounded-[clamp(1.5rem,1.5vw,2rem)] p-[clamp(1rem,1.4vw,1.75rem)]">
            <div className="relative z-10 grid items-stretch gap-[clamp(1rem,1.4vw,1.75rem)] lg:grid-cols-[minmax(240px,320px)_minmax(360px,1fr)_minmax(240px,320px)]">
              <div className="flex min-h-[150px] flex-col justify-center rounded-[1.4rem] border border-[#071A2D]/8 bg-white p-[clamp(1.15rem,1.25vw,1.65rem)] shadow-[0_16px_36px_rgba(7,26,45,.09)]"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF0EC] text-[#D9563E] 2xl:h-14 2xl:w-14"><Landmark className="h-6 w-6"/></div><div><p className="text-[clamp(.7rem,.65vw,.82rem)] text-[#071A2D]/45">Entrada bancaria</p><p className="mt-0.5 text-[clamp(1rem,.9vw,1.25rem)] font-semibold">USD registrado</p></div></div><div className="mt-5 flex items-center gap-3"><FlagMark country="US" className="h-7 w-7"/><span className="text-[clamp(1.5rem,1.4vw,2rem)] font-semibold tracking-[-.035em]">{formatUsd(totalUsd)}</span></div></div>
              <div className="relative min-h-[150px]"><FlowCircuit id="admin-circuit" className="absolute inset-0 h-full w-full"/><div className="absolute left-1/2 top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#071A2D]/8 bg-white px-4 py-2 text-[clamp(.68rem,.6vw,.8rem)] font-semibold shadow-md"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4DE2B5] shadow-[0_0_0_4px_rgba(77,226,181,.15)]"/>Reconciliación activa</div></div>
              <div className="flex min-h-[150px] flex-col justify-center rounded-[1.4rem] bg-[#071A2D] p-[clamp(1.15rem,1.25vw,1.65rem)] text-white shadow-[0_22px_45px_rgba(7,26,45,.24)]"><div className="flex items-center gap-3"><AssetMark asset="USDT" className="h-12 w-12 2xl:h-14 2xl:w-14"/><div><p className="text-[clamp(.7rem,.65vw,.82rem)] text-white/48">Salida Ethereum</p><p className="mt-0.5 text-[clamp(1rem,.9vw,1.25rem)] font-semibold">{totalStable.toLocaleString()} Stable</p></div></div><div className="mt-5 flex flex-wrap gap-2"><AssetChip asset="USDC" dark/><AssetChip asset="ETH" dark/></div></div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Pendientes de pago", value: pending, Icon: Clock3, color: "#B06D00", background: "#FFF4D8" },
              { label: "Por verificar", value: verifying, Icon: FileCheck2, color: "#356DE5", background: "#EAF1FF" },
              { label: "Listas para enviar", value: ready, Icon: WalletCards, color: "#7650C8", background: "#F1EAFE" },
              { label: "Alertas", value: alerts, Icon: AlertTriangle, color: "#D9563E", background: "#FFF0EC" },
            ].map(({ label, value, Icon, color, background }) => (
              <div key={label} className="premium-card rounded-[1.4rem] p-[clamp(1rem,1.25vw,1.5rem)]">
                <div className="relative z-10 flex items-center justify-between"><div><p className="text-[clamp(.72rem,.68vw,.88rem)] font-medium text-[#071A2D]/48">{label}</p><p className="mt-2 text-[clamp(2rem,2vw,2.75rem)] font-semibold tracking-[-.045em]" style={{color}}>{value}</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl 2xl:h-14 2xl:w-14" style={{background, color}}><Icon className="h-6 w-6"/></div></div>
              </div>
            ))}
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_500px]">
            <main className="min-w-0 space-y-4">
              <section className="premium-card overflow-hidden rounded-[1.6rem]">
                <div className="relative z-10 flex flex-col justify-between gap-3 border-b border-[#071A2D]/8 p-5 sm:flex-row sm:items-center"><div><h2 className="text-base font-semibold">Cola prioritaria</h2><p className="mt-1 text-xs text-[#071A2D]/42">Ordenada por antigüedad, estado y riesgo</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filtrar por estado" value={statusFilter} onChange={(event)=>setStatusFilter(event.target.value)} className="rounded-lg border border-[#071A2D]/9 bg-white px-3 py-2 text-xs font-medium shadow-sm"><option value="all">Todos los estados</option>{Object.entries(STABLE_STATUS).map(([value,info])=><option key={value} value={value}>{info.label}</option>)}</select><select aria-label="Filtrar por cuenta" value={accountFilter} onChange={(event)=>setAccountFilter(event.target.value)} className="max-w-[190px] rounded-lg border border-[#071A2D]/9 bg-white px-3 py-2 text-xs font-medium shadow-sm"><option value="all">Todas las cuentas</option>{accounts.map((item)=><option key={item.id} value={item.id}>{item.holder} · {item.label}</option>)}</select><select aria-label="Filtrar por riesgo" value={riskFilter} onChange={(event)=>setRiskFilter(event.target.value)} className="rounded-lg border border-[#071A2D]/9 bg-white px-3 py-2 text-xs font-medium shadow-sm"><option value="all">Todos los riesgos</option><option value="low">Bajo</option><option value="medium">Medio</option><option value="high">Alto</option></select></div></div>
                <div className="relative z-10 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#F6F9F6] text-10px uppercase tracking-[.11em] text-[#071A2D]/38"><tr>{["Referencia","Usuario Patzi / Remitente","Servicio","Envía","Entrega","Cuenta","Tiempo","Estado","Riesgo"].map((h)=><th key={h} className="px-3 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{filteredOperations.map((item)=><tr key={item.id} onClick={()=>setSelectedId(item.id)} className={`cursor-pointer border-t border-[#071A2D]/6 transition-colors ${selected?.id===item.id?"bg-[#E9F8F2] shadow-[inset_4px_0_0_#0AA883]":"hover:bg-[#F7FAF8]"}`}><td className="px-3 py-4 font-semibold">{item.reference}</td><td className="px-3 py-4"><p className="font-semibold">{item.customerName}</p><p className="mt-1 max-w-[180px] truncate text-11px text-[#087F62]">{item.senderLegalName ?? "Sin remitente registrado"}</p></td><td className="px-3 py-4"><span className="flex items-center gap-2 font-medium"><AssetMark asset={item.asset} className="h-5 w-5"/>Stable</span></td><td className="px-3 py-4 font-medium">{formatUsd(item.usdAmount)}</td><td className="px-3 py-4 font-semibold">{item.deliveryAmount.toLocaleString()} {item.asset}</td><td className="px-3 py-4">{accounts.find((a)=>a.id===item.accountId)?.label}</td><td className="px-3 py-4 text-[#071A2D]/48">{formatElapsed(item.createdAt)}</td><td className="px-3 py-4"><StatusBadge status={item.status}/></td><td className="px-3 py-4"><span className={`rounded-full px-2 py-1 text-11px font-semibold ${item.risk==="medium"?"bg-[#FFF4D8] text-[#A46600]":"bg-[#E7FAF3] text-[#087F62]"}`}>{item.risk==="medium"?"Medio":"Bajo"}</span></td></tr>)}</tbody></table></div>
                <div className="relative z-10 flex items-center justify-between border-t border-[#071A2D]/8 p-3 text-xs text-[#071A2D]/40"><span>{filteredOperations.length} operaciones Stable en cola</span><span>{filteredOperations.length === operations.length ? "Vista completa" : "Filtros activos"}</span></div>
              </section>

              <section className="premium-card rounded-[1.6rem] p-5">
                <div className="relative z-10 mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold">Cuentas receptoras</h2><p className="mt-1 text-xs text-[#071A2D]/42">Capacidad operativa semanal</p></div><Link href="/admin/accounts" className="text-xs font-semibold text-[#087F62]">Gestionar <ArrowUpRight className="inline h-3.5 w-3.5"/></Link></div>
                <div className="relative z-10 space-y-2">{accounts.map((item)=>{const usable=item.active&&item.capacityAvailable;const tone=item.utilizationPercent>=90?"bg-[#FF765B]":item.utilizationPercent>=70?"bg-amber-500":"bg-[#4DE2B5]";const rails=[item.achEnabled&&"ACH",item.wireEnabled&&"Wire"].filter(Boolean).join(" · ");return <div key={item.id} className={`grid items-center gap-3 rounded-2xl border p-3 text-xs sm:grid-cols-[1.4fr_.7fr_.85fr_1.25fr_auto] ${usable?"border-[#071A2D]/7 bg-white":"border-slate-200 bg-slate-100 opacity-65 grayscale-[.3]"}`}><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF1FF]"><Landmark className="h-5 w-5 text-[#2775CA]"/></div><div className="min-w-0"><b className="block truncate text-sm font-semibold text-[#071A2D]">{item.holder}</b><span className="mt-0.5 block truncate text-xs text-[#071A2D]/45">{item.label}</span></div></div><span className={usable?"font-medium text-[#087F62]":"text-slate-500"}>{usable?"● Disponible":item.active?"● Cupo agotado":"● Pausada"}</span><span className="font-medium">{formatUsd(item.weeklyUsed)} esta semana</span><div><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-[#071A2D]/7"><div className={`h-full rounded-full ${usable?tone:"bg-slate-400"}`} style={{width:`${Math.min(100,item.utilizationPercent)}%`}}/></div><span className="text-xs text-[#071A2D]/45">{Math.round(item.utilizationPercent)}%</span></div><p className="mt-1 text-xs text-[#071A2D]/42">{formatUsd(item.weeklyAvailable)} disponibles · reinicia domingo</p></div><div className="text-right"><span className="inline-flex rounded-full bg-[#E7FAF3] px-2.5 py-1 text-11px font-semibold text-[#087F62]">Balanceo automático</span><p className="mt-1 text-11px text-[#071A2D]/40">{rails}</p></div></div>})}</div>              </section>
            </main>

            {selected && <aside className="premium-card h-fit rounded-[1.7rem] p-5 xl:sticky xl:top-3">
              <div className="relative z-10 flex items-center justify-between border-b border-[#071A2D]/8 pb-4"><div className="flex items-center gap-3"><AssetMark asset={selected.asset} className="h-9 w-9"/><div><p className="premium-kicker text-[#087F62]">Patzi Stable</p><h2 className="mt-1 text-lg font-semibold">{selected.reference}</h2></div></div><button type="button" onClick={()=>window.open(`https://etherscan.io/address/${selected.walletAddress}`,"_blank","noopener,noreferrer")} className="grid h-9 w-9 place-items-center rounded-xl border border-[#071A2D]/9 bg-white" aria-label="Ver wallet en Etherscan"><ExternalLink className="h-4 w-4"/></button></div>
              <div className="relative z-10 mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#071A2D] text-sm font-semibold text-white shadow-lg">{selected.customerName.split(" ").map((part)=>part[0]).join("").slice(0,2).toUpperCase()}</div><div><p className="font-semibold">{selected.customerName}</p><p className="mt-1 text-xs text-[#071A2D]/42">{selected.customerEmail}</p><p className={`mt-1 flex items-center gap-1 text-xs ${selectedKycVerified?"text-[#087F62]":"text-[#D9563E]"}`}><CheckCircle2 className="h-3 w-3"/>{selectedKycVerified?"KYC verificado":"KYC pendiente"}</p></div></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-xs font-semibold">Apto Stablecoin</p><p className="text-11px text-[#071A2D]/38">Control manual</p></div><Switch checked={selectedEligible} onCheckedChange={(checked)=>void changeEligibility(checked)}/></div></div>
              <div className="relative z-10 mt-4 rounded-2xl border border-[#0AA883]/18 bg-[#E7FAF3]/55 p-4"><div className="flex items-start justify-between gap-3"><div><p className="premium-kicker text-[#087F62]">Titular que envía los USD</p><p className="mt-2 text-sm font-semibold">{selected.senderLegalName ?? "Remitente no registrado"}</p><p className="mt-1 text-xs text-[#071A2D]/45">{selected.senderEmail ?? "Sin correo"} · {selected.senderPhone ?? "Sin teléfono"}</p>{selected.senderBankName && <p className="mt-2 text-xs font-medium text-[#356DE5]">{selected.senderBankName}{selected.senderAccountLast4 ? ` · •••• ${selected.senderAccountLast4}` : ""}</p>}</div><span className={`rounded-full px-2.5 py-1 text-11px font-semibold ${senderIdentityValid ? "bg-white text-[#087F62]" : "bg-[#FFF0EC] text-[#D9563E]"}`}>{senderIdentityValid ? "Identidad completa" : "Datos pendientes"}</span></div></div>
              <div className="relative z-10 mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-2xl bg-[#F3F7F4] p-4 text-center"><div><p className="text-lg font-semibold">{formatUsd(selected.usdAmount)}</p><p className="text-10px text-[#071A2D]/38">RECIBIDO</p></div><span className="text-[#071A2D]/20">−</span><div><p className="text-lg font-semibold text-[#D9563E]">{formatUsd(selected.feeAmount)}</p><p className="text-10px text-[#071A2D]/38">COMISIÓN 10%</p></div><span className="text-[#071A2D]/20">=</span><div><p className="text-lg font-semibold text-[#087F62]">{selected.deliveryAmount}</p><p className="text-10px text-[#071A2D]/38">{selected.asset} A ENVIAR</p></div></div>

              <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#071A2D]/8 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold">Comprobante</p>{selected.proof&&<button onClick={download} aria-label="Descargar comprobante"><Download className="h-4 w-4"/></button>}</div>{selected.proof?<div className="flex items-center gap-3 rounded-xl bg-[#F6F8F6] p-3"><FileText className="h-7 w-7 text-[#D9563E]"/><div className="min-w-0"><p className="truncate text-xs font-semibold">{selected.proof.name}</p><p className="mt-1 text-11px text-[#071A2D]/38">{Math.round(selected.proof.size/1024)} KB · PDF</p></div></div>:<div className="rounded-xl border border-dashed border-[#071A2D]/15 p-4 text-center text-xs text-[#071A2D]/38">Sin comprobante</div>}</div>
                <div className="rounded-2xl border border-[#071A2D]/8 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold">Wallet</p><AssetChip asset="ETH"/></div><p className="truncate text-sm font-semibold">{shortWallet(selected.walletAddress)}</p><button onClick={()=>{navigator.clipboard.writeText(selected.walletAddress);toast.success("Wallet copiada")}} className="mt-3 flex items-center gap-2 text-xs font-medium text-[#087F62]"><Copy className="h-3.5 w-3.5"/>Copiar dirección</button></div>
              </div>

              <div className="relative z-10 mt-3 rounded-2xl border border-[#071A2D]/8 p-3"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold">Conciliación bancaria</p><p className="mt-1 text-11px text-[#071A2D]/40">Cuenta asignada a esta operación</p></div><span className="rounded-full bg-[#E7FAF3] px-2.5 py-1 text-11px font-semibold text-[#087F62]">{selected.paymentRail}</span></div><label className="mb-3 block text-11px font-medium text-[#071A2D]/50">Cuenta receptora<select value={selected.accountId} onChange={(event)=>void changeAccount(event.target.value)} disabled={!canReassignAccount} className="mt-1.5 h-10 w-full rounded-xl border border-[#071A2D]/10 bg-[#F7F9F7] px-3 text-xs font-semibold outline-none focus:border-[#2775CA] disabled:cursor-not-allowed disabled:opacity-60">{compatibleAccounts.map((item)=><option key={item.id} value={item.id}>{item.holder} · {item.label}</option>)}</select></label><p className="mb-3 text-11px leading-4 text-[#071A2D]/42">{canReassignAccount?"Puedes reasignar antes de recibir el pago. Solo aparecen cuentas activas y compatibles.":"La cuenta queda bloqueada después de recibir o verificar el pago."}</p><div className="grid grid-cols-3 gap-2 text-11px"><div className="rounded-lg bg-[#F7F9F7] p-2"><span className="text-[#071A2D]/40">Monto esperado</span><p className="mt-1 font-semibold">{formatUsd(selected.usdAmount)}</p></div><div className="rounded-lg bg-[#F7F9F7] p-2"><span className="text-[#071A2D]/40">Creada</span><p className="mt-1 font-semibold">{new Date(selected.createdAt).toLocaleDateString("es-ES")}</p></div><div className="rounded-lg bg-[#F7F9F7] p-2"><span className="text-[#071A2D]/40">Remitente</span><p className="mt-1 truncate font-semibold">{selected.senderLegalName ?? "Sin registro"}</p></div></div>{!paymentMatched&&<div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF4D8] p-2 text-11px text-[#A46600]"><AlertTriangle className="h-3.5 w-3.5"/>Falta conciliar el ingreso bancario.</div>}</div>
              <div className="relative z-10 mt-3 grid gap-3 rounded-2xl border border-[#071A2D]/8 p-3 sm:grid-cols-[1fr_180px]"><div><p className="mb-3 text-xs font-semibold">Lista de verificación</p>{[["Usuario Patzi apto",selectedEligible&&selectedKycVerified],["Remitente identificado",senderIdentityValid],["Ingreso conciliado",paymentMatched],["Comprobante válido",proofValid],["Wallet confirmada",walletValid]].map(([label,done])=><div key={String(label)} className="mb-2 flex items-center justify-between text-11px"><span className="flex items-center gap-2"><span className={`grid h-4 w-4 place-items-center rounded-full border ${done?"border-[#0AA883] bg-[#0AA883] text-white":"border-[#071A2D]/15"}`}>{done&&<Check className="h-2.5 w-2.5"/>}</span>{label as string}</span><span className={done?"text-[#087F62]":"text-[#071A2D]/30"}>{done?"Listo":"Pendiente"}</span></div>)}</div><div className="space-y-2">{nextAction&&<Button onClick={nextAction.action} disabled={!checklistComplete} className="h-10 w-full bg-[#071A2D] text-xs font-semibold">{nextAction.label}</Button>}<Button onClick={()=>void requestCorrection()} disabled={selected.status==="completed"||selected.status==="blocked"} variant="outline" className="h-10 w-full border-[#071A2D]/12 bg-white text-xs font-semibold text-[#D9563E] hover:bg-[#FFF0EC]">Solicitar corrección</Button></div></div>

              {(selected.status==="preparing"||selected.status==="completed")&&<div className="relative z-10 mt-3 rounded-2xl border border-[#0AA883]/18 bg-[#EAF8F3] p-3"><div className="flex items-center gap-2"><AssetMark asset={selected.asset} className="h-6 w-6"/><p className="text-xs font-semibold">Registrar envío por Ethereum</p></div><div className="mt-3 flex gap-2"><input value={selected.txHash||txHash} onChange={(e)=>setTxHash(e.target.value.trim())} disabled={selected.status==="completed"} placeholder="0x... hash de 66 caracteres" className="h-10 min-w-0 flex-1 rounded-xl border border-[#071A2D]/9 bg-white px-3 font-mono text-11px outline-none"/><Button onClick={complete} disabled={selected.status==="completed"} className="h-10 bg-[#0AA883] text-xs font-semibold text-white">Registrar</Button></div></div>}

              <div className="relative z-10 mt-4 flex gap-5 border-b border-[#071A2D]/8 text-xs">{[["detail","Detalle"],["files","Archivos"],["history","Historial"]].map(([id,label])=><button key={id} onClick={()=>setTab(id as typeof tab)} className={`pb-2 font-semibold ${tab===id?"border-b-2 border-[#0AA883] text-[#087F62]":"text-[#071A2D]/38"}`}>{label}</button>)}</div>
              <div className="relative z-10 mt-3">{tab==="history"?<div className="max-h-40 space-y-2 overflow-y-auto">{selected.history.slice().reverse().map((item)=><div key={item.id} className="grid grid-cols-[90px_1fr_70px] gap-2 rounded-xl bg-[#F6F8F6] p-2 text-10px"><span className="text-[#071A2D]/38">{new Date(item.createdAt).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}</span><span className="font-semibold">{item.label}</span><span className="text-right text-[#087F62]">{item.actor}</span></div>)}</div>:tab==="files"?<OperationDocuments operation={selected} admin />:<div className="grid grid-cols-2 gap-2 text-11px"><div className="rounded-xl bg-[#F6F8F6] p-3"><span className="text-[#071A2D]/38">Creada</span><p className="mt-1 font-semibold">{new Date(selected.createdAt).toLocaleString("es-ES")}</p></div><div className="rounded-xl bg-[#F6F8F6] p-3"><span className="text-[#071A2D]/38">Riesgo</span><p className="mt-1 font-semibold capitalize">{selected.risk}</p></div></div>}</div>
            </aside>}
          </div>
        </div>
      </div>
    </>
  );
}
