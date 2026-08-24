"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, Copy,
  ClipboardCheck, ExternalLink, FileCheck2, FileText, Filter, Landmark, LoaderCircle, Search, Trash2, WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import OperationDocuments from "@/components/stable/OperationDocuments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AssetChip, AssetMark, FlagMark, FlowCircuit } from "@/components/brand/FinancialMarks";
import { formatUsd, getProofPreviewUrl, shortWallet, STABLE_STATUS, type StableOperation, type StableStatus, useStableStore } from "@/lib/stable-store";

const verifiedStatuses: StableStatus[] = ["payment_received", "preparing", "completed"];

function StatusBadge({ status }: { status: StableStatus }) {
  const info = STABLE_STATUS[status];
  return <span className={`status-pill status-${info.tone}`}>{info.label}</span>;
}

function formatExactDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value)).replace(",", " ·");
}

export default function AdminPage() {
  const { operations, accounts, load, setStableEligible, updateStatus, reconcileOperation, setTransactionHash, assignAccount, deleteOperation } = useStableStore();
  const [selectedId, setSelectedId] = useState(operations[0]?.id ?? "");
  const [txHash, setTxHash] = useState("");
  const [tab, setTab] = useState<"detail" | "files" | "history">("detail");
  const [search, setSearch] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [actualReceived, setActualReceived] = useState("");
  const [reconciliationEditorOpen, setReconciliationEditorOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [copiedData, setCopiedData] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [decision, setDecision] = useState<{ operationId: string; type: "approve" | "reject" } | null>(null);
  const [decisionAmount, setDecisionAmount] = useState("");
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");
  const selected = operations.find((item) => item.id === selectedId) ?? operations[0];
  const selectedEligible = Boolean(selected?.customerStableEligible);
  const selectedKycVerified = selected?.customerKycStatus === "approved";
  const senderIdentityValid = Boolean(selected?.senderLegalName && selected.senderEmail && selected.senderPhone);
  const canReassignAccount = Boolean(selected && ["waiting_payment", "correction_requested"].includes(selected.status));
  const canEditReconciliation = Boolean(selected && selected.proof && ["proof_submitted", "verifying", "payment_received", "correction_requested"].includes(selected.status));
  const compatibleAccounts = selected ? accounts.filter((item) => {
    const supportsRail = selected.paymentRail === "ACH" ? item.achEnabled : item.wireEnabled;
    return supportsRail && item.active && (item.capacityAvailable || item.id === selected.accountId);
  }) : [];
  const pending = operations.filter((item) => item.status === "waiting_payment").length;
  const verifying = operations.filter((item) => ["proof_submitted", "verifying"].includes(item.status)).length;
  const ready = operations.filter((item) => item.status === "preparing").length;
  const alerts = operations.filter((item) => ["blocked", "correction_requested"].includes(item.status)).length;
  const totalUsd = operations.reduce((sum, item) => sum + (item.bankReceivedAmount ?? item.usdAmount), 0);
  const totalStable = operations.reduce((sum, item) => sum + item.deliveryAmount, 0);
  const parsedActualReceived = Number(actualReceived);
  const actualReceivedValid = Boolean(selected && Number.isFinite(parsedActualReceived) && parsedActualReceived > 0 && parsedActualReceived <= selected.usdAmount);
  const previewReceived = actualReceivedValid ? parsedActualReceived : (selected?.bankReceivedAmount ?? selected?.usdAmount ?? 0);
  const previewBankFee = selected ? Math.max(0, selected.usdAmount - previewReceived) : 0;
  const previewPatziFee = Math.round(previewReceived * 10) / 100;
  const previewDelivery = Math.round(previewReceived * 90) / 100;
  const filteredOperations = operations.filter((item) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || [item.reference, item.customerName, item.customerEmail, item.senderLegalName, item.walletAddress].some((value) => value?.toLowerCase().includes(needle));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesAccount = accountFilter === "all" || item.accountId === accountFilter;
    const hasInvoice = item.documents.some((document) => document.type === "invoice");
    const hasContract = item.documents.some((document) => document.type === "contract");
    const matchesDocuments = documentFilter === "all"
      || (documentFilter === "complete" && hasInvoice && hasContract)
      || (documentFilter === "missing" && (!hasInvoice || !hasContract))
      || (documentFilter === "missing_invoice" && !hasInvoice)
      || (documentFilter === "missing_contract" && !hasContract);
    return matchesSearch && matchesStatus && matchesAccount && matchesDocuments;
  }).sort((a, b) => {
    const proofA = a.proof ? new Date(a.proof.uploadedAt).getTime() : -1;
    const proofB = b.proof ? new Date(b.proof.uploadedAt).getTime() : -1;
    return proofB - proofA || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const decisionOperation = decision ? operations.find((item) => item.id === decision.operationId) : undefined;
  const parsedDecisionAmount = Number(decisionAmount);
  const decisionAmountValid = Boolean(decisionOperation && Number.isFinite(parsedDecisionAmount) && parsedDecisionAmount > 0 && parsedDecisionAmount <= decisionOperation.usdAmount);

  useEffect(() => {
    void load("admin");
    const interval = window.setInterval(() => void load("admin"), 10_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const selectedOperationId = selected?.id;
  const selectedBankReceived = selected?.bankReceivedAmount;
  const selectedUsdAmount = selected?.usdAmount;
  const selectedTransactionHash = selected?.txHash;
  useEffect(() => {
    if (!selectedOperationId || selectedUsdAmount == null) return;
    setActualReceived(String(selectedBankReceived ?? selectedUsdAmount));
    setTxHash(selectedTransactionHash ?? "");
    setCopiedData(false);
    setDeleteConfirm("");
    setReconciliationEditorOpen(false);
  }, [selectedOperationId, selectedBankReceived, selectedUsdAmount, selectedTransactionHash]);

  const performStatus = async (status: StableStatus, label: string, note?: string) => {
    if (!selected || actionBusy) return;
    setActionBusy(`status:${status}`);
    try {
      await updateStatus(selected.id, status, label, undefined, note);
      toast.success(`Listo: ${STABLE_STATUS[status].label}`);
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "No se pudo actualizar la operación.");
    } finally {
      setActionBusy(null);
    }
  };

  const reconcilePayment = async () => {
    if (!selected || actionBusy) return;
    if (!actualReceivedValid) {
      toast.error(`El monto recibido debe ser mayor a $0 y no superar ${formatUsd(selected.usdAmount)}.`);
      return;
    }
    setActionBusy("reconcile");
    try {
      await reconcileOperation(selected.id, parsedActualReceived);
      toast.success(`Ingreso conciliado: ${formatUsd(parsedActualReceived)} recibidos en banco`);
      setReconciliationEditorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo conciliar el ingreso.");
    } finally {
      setActionBusy(null);
    }
  };


  const openDecision = (operation: StableOperation, type: "approve" | "reject") => {
    setSelectedId(operation.id);
    setDecisionAmount(String(operation.bankReceivedAmount ?? operation.usdAmount));
    setDecision({ operationId: operation.id, type });
  };

  const confirmDecision = async () => {
    if (!decisionOperation || !decision || actionBusy) return;
    setActionBusy(`decision:${decisionOperation.id}`);
    try {
      if (decision.type === "approve") {
        if (!decisionAmountValid) throw new Error(`El monto recibido debe ser mayor a $0 y no superar ${formatUsd(decisionOperation.usdAmount)}.`);
        await reconcileOperation(decisionOperation.id, parsedDecisionAmount);
        toast.success(`Pago aprobado: ${formatUsd(parsedDecisionAmount)} recibidos`);
      } else {
        await updateStatus(decisionOperation.id, "correction_requested", "Corrección solicitada", undefined, "El comprobante no coincide con el ingreso bancario. Reemplázalo por el PDF correcto.");
        toast.success("Pago no aprobado. Se solicitó una corrección al cliente.");
      }
      setDecision(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo procesar la decisión.");
    } finally {
      setActionBusy(null);
    }
  };

  const openProof = async () => {
    if (!selected?.proof || actionBusy) return;
    setActionBusy("proof");
    try {
      const signedUrl = await getProofPreviewUrl(selected.proof);
      if (!signedUrl) {
        toast.error("No se pudo cargar el comprobante privado.");
        return;
      }
      setProofPreviewUrl(signedUrl);
    } catch {
      toast.error("No se pudo cargar el comprobante privado.");
    } finally {
      setActionBusy(null);
    }
  };

  const copyCompleteData = async () => {
    if (!selected) return;
    const invoiceAmount = selected.bankReceivedAmount ?? selected.usdAmount;
    const lines = [
      `Nombre completo: ${selected.senderLegalName ?? "No registrado"}`,
      `Correo: ${selected.senderEmail ?? "No registrado"}`,
      `Teléfono: ${selected.senderPhone ?? "No registrado"}`,
      "Dirección: No registrada",
      `Monto: ${formatUsd(invoiceAmount)} USD`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopiedData(true);
    toast.success("Datos para factura y contrato copiados");
    window.setTimeout(() => setCopiedData(false), 1800);
  };
  const complete = async () => {
    if (!selected || actionBusy) return;
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) { toast.error("Introduce un hash Ethereum válido de 66 caracteres"); return; }
    setActionBusy("complete");
    try {
      await setTransactionHash(selected.id, txHash);
      setTxHash("");
      toast.success("Hash registrado y operación completada");
    } catch (hashError) {
      toast.error(hashError instanceof Error ? hashError.message : "No se pudo registrar el hash.");
    } finally {
      setActionBusy(null);
    }
  };

  const changeEligibility = async (eligible: boolean) => {
    if (!selected || actionBusy) return;
    setActionBusy("eligibility");
    try {
      await setStableEligible(selected.userId, eligible);
      toast.success(eligible ? "Cliente habilitado para Stable" : "Acceso Stable retirado");
    } catch (eligibilityError) {
      toast.error(eligibilityError instanceof Error ? eligibilityError.message : "No se pudo cambiar el acceso.");
    } finally {
      setActionBusy(null);
    }
  };

  const changeAccount = async (accountId: string) => {
    if (!selected || actionBusy) return;
    if (!canReassignAccount) { toast.error("Solo puedes reasignar mientras la operación espera el pago."); return; }
    if (accountId === selected.accountId) return;
    setActionBusy("account");
    try {
      await assignAccount(selected.id, accountId);
      toast.success("Cuenta receptora actualizada");
    } catch (accountError) {
      toast.error(accountError instanceof Error ? accountError.message : "No se pudo asignar la cuenta.");
    } finally {
      setActionBusy(null);
    }
  };

  const removeSelectedOperation = async () => {
    if (!selected || deleteConfirm.trim() !== selected.reference || actionBusy) return;
    const fallbackId = operations.find((item) => item.id !== selected.id)?.id ?? "";
    setActionBusy("delete");
    try {
      const result = await deleteOperation(selected.id);
      setSelectedId(fallbackId);
      setDeleteOpen(false);
      setDeleteConfirm("");
      toast.success(`${selected.reference} eliminada por completo`);
      if (result.storageCleanupPending) toast.warning("La operación se eliminó; quedó una limpieza de archivo pendiente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la operación.");
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <>
      <Header title="Centro de operaciones" subtitle="Conciliación, riesgo y entrega en una sola vista" />
      <div className="admin-operations pathline-grid min-h-0 flex-1 bg-[#F1F5F2] p-[clamp(.75rem,1.15vw,2.5rem)] text-[#071A2D]">
        <div className="mx-auto w-full max-w-[1920px] space-y-[clamp(1rem,1vw,1.75rem)]">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div><p className="premium-kicker text-[clamp(.7rem,.65vw,.85rem)] text-[#087F62]">Operación en vivo</p><h1 className="mt-1 text-[clamp(1.65rem,1.65vw,2.35rem)] font-semibold tracking-[-.035em]">Control de fondos y entregas</h1><p className="mt-1 text-[clamp(.75rem,.7vw,.9rem)] text-[#071A2D]/46">Actualizado ahora · todos los importes en USD</p></div>
            <div className="flex gap-2"><label className="relative flex-1 xl:w-[clamp(360px,24vw,520px)]"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#071A2D]/35"/><input value={search} onChange={(event)=>setSearch(event.target.value)} className="h-12 w-full rounded-2xl border border-[#071A2D]/9 bg-white pl-12 pr-4 text-sm shadow-sm outline-none focus:border-[#2775CA] 2xl:h-14" placeholder="Referencia, cliente o wallet"/></label><button type="button" onClick={()=>{setSearch("");setStatusFilter("all");setAccountFilter("all");setDocumentFilter("all")}} className="grid h-12 w-12 place-items-center rounded-2xl border border-[#071A2D]/9 bg-white shadow-sm 2xl:h-14 2xl:w-14" aria-label="Limpiar filtros" title="Limpiar filtros"><Filter className="h-5 w-5"/></button></div>
          </div>

          <section className="premium-card overflow-hidden rounded-[clamp(1.5rem,1.5vw,2rem)] p-[clamp(1rem,1.4vw,1.75rem)]">
            <div className="relative z-10 grid items-stretch gap-[clamp(1rem,1.4vw,1.75rem)] lg:grid-cols-[minmax(240px,320px)_minmax(360px,1fr)_minmax(240px,320px)]">
              <div className="flex min-h-[150px] flex-col justify-center rounded-[1.4rem] border border-[#071A2D]/8 bg-white p-[clamp(1.15rem,1.25vw,1.65rem)] shadow-[0_16px_36px_rgba(7,26,45,.09)]"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF0EC] text-[#D9563E] 2xl:h-14 2xl:w-14"><Landmark className="h-6 w-6"/></div><div><p className="text-[clamp(.7rem,.65vw,.82rem)] text-[#071A2D]/45">Entrada bancaria</p><p className="mt-0.5 text-[clamp(1rem,.9vw,1.25rem)] font-semibold">USD registrado</p></div></div><div className="mt-5 flex items-center gap-3"><FlagMark country="US" className="h-7 w-7"/><span className="text-[clamp(1.5rem,1.4vw,2rem)] font-semibold tracking-[-.035em]">{formatUsd(totalUsd)}</span></div></div>
              <div className="relative min-h-[150px]"><FlowCircuit id="admin-circuit" className="absolute inset-0 h-full w-full"/><div className="absolute left-1/2 top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#071A2D]/8 bg-white px-4 py-2 text-[clamp(.68rem,.6vw,.8rem)] font-semibold shadow-md"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4DE2B5] shadow-[0_0_0_4px_rgba(77,226,181,.15)]"/>Reconciliación activa</div></div>
              <div className="flex min-h-[150px] flex-col justify-center rounded-[1.4rem] bg-[#071A2D] p-[clamp(1.15rem,1.25vw,1.65rem)] text-white shadow-[0_22px_45px_rgba(7,26,45,.24)]"><div className="flex items-center gap-3"><AssetMark asset="USDT" className="h-12 w-12 2xl:h-14 2xl:w-14"/><div><p className="text-[clamp(.7rem,.65vw,.82rem)] text-white/48">Salida Ethereum</p><p className="mt-0.5 text-[clamp(1rem,.9vw,1.25rem)] font-semibold">{totalStable.toLocaleString()} Stable</p></div></div><div className="mt-5 flex flex-wrap gap-2"><AssetChip asset="USDT" dark/><AssetChip asset="ETH" dark/></div></div>
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
                <div className="relative z-10 flex flex-col justify-between gap-3 border-b border-[#071A2D]/8 p-5 lg:flex-row lg:items-center">
                  <div><h2 className="text-base font-semibold">Pagos Stable</h2><p className="mt-1 flex items-center gap-2 text-xs font-medium text-[#087F62]"><span className="h-2 w-2 rounded-full bg-[#4DE2B5]"/>Más recientes arriba</p></div>
                  <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
                    <select aria-label="Filtrar por estado" value={statusFilter} onChange={(event)=>setStatusFilter(event.target.value)} className="rounded-lg border border-[#071A2D]/9 bg-white px-3 py-2 text-xs font-medium shadow-sm"><option value="all">Todos los estados</option>{Object.entries(STABLE_STATUS).map(([value,info])=><option key={value} value={value}>{info.label}</option>)}</select>
                    <select aria-label="Filtrar por cuenta" value={accountFilter} onChange={(event)=>setAccountFilter(event.target.value)} className="max-w-[240px] rounded-lg border border-[#071A2D]/9 bg-white px-3 py-2 text-xs font-medium shadow-sm"><option value="all">Todas las cuentas</option>{accounts.map((item)=><option key={item.id} value={item.id}>{item.holder} · {item.label}</option>)}</select>
                    <select aria-label="Filtrar por documentos" value={documentFilter} onChange={(event)=>setDocumentFilter(event.target.value)} className="rounded-lg border border-[#071A2D]/9 bg-white px-3 py-2 text-xs font-medium shadow-sm"><option value="all">Todos los documentos</option><option value="complete">Factura y contrato cargados</option><option value="missing">Falta algún documento</option><option value="missing_invoice">Falta factura</option><option value="missing_contract">Falta contrato</option></select>
                  </div>
                </div>
                <div className="relative z-10 overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="bg-[#F6F9F6] text-10px uppercase tracking-[.11em] text-[#071A2D]/38"><tr>{["Fecha","Referencia","Usuario Patzi / Remitente","Monto","Cuenta","Documentos","Estado","Decisión"].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
                    <tbody>{filteredOperations.map((item)=>{
                      const account=accounts.find((entry)=>entry.id===item.accountId);
                      const canReview=Boolean(item.proof&&(["proof_submitted","verifying"].includes(item.status)||(item.status==="payment_received"&&item.bankReceivedAmount==null)));
                      const approved=Boolean(item.bankReceivedAmount!=null&&verifiedStatuses.includes(item.status));
                      const hasInvoice=item.documents.some((document)=>document.type==="invoice");
                      const hasContract=item.documents.some((document)=>document.type==="contract");
                      return <tr key={item.id} onClick={()=>setSelectedId(item.id)} className={`cursor-pointer border-t border-[#071A2D]/6 transition-colors ${selected?.id===item.id?"bg-[#E9F8F2] shadow-[inset_4px_0_0_#0AA883]":"hover:bg-[#F7FAF8]"}`}>
                        <td className="whitespace-nowrap px-4 py-4"><p className="text-xs font-semibold">{formatExactDate(item.proof?.uploadedAt??item.createdAt)}</p><p className="mt-1 text-10px text-[#071A2D]/40">{item.proof?"Comprobante cargado":"Operación creada"}</p></td>
                        <td className="px-4 py-4 font-semibold">{item.reference}</td>
                        <td className="px-4 py-4"><p className="font-semibold">{item.customerName}</p><p className="mt-1 max-w-[190px] truncate text-11px text-[#087F62]">{item.senderLegalName??"Sin remitente"}</p></td>
                        <td className="whitespace-nowrap px-4 py-4"><p className="font-semibold">{formatUsd(item.usdAmount)}</p><p className={`mt-1 text-10px ${item.bankReceivedAmount==null?"text-amber-600":"text-[#087F62]"}`}>{item.bankReceivedAmount==null?"Banco pendiente":`Banco: ${formatUsd(item.bankReceivedAmount)}`}</p></td>
                        <td className="px-4 py-4"><p className="max-w-[190px] truncate font-medium">{account?.holder??"Cuenta no disponible"}</p><p className="mt-1 text-10px text-[#071A2D]/42">{account?.label??"—"} · {item.paymentRail}</p></td>
                        <td className="px-4 py-4" onClick={(event)=>event.stopPropagation()}><button type="button" onClick={()=>{setSelectedId(item.id);setTab("files")}} className="flex min-w-[132px] flex-col items-start gap-1.5" title="Abrir factura y contrato"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold ${hasInvoice?"bg-[#E7FAF3] text-[#087F62]":"bg-[#FFF4D8] text-[#A46600]"}`}><span className={`h-1.5 w-1.5 rounded-full ${hasInvoice?"bg-[#0AA883]":"bg-amber-500"}`}/>Factura {hasInvoice?"cargada":"pendiente"}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold ${hasContract?"bg-[#E7FAF3] text-[#087F62]":"bg-[#FFF4D8] text-[#A46600]"}`}><span className={`h-1.5 w-1.5 rounded-full ${hasContract?"bg-[#0AA883]":"bg-amber-500"}`}/>Contrato {hasContract?"cargado":"pendiente"}</span></button></td>
                        <td className="px-4 py-4"><StatusBadge status={item.status}/></td>
                        <td className="px-4 py-4" onClick={(event)=>event.stopPropagation()}>{canReview?<div className="flex items-center gap-2"><Button onClick={()=>openDecision(item,"approve")} disabled={Boolean(actionBusy)} className="h-9 bg-[#071A2D] px-3 text-11px font-semibold text-white shadow-sm hover:bg-[#0B263D]">Aprobar</Button><Button onClick={()=>openDecision(item,"reject")} disabled={Boolean(actionBusy)} variant="outline" className="h-9 border-[#D9563E]/20 px-3 text-11px font-semibold text-[#D9563E]">No aprobar</Button></div>:approved?<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F62]"><CheckCircle2 className="h-4 w-4"/>Aprobado</span>:item.status==="correction_requested"?<span className="text-xs font-semibold text-[#D9563E]">No aprobado</span>:<button type="button" onClick={()=>setSelectedId(item.id)} className="text-xs font-semibold text-[#071A2D]/45">Ver detalle</button>}</td>
                      </tr>})}</tbody>
                  </table>
                </div>
                <div className="relative z-10 border-t border-[#071A2D]/8 p-3 text-xs text-[#071A2D]/40">{filteredOperations.length} operaciones · ordenadas por comprobante más reciente</div>
              </section>

              <section className="premium-card rounded-[1.6rem] p-5">
                <div className="relative z-10 mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold">Cuentas receptoras</h2><p className="mt-1 text-xs text-[#071A2D]/42">Capacidad operativa semanal</p></div><Link href="/admin/accounts" className="text-xs font-semibold text-[#087F62]">Gestionar <ArrowUpRight className="inline h-3.5 w-3.5"/></Link></div>
                <div className="relative z-10 space-y-2">{accounts.map((item)=>{const usable=item.active&&item.capacityAvailable;const tone=item.utilizationPercent>=90?"bg-[#FF765B]":item.utilizationPercent>=70?"bg-amber-500":"bg-[#4DE2B5]";const rails=[item.achEnabled&&"ACH",item.wireEnabled&&"Wire"].filter(Boolean).join(" · ");return <div key={item.id} className={`grid items-center gap-3 rounded-2xl border p-3 text-xs sm:grid-cols-[1.4fr_.7fr_.85fr_1.25fr_auto] ${usable?"border-[#071A2D]/7 bg-white":"border-slate-200 bg-slate-100 opacity-65 grayscale-[.3]"}`}><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF1FF]"><Landmark className="h-5 w-5 text-[#2775CA]"/></div><div className="min-w-0"><b className="block truncate text-sm font-semibold text-[#071A2D]">{item.holder}</b><span className="mt-0.5 block truncate text-xs text-[#071A2D]/45">{item.label}</span></div></div><span className={usable?"font-medium text-[#087F62]":"text-slate-500"}>{usable?"● Disponible":item.active?"● Cupo agotado":"● Pausada"}</span><span className="font-medium">{formatUsd(item.weeklyUsed)} esta semana</span><div><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-[#071A2D]/7"><div className={`h-full rounded-full ${usable?tone:"bg-slate-400"}`} style={{width:`${Math.min(100,item.utilizationPercent)}%`}}/></div><span className="text-xs text-[#071A2D]/45">{Math.round(item.utilizationPercent)}%</span></div><p className="mt-1 text-xs text-[#071A2D]/42">{formatUsd(item.weeklyAvailable)} disponibles · reinicia domingo</p></div><div className="text-right"><span className="inline-flex rounded-full bg-[#E7FAF3] px-2.5 py-1 text-11px font-semibold text-[#087F62]">Balanceo automático</span><p className="mt-1 text-11px text-[#071A2D]/40">{rails}</p></div></div>})}</div>              </section>
            </main>

            {selected && <aside className="premium-card h-fit rounded-[1.7rem] p-5 xl:sticky xl:top-3">
              <div className="relative z-10 flex items-center justify-between border-b border-[#071A2D]/8 pb-4"><div className="flex items-center gap-3"><AssetMark asset={selected.asset} className="h-9 w-9"/><div><p className="premium-kicker text-[#087F62]">Patzi Stable</p><h2 className="mt-1 text-lg font-semibold">{selected.reference}</h2></div></div>{selected.walletAddress&&<button type="button" onClick={()=>window.open(`https://etherscan.io/address/${selected.walletAddress}`,"_blank","noopener,noreferrer")} className="grid h-9 w-9 place-items-center rounded-xl border border-[#071A2D]/9 bg-white" aria-label="Ver wallet en Etherscan"><ExternalLink className="h-4 w-4"/></button>}</div>
              <div className="relative z-10 mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#071A2D] text-sm font-semibold text-white shadow-lg">{selected.customerName.split(" ").map((part)=>part[0]).join("").slice(0,2).toUpperCase()}</div><div><p className="font-semibold">{selected.customerName}</p><p className="mt-1 text-xs text-[#071A2D]/42">{selected.customerEmail}</p><p className={`mt-1 flex items-center gap-1 text-xs ${selectedKycVerified?"text-[#087F62]":"text-[#D9563E]"}`}><CheckCircle2 className="h-3 w-3"/>{selectedKycVerified?"KYC verificado":"KYC pendiente"}</p></div></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-xs font-semibold">Apto Stablecoin</p><p className="text-11px text-[#071A2D]/38">Control manual</p></div><Switch checked={selectedEligible} onCheckedChange={(checked)=>void changeEligibility(checked)}/></div></div>
              <div className="relative z-10 mt-4 rounded-2xl border border-[#0AA883]/18 bg-[#E7FAF3]/55 p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="premium-kicker text-[#087F62]">Titular que envía los USD</p><p className="mt-2 text-base font-semibold">{selected.senderLegalName ?? "Remitente no registrado"}</p><p className="mt-1 text-xs text-[#071A2D]/55">{selected.senderType === "business" ? "Empresa" : "Persona"}</p></div><span className={`rounded-full px-2.5 py-1 text-11px font-semibold ${senderIdentityValid ? "bg-white text-[#087F62]" : "bg-[#FFF0EC] text-[#D9563E]"}`}>{senderIdentityValid ? "Identidad completa" : "Datos pendientes"}</span></div>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div className="rounded-xl bg-white/70 p-3"><span className="text-[#071A2D]/40">Correo del remitente</span><p className="mt-1 break-all font-medium">{selected.senderEmail ?? "Sin correo"}</p></div><div className="rounded-xl bg-white/70 p-3"><span className="text-[#071A2D]/40">Teléfono</span><p className="mt-1 font-medium">{selected.senderPhone ?? "Sin teléfono"}</p></div><div className="rounded-xl bg-white/70 p-3"><span className="text-[#071A2D]/40">Banco de origen</span><p className="mt-1 font-medium">{selected.senderBankName ?? "No registrado"}</p></div><div className="rounded-xl bg-white/70 p-3"><span className="text-[#071A2D]/40">Cuenta de origen</span><p className="mt-1 font-medium">{selected.senderAccountLast4 ? `Terminada en ${selected.senderAccountLast4}` : "No registrada"}</p></div></div>
                <button type="button" onClick={()=>void copyCompleteData()} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#0AA883]/25 bg-white text-xs font-semibold text-[#087F62] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[.98] motion-reduce:transform-none"><ClipboardCheck className={`h-4 w-4 transition-transform ${copiedData?"scale-110":""}`}/>{copiedData?"Datos copiados":"Copiar datos para factura y contrato"}</button>
              </div>
              <div className="relative z-10 mt-4 rounded-xl border border-[#071A2D]/6 bg-[#F3F7F4] p-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                  <div><p className="text-sm font-semibold">{formatUsd(selected.usdAmount)}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.05em] text-[#071A2D]/38">Enviado</p></div>
                  <div><div className="flex flex-wrap items-center gap-1.5"><p className="text-sm font-semibold text-[#356DE5]">{selected.bankReceivedAmount == null && !reconciliationEditorOpen ? "Pendiente" : formatUsd(reconciliationEditorOpen ? previewReceived : (selected.bankReceivedAmount ?? selected.usdAmount))}</p>{canEditReconciliation&&<button type="button" onClick={()=>setReconciliationEditorOpen((open)=>!open)} className="rounded-full border border-[#356DE5]/18 bg-white px-2 py-0.5 text-[9px] font-semibold text-[#356DE5] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-95 motion-reduce:transform-none">{selected.bankReceivedAmount == null ? "Agregar monto real" : "Editar"}</button>}</div><p className="mt-0.5 text-[9px] uppercase tracking-[.05em] text-[#071A2D]/38">Recibido en banco</p></div>
                  <div><p className="text-sm font-semibold text-[#D9563E]">{selected.bankReceivedAmount == null && !reconciliationEditorOpen ? "—" : formatUsd(reconciliationEditorOpen ? previewBankFee : (selected.bankFeeAmount ?? 0))}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.05em] text-[#071A2D]/38">Fee bancario</p></div>
                  <div><p className="text-sm font-semibold text-[#D9563E]">{formatUsd(reconciliationEditorOpen ? previewPatziFee : selected.feeAmount)}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.05em] text-[#071A2D]/38">Patzi 10%</p></div>
                </div>
                {reconciliationEditorOpen&&canEditReconciliation&&<div className="mt-2.5 rounded-xl border border-[#356DE5]/18 bg-white p-2.5 shadow-[0_8px_24px_rgba(39,117,202,.08)]"><div className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-[10px] font-semibold text-[#071A2D]/60">Monto real recibido (USD)<input autoFocus type="number" min="0.01" max={selected.usdAmount} step="0.01" inputMode="decimal" value={actualReceived} onChange={(event)=>setActualReceived(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#356DE5]/20 bg-[#F8FAFF] px-3 text-sm font-semibold text-[#071A2D] outline-none transition-colors focus:border-[#356DE5]"/></label><Button onClick={()=>void reconcilePayment()} disabled={!actualReceivedValid||Boolean(actionBusy)} className="h-9 bg-[#071A2D] px-4 text-[11px] font-semibold transition-all active:scale-[.98]">{actionBusy==="reconcile"?<LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin"/>:null}{actionBusy==="reconcile"?"Guardando…":"Guardar monto real"}</Button></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px]"><span>Fee banco <b className="text-[#D9563E]">{formatUsd(previewBankFee)}</b></span><span>Patzi 10% <b>{formatUsd(previewPatziFee)}</b></span><span>Cliente recibe <b className="text-[#087F62]">{previewDelivery} {selected.asset}</b></span></div>{!actualReceivedValid&&<p className="mt-1.5 text-[9px] font-medium text-[#D9563E]">Usa un importe entre $0.01 y {formatUsd(selected.usdAmount)}.</p>}</div>}
                <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-1.5"><span className="text-[10px] text-[#071A2D]/45">Entrega neta</span><strong className="text-base text-[#087F62]">{(reconciliationEditorOpen ? previewDelivery : selected.deliveryAmount).toLocaleString()} {selected.asset}</strong></div>
              </div>

              <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#071A2D]/8 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold">Comprobante</p>{selected.proof&&<button type="button" onClick={()=>void openProof()} disabled={actionBusy==="proof"} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#071A2D]/9 px-2 text-10px font-semibold transition-all hover:border-[#0AA883] active:scale-95 disabled:opacity-60" aria-label="Abrir comprobante">{actionBusy==="proof"?<LoaderCircle className="h-3.5 w-3.5 animate-spin"/>:<ExternalLink className="h-3.5 w-3.5"/>}{actionBusy==="proof"?"Abriendo…":"Abrir"}</button>}</div>{selected.proof?<button type="button" onClick={()=>void openProof()} className="flex w-full items-center gap-3 rounded-xl bg-[#F6F8F6] p-3 text-left transition-colors hover:bg-[#EDF6F1]"><FileText className="h-7 w-7 text-[#D9563E]"/><div className="min-w-0"><p className="truncate text-xs font-semibold">{selected.proof.name}</p><p className="mt-1 text-11px text-[#071A2D]/38">{Math.round(selected.proof.size/1024)} KB · PDF</p></div></button>:<div className="rounded-xl border border-dashed border-[#071A2D]/15 p-4 text-center text-xs text-[#071A2D]/38">Sin comprobante</div>}</div>
                <div className="rounded-2xl border border-[#071A2D]/8 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold">Wallet</p><AssetChip asset="ETH"/></div><p className="truncate text-sm font-semibold">{shortWallet(selected.walletAddress)}</p>{selected.walletAddress?<button onClick={()=>{navigator.clipboard.writeText(selected.walletAddress);toast.success("Wallet copiada")}} className="mt-3 flex items-center gap-2 text-xs font-medium text-[#087F62]"><Copy className="h-3.5 w-3.5"/>Copiar dirección</button>:<p className="mt-2 text-xs leading-5 text-[#071A2D]/45">La dirección USDT se administra una sola vez desde el perfil del cliente.</p>}</div>
              </div>

              <div className="relative z-10 mt-3 rounded-2xl border border-[#071A2D]/8 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold">Cuenta receptora</p><p className="mt-1 text-11px text-[#071A2D]/42">{accounts.find((item)=>item.id===selected.accountId)?.holder} · {accounts.find((item)=>item.id===selected.accountId)?.label}</p></div><span className="rounded-full bg-[#E7FAF3] px-2.5 py-1 text-11px font-semibold text-[#087F62]">{selected.paymentRail}</span></div>{canReassignAccount&&<select aria-label="Cambiar cuenta receptora" value={selected.accountId} onChange={(event)=>void changeAccount(event.target.value)} disabled={actionBusy==="account"} className="mt-3 h-10 w-full rounded-xl border border-[#071A2D]/10 bg-[#F7F9F7] px-3 text-xs font-semibold outline-none focus:border-[#2775CA]">{compatibleAccounts.map((item)=><option key={item.id} value={item.id}>{item.holder} · {item.label}</option>)}</select>}{selected.status==="payment_received"&&<Button onClick={()=>void performStatus("preparing",`Preparando ${selected.asset}`)} disabled={Boolean(actionBusy)||selected.bankReceivedAmount==null} className="mt-3 h-10 w-full bg-[#071A2D] text-xs font-semibold">{actionBusy?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}Preparar {selected.asset}</Button>}</div>

              {(selected.status==="preparing"||selected.status==="completed")&&<div className="relative z-10 mt-3 rounded-2xl border border-[#0AA883]/18 bg-[#EAF8F3] p-3"><div className="flex items-center gap-2"><AssetMark asset={selected.asset} className="h-6 w-6"/><p className="text-xs font-semibold">Registrar envío por Ethereum</p></div><div className="mt-3 flex gap-2"><input value={selected.txHash||txHash} onChange={(e)=>setTxHash(e.target.value.trim())} disabled={selected.status==="completed"||actionBusy==="complete"} placeholder="0x... hash de 66 caracteres" className="h-10 min-w-0 flex-1 rounded-xl border border-[#071A2D]/9 bg-white px-3 font-mono text-11px outline-none"/><Button onClick={complete} disabled={selected.status==="completed"||actionBusy==="complete"} className="h-10 bg-[#0AA883] text-xs font-semibold text-white transition-all active:scale-[.98]">{actionBusy==="complete"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}{actionBusy==="complete"?"Registrando…":"Registrar"}</Button></div></div>}

              <div className="relative z-10 mt-4 flex gap-5 border-b border-[#071A2D]/8 text-xs">{[["detail","Detalle"],["files","Archivos"],["history","Historial"]].map(([id,label])=><button key={id} onClick={()=>setTab(id as typeof tab)} className={`pb-2 font-semibold ${tab===id?"border-b-2 border-[#0AA883] text-[#087F62]":"text-[#071A2D]/38"}`}>{label}</button>)}</div>
              <div className="relative z-10 mt-3">{tab==="history"?<div className="max-h-40 space-y-2 overflow-y-auto">{selected.history.slice().reverse().map((item)=><div key={item.id} className="grid grid-cols-[90px_1fr_70px] gap-2 rounded-xl bg-[#F6F8F6] p-2 text-10px"><span className="text-[#071A2D]/38">{new Date(item.createdAt).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}</span><span className="font-semibold">{item.label}</span><span className="text-right text-[#087F62]">{item.actor}</span></div>)}</div>:tab==="files"?<OperationDocuments operation={selected} admin />:<div className="grid grid-cols-2 gap-2 text-11px"><div className="rounded-xl bg-[#F6F8F6] p-3"><span className="text-[#071A2D]/38">Creada</span><p className="mt-1 font-semibold">{new Date(selected.createdAt).toLocaleString("es-ES")}</p></div><div className="rounded-xl bg-[#F6F8F6] p-3"><span className="text-[#071A2D]/38">Estado</span><div className="mt-1"><StatusBadge status={selected.status}/></div></div></div>}</div>
              <div className="relative z-10 mt-4 border-t border-[#D9563E]/15 pt-4"><button type="button" onClick={()=>setDeleteOpen(true)} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D9563E]/20 bg-[#FFF8F6] text-xs font-semibold text-[#D9563E] transition-all duration-200 hover:bg-[#FFF0EC] active:scale-[.98]"><Trash2 className="h-4 w-4"/>Eliminar operación por completo</button></div>
            </aside>}
          </div>
        </div>
      </div>
      <Dialog open={Boolean(proofPreviewUrl)} onOpenChange={(open)=>{if(!open)setProofPreviewUrl("")}}>
        <DialogContent className="flex h-[min(90vh,900px)] w-[min(94vw,1000px)] max-w-none flex-col overflow-hidden rounded-3xl sm:max-w-none border-[#071A2D]/10 bg-white p-0 shadow-[0_30px_90px_rgba(7,26,45,.28)]">
          <DialogHeader className="shrink-0 border-b border-[#071A2D]/8 px-5 py-4 pr-14 text-left"><DialogTitle>Comprobante · {selected?.reference}</DialogTitle><DialogDescription>{selected?.proof?.name} · documento privado</DialogDescription></DialogHeader>
          {proofPreviewUrl&&<iframe src={proofPreviewUrl} title={`Comprobante ${selected?.reference??"Patzi"}`} className="min-h-0 flex-1 bg-[#F3F5F3]"/>}
          <div className="flex shrink-0 justify-end border-t border-[#071A2D]/8 px-5 py-3"><Button type="button" onClick={()=>setProofPreviewUrl("")} className="bg-[#071A2D] text-white hover:bg-[#0B263D]">Cerrar comprobante</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(decision)} onOpenChange={(open)=>{if(!open&&!actionBusy)setDecision(null)}}>
        <DialogContent className="rounded-3xl bg-white sm:max-w-md">
          <DialogHeader><DialogTitle>{decision?.type==="approve"?"Aprobar pago":"No aprobar pago"}</DialogTitle><DialogDescription>{decision?.type==="approve"?"Confirma cuánto llegó realmente al banco. La comisión Patzi se calcula sobre este monto.":"El cliente podrá corregir el comprobante y volver a enviarlo."}</DialogDescription></DialogHeader>
          {decisionOperation&&decision?.type==="approve"&&<div className="space-y-3"><div className="rounded-2xl bg-[#F3F7F4] p-4 text-sm"><div className="flex justify-between"><span>Cliente envió</span><b>{formatUsd(decisionOperation.usdAmount)}</b></div><label className="mt-3 block text-xs font-semibold">Monto real recibido en banco<input autoFocus type="number" min="0.01" max={decisionOperation.usdAmount} step="0.01" value={decisionAmount} onChange={(event)=>setDecisionAmount(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#356DE5]/25 bg-white px-3 text-base font-semibold outline-none focus:border-[#356DE5]"/></label></div>{decisionAmountValid&&<div className="grid grid-cols-3 gap-2 text-center text-11px"><div className="rounded-xl bg-[#FFF4D8] p-2"><span>Fee banco</span><b className="mt-1 block">{formatUsd(decisionOperation.usdAmount-parsedDecisionAmount)}</b></div><div className="rounded-xl bg-[#FFF0EC] p-2"><span>Patzi 10%</span><b className="mt-1 block">{formatUsd(parsedDecisionAmount*.1)}</b></div><div className="rounded-xl bg-[#E7FAF3] p-2"><span>Cliente recibe</span><b className="mt-1 block">{(parsedDecisionAmount*.9).toLocaleString()} {decisionOperation.asset}</b></div></div>}</div>}
          {decisionOperation&&decision?.type==="reject"&&<div className="rounded-2xl bg-[#FFF4F0] p-4 text-sm"><b>{decisionOperation.reference}</b><p className="mt-1 text-[#071A2D]/55">{decisionOperation.senderLegalName}</p></div>}
          <DialogFooter><Button variant="outline" onClick={()=>setDecision(null)} disabled={Boolean(actionBusy)}>Cancelar</Button><Button onClick={()=>void confirmDecision()} disabled={Boolean(actionBusy)||(decision?.type==="approve"&&!decisionAmountValid)} className={decision?.type==="reject"?"bg-[#D9563E] text-white":"bg-[#071A2D] text-white"}>{actionBusy?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}{decision?.type==="approve"?"Confirmar aprobación":"Solicitar corrección"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={(open)=>{if(actionBusy!=="delete"){setDeleteOpen(open);if(!open)setDeleteConfirm("")}}}>
        <DialogContent className="rounded-3xl border-[#D9563E]/20 bg-white sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[#D9563E]"><Trash2 className="h-5 w-5"/>Eliminar operación permanentemente</DialogTitle><DialogDescription>Se borrarán la operación, su historial, comprobante, factura y contrato. Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          {selected&&<div className="rounded-2xl bg-[#FFF4F0] p-4"><p className="text-xs text-[#071A2D]/50">Para confirmar, escribe la referencia:</p><p className="mt-1 font-mono text-sm font-semibold text-[#071A2D]">{selected.reference}</p><input value={deleteConfirm} onChange={(event)=>setDeleteConfirm(event.target.value.toUpperCase())} autoComplete="off" className="mt-3 h-11 w-full rounded-xl border border-[#D9563E]/20 bg-white px-3 font-mono text-sm outline-none focus:border-[#D9563E]" placeholder={selected.reference}/></div>}
          <DialogFooter><Button variant="outline" onClick={()=>setDeleteOpen(false)} disabled={actionBusy==="delete"}>Cancelar</Button><Button onClick={()=>void removeSelectedOperation()} disabled={!selected||deleteConfirm.trim()!==selected.reference||actionBusy==="delete"} className="bg-[#D9563E] text-white hover:bg-[#C64732]">{actionBusy==="delete"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:<Trash2 className="mr-2 h-4 w-4"/>}{actionBusy==="delete"?"Eliminando…":"Eliminar por completo"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
