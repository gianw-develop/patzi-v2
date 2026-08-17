"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check, CheckCircle2, FileText, LoaderCircle, Search,
  Upload, WalletCards, X, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";

import { Button } from "@/components/ui/button";
import {
  balanceFor, formatMoney, formatUsdt, getDepositProofUrl, getPayoutProofUrl,
  maskWallet, type LedgerOperation, type LedgerProof, useStableLedgerStore,
} from "@/lib/stable-ledger-store";

const HISTORICAL_IMPORT_NOTE = "Importación histórica autorizada por administración";

const inputClass = "h-11 w-full rounded-xl border border-[#071A2D]/10 bg-white px-3.5 text-sm font-medium shadow-sm outline-none transition focus:border-[#0AA883] focus:ring-4 focus:ring-[#0AA883]/8";

function Modal({ children, onClose, width = "max-w-xl" }: { children: React.ReactNode; onClose: () => void; width?: string }) {
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#071A2D]/38 p-3 backdrop-blur-[3px]" onMouseDown={onClose}><div className={`max-h-[94vh] w-full ${width} overflow-y-auto rounded-[1.6rem] border border-white/70 bg-[#FCFDFB] shadow-[0_34px_100px_rgba(7,26,45,.28)]`} onMouseDown={(event)=>event.stopPropagation()}>{children}</div></div>;
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#071A2D]/8 bg-[#FCFDFB]/95 px-5 py-4 backdrop-blur"><div><h2 className="text-xl font-semibold">{title}</h2>{subtitle&&<p className="mt-1 text-xs text-[#071A2D]/45">{subtitle}</p>}</div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-[#071A2D]/8 bg-white"><X className="h-4 w-4"/></button></div>;
}

function Status({ operation }: { operation: LedgerOperation }) {
  if (operation.adminNote === HISTORICAL_IMPORT_NOTE) return <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-semibold text-violet-700">Registro histórico</span>;
  if (["payment_received","preparing","completed"].includes(operation.status)) return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5"/>Aprobado</span>;
  if (operation.status === "blocked") return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-semibold text-red-600"><XCircle className="h-3.5 w-3.5"/>No aprobado</span>;
  if (operation.status === "waiting_payment") return <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700">Falta comprobante</span>;
  return <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-700">Comprobante enviado</span>;
}

export default function StableLedgerAdminExperience() {
  const {
    loading, error, operations, accounts, wallets, payouts, payoutRequests,
    load, approveDeposit, rejectDeposit, verifyWallet, recordPayout,
  } = useStableLedgerStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [review, setReview] = useState<LedgerOperation | null>(null);
  const [actualReceived, setActualReceived] = useState("");
  const [rejecting, setRejecting] = useState<LedgerOperation | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [preview, setPreview] = useState<{ url: string; proof: LedgerProof } | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutUserId, setPayoutUserId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutFile, setPayoutFile] = useState<File | null>(null);
  const [payoutRequestId, setPayoutRequestId] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    void load("admin");
    const interval = window.setInterval(() => void load("admin"), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const totals = useMemo(() => {
    const approved = operations.filter((item)=>["payment_received","preparing","completed"].includes(item.status)&&item.bankReceivedAmount!=null);
    const received = approved.reduce((sum,item)=>sum+(item.bankReceivedAmount??0),0);
    const fee = approved.reduce((sum,item)=>sum+item.patziFee,0);
    const generated = approved.reduce((sum,item)=>sum+item.generatedUsdt,0);
    const paid = payouts.reduce((sum,item)=>sum+item.amount,0);
    return { received, fee, generated, paid, pending: Math.round((generated-paid)*100)/100 };
  }, [operations,payouts]);

  const clients = useMemo(() => {
    const map = new Map<string,{id:string;name:string;email:string}>();
    operations.forEach((item)=>map.set(item.userId,{id:item.userId,name:item.userName,email:item.userEmail}));
    return [...map.values()].filter((client)=>balanceFor(operations,payouts,client.id).available>0||wallets.some((wallet)=>wallet.userId===client.id));
  }, [operations,payouts,wallets]);

  const selectedClient = clients.find((item)=>item.id===payoutUserId)??clients[0];
  const selectedWallet = wallets.find((item)=>item.userId===selectedClient?.id);
  const selectedBalance = selectedClient?balanceFor(operations,payouts,selectedClient.id):{credited:0,paid:0,available:0};
  const selectedPendingRequests = payoutRequests.filter((item)=>item.userId===selectedClient?.id&&item.status==="pending");

  const rows = operations.filter((item)=>{
    const needle=search.trim().toLowerCase();
    const matches=!needle||[item.reference,item.userName,item.senderName,item.senderEmail,item.senderBank].some((value)=>value.toLowerCase().includes(needle));
    const status=statusFilter==="all"||(statusFilter==="pending"&&["proof_submitted","verifying","correction_requested"].includes(item.status))||(statusFilter==="approved"&&["payment_received","preparing","completed"].includes(item.status))||(statusFilter==="rejected"&&item.status==="blocked");
    return matches&&status;
  });

  const actual = Number(actualReceived);
  const validActual = Boolean(review&&Number.isFinite(actual)&&actual>0&&actual<=review.declaredAmount);
  const bankFee = review&&validActual?Math.round((review.declaredAmount-actual)*100)/100:0;
  const patziFee = validActual?Math.round(actual*10)/100:0;
  const generated = validActual?Math.round(actual*90)/100:0;

  const showProof = async (proof: LedgerProof, payout=false) => {
    try { setPreview({url:payout?await getPayoutProofUrl(proof):await getDepositProofUrl(proof),proof}); }
    catch(error){toast.error(error instanceof Error?error.message:"No se pudo abrir el comprobante.");}
  };

  const approve = async (event:FormEvent) => {
    event.preventDefault(); if(!review||!validActual)return;
    setBusy("approve");
    try{await approveDeposit(review.id,actual);toast.success(`${review.reference} aprobado y ${formatUsdt(generated)} acreditados`);setReview(null);}
    catch(error){toast.error(error instanceof Error?error.message:"No se pudo aprobar.");}
    finally{setBusy("");}
  };

  const reject = async (event:FormEvent) => {
    event.preventDefault();if(!rejecting)return;setBusy("reject");
    try{await rejectDeposit(rejecting.id,rejectReason);toast.success("Depósito marcado como no aprobado");setRejecting(null);setRejectReason("");}
    catch(error){toast.error(error instanceof Error?error.message:"No se pudo rechazar.");}
    finally{setBusy("");}
  };

  const openPayout = (userId?:string,requestId?:string,amount?:number) => {
    const id=userId??clients[0]?.id??"";setPayoutUserId(id);setPayoutRequestId(requestId??"");setPayoutAmount(amount?String(amount):"");setPayoutFile(null);setPayoutOpen(true);
  };

  const submitPayout = async (event:FormEvent) => {
    event.preventDefault();if(!selectedClient||!payoutFile)return toast.error("Carga el comprobante del pago.");
    setBusy("payout");
    try{await recordPayout(selectedClient.id,Number(payoutAmount),payoutFile,payoutRequestId||undefined);toast.success("Abono USDT registrado");setPayoutOpen(false);setPayoutAmount("");setPayoutFile(null);setPayoutRequestId("");}
    catch(error){toast.error(error instanceof Error?error.message:"No se pudo registrar el abono.");}
    finally{setBusy("");}
  };

  if(loading)return <><Header title="Pagos Stable" subtitle="Cargando control USDT"/><div className="grid flex-1 place-items-center bg-[#F5F7F2]"><LoaderCircle className="h-8 w-8 animate-spin text-[#0AA883]"/></div></>;

  return <>
    <Header title="Pagos Stable" subtitle="Conciliación USD, crédito USDT y abonos parciales"/>
    <main className="pathline-grid flex-1 bg-[#F5F7F2] p-4 sm:p-6 xl:p-8"><div className="mx-auto max-w-[1560px] space-y-5">
      {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <section className="grid gap-3 rounded-[1.5rem] border border-[#071A2D]/7 bg-white p-4 shadow-[0_18px_45px_rgba(7,26,45,.06)] sm:grid-cols-5 sm:p-5">{[["USD recibido",formatMoney(totals.received)],["Comisión Patzi 10%",formatMoney(totals.fee)],["USDT generado",formatUsdt(totals.generated)],["USDT pagado",formatUsdt(totals.paid)],["Saldo pendiente",formatUsdt(totals.pending)]].map(([label,value],index)=><div key={label} className={`rounded-xl px-3 py-3 ${index===4?"bg-[#E7FAF3]":"bg-[#F8FAF8]"}`}><p className="text-[10px] font-semibold text-[#071A2D]/42">{label}</p><p className={`mt-2 text-lg font-semibold ${index===4?"text-[#087F62]":""}`}>{value}</p></div>)}</section>

      <section className="overflow-hidden rounded-[1.6rem] border border-[#071A2D]/7 bg-white shadow-[0_18px_45px_rgba(7,26,45,.06)]"><div className="flex flex-col justify-between gap-3 border-b border-[#071A2D]/7 p-5 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Revisión de depósitos</h2><p className="mt-1 text-xs text-[#087F62]">Más recientes arriba</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#071A2D]/35"/><input value={search} onChange={(e)=>setSearch(e.target.value)} className={`${inputClass} pl-9 sm:w-64`} placeholder="Cliente, remitente o referencia"/></label><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className={inputClass}><option value="all">Todos los estados</option><option value="pending">Por revisar</option><option value="approved">Aprobados</option><option value="rejected">No aprobados</option></select></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left"><thead className="bg-[#F7F9F7] text-[10px] uppercase tracking-[.12em] text-[#071A2D]/42"><tr>{["Fecha","Usuario Patzi / Quién envía","Cuenta receptora Patzi","Monto declarado","Comprobante","Estado","Acciones"].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{rows.map((item)=>{const account=accounts.find((value)=>value.id===item.accountId);const reviewable=Boolean((item.proof||item.adminNote===HISTORICAL_IMPORT_NOTE)&&["proof_submitted","verifying","correction_requested"].includes(item.status));return <tr key={item.id} className="border-t border-[#071A2D]/6 text-sm"><td className="whitespace-nowrap px-4 py-4"><b>{new Date(`${item.depositDate}T12:00:00`).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})}</b><p className="mt-1 text-[10px] text-[#071A2D]/40">{item.reference}</p></td><td className="px-4 py-4"><b>{item.userName}</b><p className="mt-1 text-xs text-[#087F62]">{item.senderName}</p><p className="mt-1 text-[10px] text-[#071A2D]/42">{item.senderEmail} · {item.senderPhone}</p></td><td className="px-4 py-4"><b>{account?.holder??"—"}</b><p className="mt-1 text-xs text-[#071A2D]/45">{account?.bank} · {account?.accountNumber.slice(-4)} · {item.paymentRail}</p></td><td className="px-4 py-4"><b>{formatMoney(item.declaredAmount)}</b><p className={`mt-1 text-xs ${item.bankReceivedAmount==null?"text-amber-600":"text-[#087F62]"}`}>{item.bankReceivedAmount==null?"Banco: pendiente":`Banco: ${formatMoney(item.bankReceivedAmount)}`}</p></td><td className="px-4 py-4">{item.proof?<button onClick={()=>void showProof(item.proof!)} className="inline-flex items-center gap-2 rounded-lg border border-[#071A2D]/8 px-3 py-2 text-xs font-semibold"><FileText className="h-4 w-4 text-[#D9563E]"/>Ver</button>:item.adminNote===HISTORICAL_IMPORT_NOTE?<span className="rounded-full bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700">Registro histórico</span>:<span className="text-xs text-[#071A2D]/38">No cargado</span>}</td><td className="px-4 py-4"><Status operation={item}/></td><td className="px-4 py-4">{reviewable?<div className="flex gap-2"><Button onClick={()=>{setReview(item);setActualReceived(String(item.bankReceivedAmount??item.declaredAmount));}} className="h-9 bg-[#0AA883] px-3 text-xs text-white"><Check className="mr-1.5 h-4 w-4"/>Aprobar</Button><Button variant="outline" onClick={()=>setRejecting(item)} className="h-9 border-red-200 px-3 text-xs text-red-600">No aprobar</Button></div>:<span className="text-xs text-[#071A2D]/38">Decidido</span>}</td></tr>})}{rows.length===0&&<tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#071A2D]/45">No hay depósitos para este filtro.</td></tr>}</tbody></table></div>
      </section>

      <section className="rounded-[1.6rem] border border-[#071A2D]/7 bg-white p-5 shadow-[0_18px_45px_rgba(7,26,45,.05)]"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="premium-kicker text-[#087F62]">Tesorería USDT</p><h2 className="mt-1 text-xl font-semibold">Abonos y saldos de clientes</h2></div><Button onClick={()=>openPayout()} disabled={clients.length===0} className="h-11 bg-[#071A2D] text-white">Registrar abono USDT</Button></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-[10px] uppercase tracking-[.12em] text-[#071A2D]/42"><tr>{["Cliente","Wallet USDT","Saldo disponible","Solicitud pendiente","Acción"].map((h)=><th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody>{clients.map((client)=>{const wallet=wallets.find((item)=>item.userId===client.id);const balance=balanceFor(operations,payouts,client.id);const request=payoutRequests.find((item)=>item.userId===client.id&&item.status==="pending");return <tr key={client.id} className="border-t border-[#071A2D]/6"><td className="px-3 py-3"><b>{client.name}</b><p className="text-xs text-[#071A2D]/42">{client.email}</p></td><td className="px-3 py-3">{wallet?<><span className="font-mono text-xs">{maskWallet(wallet.address)}</span><button onClick={()=>void verifyWallet(client.id,!wallet.verified).then(()=>toast.success(wallet.verified?"Wallet marcada como pendiente":"Wallet verificada")).catch((e)=>toast.error(e instanceof Error?e.message:"No se pudo actualizar"))} className={`ml-2 rounded-full px-2 py-1 text-[9px] font-semibold ${wallet.verified?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{wallet.verified?"Verificada":"Verificar"}</button></>:<span className="text-xs text-[#071A2D]/38">Sin wallet</span>}</td><td className="px-3 py-3 font-semibold text-[#087F62]">{formatUsdt(balance.available)}</td><td className="px-3 py-3">{request?<span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{formatUsdt(request.amount)}</span>:<span className="text-xs text-[#071A2D]/38">—</span>}</td><td className="px-3 py-3"><Button onClick={()=>openPayout(client.id,request?.id,request?.amount)} disabled={!wallet?.verified||balance.available<=0} variant="outline" className="h-9 text-xs">Abonar</Button></td></tr>})}</tbody></table></div>
        <div className="mt-5 border-t border-[#071A2D]/7 pt-4"><h3 className="text-sm font-semibold">Historial de abonos</h3><div className="mt-3 space-y-2">{payouts.slice(0,10).map((payout)=>{const client=clients.find((item)=>item.id===payout.userId);return <div key={payout.id} className="grid items-center gap-2 rounded-xl bg-[#F7F9F7] px-4 py-3 text-sm sm:grid-cols-[1fr_.8fr_.8fr_auto]"><span>{client?.name??"Cliente"}</span><b className="text-[#087F62]">{formatUsdt(payout.amount)}</b><span className="text-xs text-[#071A2D]/45">{new Date(payout.paidAt).toLocaleString("es-ES",{dateStyle:"medium",timeStyle:"short"})}</span><button onClick={()=>void showProof(payout.proof,true)} className="text-xs font-semibold">Ver comprobante</button></div>})}{payouts.length===0&&<p className="rounded-xl bg-[#F7F9F7] p-4 text-sm text-[#071A2D]/45">Todavía no hay abonos USDT.</p>}</div></div>
      </section>
    </div></main>

    {review&&<Modal onClose={()=>setReview(null)}><ModalHeader title="Conciliar depósito" subtitle={`${review.reference} · ${review.senderName}`} onClose={()=>setReview(null)}/><form onSubmit={approve} className="p-5"><div className="rounded-xl bg-[#F7F9F7] p-4"><p className="text-xs text-[#071A2D]/45">Monto declarado por el cliente</p><p className="mt-1 text-xl font-semibold">{formatMoney(review.declaredAmount)}</p></div><label className="mt-4 block text-xs font-semibold">Monto realmente recibido<div className="relative mt-1.5"><input autoFocus required type="number" min="0.01" max={review.declaredAmount} step="0.01" value={actualReceived} onChange={(e)=>setActualReceived(e.target.value)} className={`${inputClass} pr-12 text-lg font-semibold`}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold">USD</span></div></label><div className="mt-4 space-y-3 rounded-xl border border-[#071A2D]/7 p-4 text-sm"><div className="flex justify-between"><span className="text-[#071A2D]/48">Fee bancario</span><b>{formatMoney(bankFee)}</b></div><div className="flex justify-between"><span className="text-[#071A2D]/48">Comisión Patzi 10%</span><b>{formatMoney(patziFee)}</b></div><div className="flex justify-between border-t border-[#071A2D]/7 pt-3 text-[#087F62]"><span className="font-semibold">Saldo USDT generado</span><b className="text-xl">{formatUsdt(generated)}</b></div></div>{review.proof&&<button type="button" onClick={()=>void showProof(review.proof!)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#071A2D]/9 text-sm font-semibold"><FileText className="h-4 w-4"/>Ver comprobante</button>}<p className="mt-3 text-xs text-[#071A2D]/45">La comisión se calcula sobre el monto realmente recibido.</p><div className="mt-5 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={()=>{setRejecting(review);setReview(null);}} className="h-11 border-red-200 text-red-600">No aprobar</Button><Button disabled={!validActual||busy==="approve"} className="h-11 bg-[#0AA883] text-white">{busy==="approve"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}Aprobar y acreditar</Button></div></form></Modal>}

    {rejecting&&<Modal onClose={()=>setRejecting(null)}><ModalHeader title="No aprobar depósito" subtitle={rejecting.reference} onClose={()=>setRejecting(null)}/><form onSubmit={reject} className="p-5"><label className="text-xs font-semibold">Motivo para el cliente<textarea value={rejectReason} onChange={(e)=>setRejectReason(e.target.value)} className="mt-1.5 min-h-28 w-full rounded-xl border border-[#071A2D]/10 bg-white p-3 text-sm outline-none focus:border-red-300" placeholder="Explica por qué no fue aprobado."/></label><Button disabled={busy==="reject"} className="mt-4 h-11 w-full bg-[#D9563E] text-white">{busy==="reject"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}Confirmar no aprobación</Button></form></Modal>}

    {payoutOpen&&<Modal onClose={()=>setPayoutOpen(false)} width="max-w-2xl"><ModalHeader title="Registrar abono USDT" subtitle="El comprobante quedará disponible para el cliente." onClose={()=>setPayoutOpen(false)}/><form onSubmit={submitPayout} className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-xs font-semibold">Cliente<select value={selectedClient?.id??""} onChange={(e)=>{setPayoutUserId(e.target.value);setPayoutRequestId("");setPayoutAmount("");}} className={`${inputClass} mt-1.5`}>{clients.map((client)=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label><div className="rounded-xl bg-[#E7FAF3] p-3"><p className="text-xs text-[#071A2D]/45">Saldo disponible</p><p className="mt-1 text-xl font-semibold text-[#087F62]">{formatUsdt(selectedBalance.available)}</p></div><label className="text-xs font-semibold">Monto a abonar<div className="relative mt-1.5"><input required type="number" min="0.01" max={selectedBalance.available} step="0.01" value={payoutAmount} onChange={(e)=>setPayoutAmount(e.target.value)} className={`${inputClass} pr-16`}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold">USDT</span></div><p className="mt-2 text-xs text-[#087F62]">Saldo restante: {formatUsdt(Math.max(0,selectedBalance.available-(Number(payoutAmount)||0)))}</p></label><div className="rounded-xl border border-[#071A2D]/7 p-3"><div className="flex items-center gap-2 text-xs font-semibold"><WalletCards className="h-4 w-4"/>Wallet USDT</div><p className="mt-2 truncate font-mono text-xs">{selectedWallet?maskWallet(selectedWallet.address):"Sin wallet"}</p><p className="mt-1 text-xs text-[#071A2D]/42">Ethereum · ERC-20</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${selectedWallet?.verified?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{selectedWallet?.verified?"Verificada":"No verificada"}</span></div>{selectedPendingRequests.length>0&&<label className="sm:col-span-2 text-xs font-semibold">Solicitud asociada<select value={payoutRequestId} onChange={(e)=>{setPayoutRequestId(e.target.value);const request=selectedPendingRequests.find((item)=>item.id===e.target.value);if(request)setPayoutAmount(String(request.amount));}} className={`${inputClass} mt-1.5`}><option value="">Sin solicitud asociada</option>{selectedPendingRequests.map((request)=><option key={request.id} value={request.id}>{formatUsdt(request.amount)} · {new Date(request.createdAt).toLocaleDateString("es-ES")}</option>)}</select></label>}<label className="sm:col-span-2 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#071A2D]/12 p-6 text-center"><Upload className="h-7 w-7 text-[#0AA883]"/><b className="mt-2 text-sm">{payoutFile?.name??"Comprobante del pago"}</b><span className="mt-1 text-xs text-[#071A2D]/42">PDF, JPG o PNG · máximo 10 MB</span><input required type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={(e:ChangeEvent<HTMLInputElement>)=>setPayoutFile(e.target.files?.[0]??null)}/></label><Button disabled={busy==="payout"||!selectedWallet?.verified||Number(payoutAmount)<=0||Number(payoutAmount)>selectedBalance.available} className="sm:col-span-2 h-12 bg-[#0AA883] text-white">{busy==="payout"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}Confirmar abono</Button></form></Modal>}

    {preview&&<Modal onClose={()=>setPreview(null)} width="max-w-4xl"><ModalHeader title={preview.proof.name} subtitle="Comprobante privado" onClose={()=>setPreview(null)}/><div className="h-[75vh] bg-[#EDF1EE] p-3">{preview.proof.mimeType==="application/pdf"?<iframe title="Comprobante" src={preview.url} className="h-full w-full rounded-xl bg-white"/>:<img src={preview.url} alt="Comprobante" className="mx-auto h-full max-w-full rounded-xl object-contain"/>}</div></Modal>}
  </>;
}
