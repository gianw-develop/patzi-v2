"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight, FileCheck2, FileText,
  LoaderCircle, Plus, ShieldCheck, Upload, WalletCards, X,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import LedgerOperationDocuments from "@/components/stable/LedgerOperationDocuments";
import { AssetMark } from "@/components/brand/FinancialMarks";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import {
  balanceFor, formatMoney, formatUsdt, getDepositProofUrl, getPayoutProofUrl,
  maskWallet, type LedgerProof, type PaymentRail, useStableLedgerStore,
} from "@/lib/stable-ledger-store";

const HISTORICAL_IMPORT_NOTE = "Importación histórica autorizada por administración";

const statusLabels: Record<string, { label: string; className: string }> = {
  waiting_payment: { label: "Falta comprobante", className: "bg-amber-50 text-amber-700" },
  proof_submitted: { label: "En revisión", className: "bg-blue-50 text-blue-700" },
  verifying: { label: "En revisión", className: "bg-blue-50 text-blue-700" },
  payment_received: { label: "Aprobado", className: "bg-emerald-50 text-emerald-700" },
  preparing: { label: "Aprobado", className: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Aprobado", className: "bg-emerald-50 text-emerald-700" },
  correction_requested: { label: "Requiere corrección", className: "bg-orange-50 text-orange-700" },
  blocked: { label: "No aprobado", className: "bg-red-50 text-red-600" },
};

function Modal({ children, onClose, width = "max-w-xl" }: { children: React.ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071A2D]/38 p-3 backdrop-blur-[3px]" onMouseDown={onClose}>
      <div className={`max-h-[94vh] w-full ${width} overflow-y-auto rounded-[1.6rem] border border-white/70 bg-[#FCFDFB] shadow-[0_32px_90px_rgba(7,26,45,.25)]`} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalTitle({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#071A2D]/8 bg-[#FCFDFB]/95 px-5 py-4 backdrop-blur sm:px-6">
      <div><h2 className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-xs text-[#071A2D]/48">{subtitle}</p>}</div>
      <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-[#071A2D]/8 bg-white" aria-label="Cerrar"><X className="h-4 w-4" /></button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[#071A2D]/70">{label}<span className="mt-1.5 block">{children}</span></label>;
}

const fieldClass = "h-11 w-full rounded-xl border border-[#071A2D]/10 bg-white px-3.5 text-sm font-medium text-[#071A2D] shadow-sm outline-none transition focus:border-[#0AA883] focus:ring-4 focus:ring-[#0AA883]/8";

export default function StableLedgerExperience() {
  const {
    loading, error, stableEligible, kycVerified, operations, accounts, wallets, payouts,
    payoutRequests, load, submitDeposit, uploadDepositProof, saveWallet, requestPayout,
  } = useStableLedgerStore();
  const [userId, setUserId] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState<{ url: string; proof: LedgerProof } | null>(null);
  const [documentsOperation, setDocumentsOperation] = useState<(typeof operations)[number] | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [deposit, setDeposit] = useState({
    date: new Date().toISOString().slice(0, 10), name: "", email: "", phone: "",
    amount: "", bank: "", rail: "ACH" as PaymentRail, accountId: "",
  });

  useEffect(() => {
    void load("user");
    void createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => void load("user"), 20_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const wallet = wallets.find((item) => item.userId === userId) ?? wallets[0];
  const balance = balanceFor(operations, payouts, userId);
  const myPayouts = payouts.filter((item) => item.userId === userId);
  const myRequests = payoutRequests.filter((item) => item.userId === userId && item.status === "pending");
  const compatibleAccounts = accounts.filter((account) => account.available && (deposit.rail === "ACH" ? account.achEnabled : account.wireEnabled));
  const selectedAccount = compatibleAccounts.find((account) => account.id === deposit.accountId) ?? compatibleAccounts[0];

  useEffect(() => {
    if (!selectedAccount) return;
    if (deposit.accountId !== selectedAccount.id) setDeposit((current) => ({ ...current, accountId: selectedAccount.id }));
  }, [deposit.accountId, selectedAccount]);

  const openProof = async (proof: LedgerProof, payout = false) => {
    try {
      const url = payout ? await getPayoutProofUrl(proof) : await getDepositProofUrl(proof);
      setPreview({ url, proof });
    } catch (proofError) {
      toast.error(proofError instanceof Error ? proofError.message : "No se pudo abrir el comprobante.");
    }
  };

  const resetDeposit = () => {
    setDeposit({ date: new Date().toISOString().slice(0, 10), name: "", email: "", phone: "", amount: "", bank: "", rail: "ACH", accountId: "" });
    setProofFile(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(deposit.amount);
    if (!proofFile) return toast.error("Carga el comprobante del depósito.");
    if (!selectedAccount) return toast.error("No hay una cuenta receptora disponible.");
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Introduce un monto válido.");
    setBusy("deposit");
    try {
      await submitDeposit({
        amount,
        depositDate: deposit.date,
        senderName: deposit.name,
        senderEmail: deposit.email,
        senderPhone: deposit.phone,
        senderBank: deposit.bank,
        paymentRail: deposit.rail,
        accountId: selectedAccount.id,
      }, proofFile);
      toast.success("Depósito enviado para revisión");
      setDepositOpen(false);
      resetDeposit();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "No se pudo registrar el depósito.");
    } finally { setBusy(""); }
  };

  const persistWallet = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("wallet");
    try {
      await saveWallet(walletAddress);
      toast.success(wallet ? "Wallet actualizada; requiere nueva verificación" : "Wallet guardada para verificación");
      setWalletOpen(false);
    } catch (walletError) {
      toast.error(walletError instanceof Error ? walletError.message : "No se pudo guardar la wallet.");
    } finally { setBusy(""); }
  };

  const sendPayoutRequest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("request");
    try {
      await requestPayout(Number(requestAmount));
      toast.success("Solicitud de pago enviada");
      setRequestOpen(false);
      setRequestAmount("");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "No se pudo solicitar el pago.");
    } finally { setBusy(""); }
  };

  if (loading) return <><Header title="Patzi Stable" subtitle="Cargando tu saldo USDT" /><div className="grid flex-1 place-items-center bg-[#F5F7F2]"><LoaderCircle className="h-8 w-8 animate-spin text-[#0AA883]" /></div></>;
  if (!stableEligible || !kycVerified) return <><Header title="Patzi Stable" subtitle="Acceso controlado" /><div className="grid flex-1 place-items-center bg-[#F5F7F2] p-5"><div className="pathline-surface max-w-lg rounded-[2rem] p-8 text-center"><ShieldCheck className="mx-auto h-12 w-12 text-[#0AA883]"/><h1 className="mt-4 text-2xl font-semibold">Tu acceso Stable está en revisión</h1><p className="mt-2 text-sm text-[#071A2D]/52">Patzi debe aprobar tu KYC y habilitar este servicio.</p></div></div></>;

  return (
    <>
      <Header title="Patzi Stable" subtitle="Depósitos USD · saldo y pagos exclusivamente en USDT" />
      <main className="pathline-grid flex-1 bg-[#F5F7F2] p-4 sm:p-6 xl:p-8">
        <div className="mx-auto max-w-[1480px] space-y-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <section className="grid gap-4 lg:grid-cols-[1.35fr_.85fr]">
            <article className="relative overflow-hidden rounded-[1.8rem] border border-[#071A2D]/7 bg-white p-6 shadow-[0_22px_55px_rgba(7,26,45,.09)] sm:p-7">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#4DE2B5]/16 blur-3xl" />
              <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold text-[#071A2D]/48">Saldo disponible</p><div className="mt-3 flex items-center gap-4"><p className="text-[clamp(2.35rem,4vw,4.5rem)] font-semibold leading-none tracking-[-.055em] text-[#098469]">{formatUsdt(balance.available)}</p><AssetMark asset="USDT" className="h-12 w-12 shadow-lg" /></div><p className="mt-3 text-sm text-[#071A2D]/48">Total acumulado después de la comisión Patzi.</p></div>
                <Button onClick={() => { setRequestAmount(balance.available > 0 ? String(balance.available) : ""); setRequestOpen(true); }} disabled={balance.available <= 0 || !wallet?.verified} className="h-12 bg-[#0AA883] px-6 text-white shadow-[0_14px_28px_rgba(10,168,131,.22)]">Solicitar pago <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
              <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-[#071A2D]/7 pt-5 text-sm"><div><p className="text-xs text-[#071A2D]/42">USDT generado</p><b className="mt-1 block">{formatUsdt(balance.credited)}</b></div><div><p className="text-xs text-[#071A2D]/42">USDT pagado</p><b className="mt-1 block">{formatUsdt(balance.paid)}</b></div><div><p className="text-xs text-[#071A2D]/42">Solicitudes</p><b className="mt-1 block">{myRequests.length} pendiente{myRequests.length === 1 ? "" : "s"}</b></div></div>
            </article>

            <article className="rounded-[1.8rem] border border-[#071A2D]/7 bg-white p-6 shadow-[0_22px_55px_rgba(7,26,45,.07)]">
              <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E7FAF3] text-[#087F62]"><WalletCards className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Wallet USDT</p><p className="mt-1 text-xs text-[#071A2D]/45">Ethereum · ERC-20</p></div></div>{wallet && <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${wallet.verified ? "bg-[#E7FAF3] text-[#087F62]" : "bg-amber-50 text-amber-700"}`}>{wallet.verified ? "Verificada" : "Pendiente"}</span>}</div>
              <p className="mt-6 truncate font-mono text-base font-semibold">{wallet ? maskWallet(wallet.address) : "Aún no has guardado una wallet"}</p>
              <p className="mt-2 text-xs leading-5 text-[#071A2D]/45">Esta dirección se usa para todos tus pagos USDT. No se repite en cada depósito.</p>
              <Button variant="outline" onClick={() => { setWalletAddress(wallet?.address ?? ""); setWalletOpen(true); }} className="mt-5 h-11 w-full border-[#071A2D]/10">{wallet ? "Gestionar wallet" : "Guardar wallet"}</Button>
            </article>
          </section>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="premium-kicker text-[#087F62]">Depósitos USD</p><h2 className="mt-1 text-2xl font-semibold">Depósitos recientes</h2></div><Button onClick={() => setDepositOpen(true)} className="h-11 bg-[#0AA883] text-white"><Plus className="mr-2 h-4 w-4" />Registrar depósito</Button></div>

          <section className="overflow-hidden rounded-[1.6rem] border border-[#071A2D]/7 bg-white shadow-[0_18px_45px_rgba(7,26,45,.06)]">
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="bg-[#F7F9F7] text-[10px] uppercase tracking-[.12em] text-[#071A2D]/42"><tr>{["Fecha","Quién envía","USD depositado","Cuenta receptora Patzi","Comprobante","Estado","Documentos"].map((heading)=><th key={heading} className="px-5 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>
              {operations.map((operation) => { const account=accounts.find((item)=>item.id===operation.accountId); const status=statusLabels[operation.status]??statusLabels.proof_submitted; return <tr key={operation.id} className="border-t border-[#071A2D]/6 text-sm"><td className="px-5 py-4"><b>{new Date(`${operation.depositDate}T12:00:00`).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})}</b><p className="mt-1 text-[10px] text-[#071A2D]/38">{operation.reference}</p></td><td className="px-5 py-4"><b>{operation.senderName}</b><p className="mt-1 text-xs text-[#071A2D]/45">{operation.senderEmail}</p></td><td className="px-5 py-4 font-semibold">{formatMoney(operation.declaredAmount)}</td><td className="px-5 py-4"><b>{account?.holder??"—"}</b><p className="mt-1 text-xs text-[#071A2D]/45">{account?.bank} · {account?.accountNumber.slice(-4)} · {operation.paymentRail}</p></td><td className="px-5 py-4">{operation.proof?<button onClick={()=>void openProof(operation.proof!)} className="inline-flex items-center gap-2 rounded-lg border border-[#071A2D]/8 px-3 py-2 text-xs font-semibold"><FileCheck2 className="h-4 w-4 text-[#D9563E]"/>Abrir</button>:operation.adminNote===HISTORICAL_IMPORT_NOTE?<span className="rounded-full bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700">Registro histórico</span>:<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"><Upload className="h-4 w-4"/>Completar<input type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={(event)=>{const file=event.target.files?.[0];if(file)void uploadDepositProof(operation.id,file).then(()=>toast.success("Comprobante cargado")).catch((uploadError)=>toast.error(uploadError instanceof Error?uploadError.message:"No se pudo cargar"));}}/></label>}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>{operation.bankReceivedAmount!=null&&<p className="mt-2 text-xs text-[#087F62]">+ {formatUsdt(operation.generatedUsdt)}</p>}</td><td className="px-5 py-4"><Button variant="outline" onClick={()=>setDocumentsOperation(operation)} className="h-9 px-3 text-xs"><FileText className="mr-1.5 h-4 w-4"/>Ver</Button></td></tr>; })}
              {operations.length===0&&<tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#071A2D]/45">Aún no tienes depósitos. Registra el primero con los datos reales del remitente.</td></tr>}
            </tbody></table></div>
          </section>

          <section className="rounded-[1.6rem] border border-[#071A2D]/7 bg-white p-5 shadow-[0_18px_45px_rgba(7,26,45,.05)] sm:p-6"><div className="flex items-center justify-between"><div><p className="premium-kicker text-[#087F62]">Pagos recibidos</p><h2 className="mt-1 text-xl font-semibold">Historial de abonos USDT</h2></div><AssetMark asset="USDT" className="h-9 w-9" /></div><div className="mt-5 space-y-2">{myPayouts.map((payout)=><div key={payout.id} className="grid items-center gap-3 rounded-xl border border-[#071A2D]/7 px-4 py-3 text-sm sm:grid-cols-[.8fr_1fr_1fr_auto]"><span>{new Date(payout.paidAt).toLocaleDateString("es-ES",{dateStyle:"medium"})}</span><b className="text-[#087F62]">{formatUsdt(payout.amount)}</b><span className="truncate font-mono text-xs text-[#071A2D]/48">{maskWallet(payout.walletAddress)}</span><button onClick={()=>void openProof(payout.proof,true)} className="inline-flex items-center gap-2 text-xs font-semibold"><FileText className="h-4 w-4"/>Comprobante</button></div>)}{myPayouts.length===0&&<p className="rounded-xl bg-[#F7F9F7] p-5 text-center text-sm text-[#071A2D]/45">Todavía no has recibido abonos USDT.</p>}</div></section>
        </div>
      </main>

      {depositOpen && <Modal onClose={()=>setDepositOpen(false)} width="max-w-2xl"><ModalTitle title="Nuevo depósito USD" subtitle="Registra únicamente los datos reales del depósito." onClose={()=>setDepositOpen(false)}/><form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><Field label="Fecha del depósito"><input required type="date" max={new Date().toISOString().slice(0,10)} value={deposit.date} onChange={(e)=>setDeposit({...deposit,date:e.target.value})} className={fieldClass}/></Field><Field label="Monto enviado"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#071A2D]/45">$</span><input required type="number" min="0.01" step="0.01" value={deposit.amount} onChange={(e)=>setDeposit({...deposit,amount:e.target.value})} className={`${fieldClass} pl-7 pr-12`}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold">USD</span></div></Field><Field label="Nombre de quien envía"><input required minLength={3} value={deposit.name} onChange={(e)=>setDeposit({...deposit,name:e.target.value})} className={fieldClass} placeholder="Nombre completo o empresa"/></Field><Field label="Correo"><input required type="email" value={deposit.email} onChange={(e)=>setDeposit({...deposit,email:e.target.value})} className={fieldClass} placeholder="correo@ejemplo.com"/></Field><Field label="Teléfono"><input required type="tel" value={deposit.phone} onChange={(e)=>setDeposit({...deposit,phone:e.target.value})} className={fieldClass} placeholder="+1 555 123 4567"/></Field><Field label="Banco de origen"><input required value={deposit.bank} onChange={(e)=>setDeposit({...deposit,bank:e.target.value})} className={fieldClass} placeholder="Banco desde donde envía"/></Field><Field label="ACH o Wire"><select value={deposit.rail} onChange={(e)=>setDeposit({...deposit,rail:e.target.value as PaymentRail,accountId:""})} className={fieldClass}><option value="ACH">ACH</option><option value="WIRE">Wire</option></select></Field><Field label="Cuenta receptora Patzi"><select required value={selectedAccount?.id??""} onChange={(e)=>setDeposit({...deposit,accountId:e.target.value})} className={fieldClass}>{compatibleAccounts.map((account)=><option key={account.id} value={account.id}>{account.holder} · {account.bank} · {account.accountNumber.slice(-4)}</option>)}</select></Field><label className="sm:col-span-2 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#071A2D]/12 bg-white p-6 text-center transition hover:border-[#0AA883]"><Upload className="h-7 w-7 text-[#0AA883]"/><b className="mt-2 text-sm">{proofFile?.name??"Comprobante PDF o imagen"}</b><span className="mt-1 text-xs text-[#071A2D]/42">PDF, JPG o PNG · máximo 10 MB</span><input required type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={(e)=>setProofFile(e.target.files?.[0]??null)}/></label><div className="sm:col-span-2 rounded-xl bg-[#E7FAF3]/65 px-4 py-3 text-xs leading-5 text-[#087F62]">Patzi verificará cuánto llegó realmente al banco. El 10% se calculará sobre ese monto confirmado.</div><Button disabled={busy==="deposit"} className="sm:col-span-2 h-12 bg-[#0AA883] text-white">{busy==="deposit"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}{busy==="deposit"?"Enviando…":"Enviar para revisión"}</Button></form></Modal>}

      {walletOpen && <Modal onClose={()=>setWalletOpen(false)}><ModalTitle title="Wallet USDT" subtitle="Una sola dirección permanente para tus pagos." onClose={()=>setWalletOpen(false)}/><form onSubmit={persistWallet} className="p-6"><Field label="Dirección Ethereum · ERC-20"><input required pattern="^0x[0-9a-fA-F]{40}$" value={walletAddress} onChange={(e)=>setWalletAddress(e.target.value.trim())} className={`${fieldClass} font-mono`} placeholder="0x..."/></Field><div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Si cambias una wallet verificada, quedará pendiente de nueva aprobación antes de recibir USDT.</div><Button disabled={busy==="wallet"} className="mt-5 h-12 w-full bg-[#071A2D] text-white">{busy==="wallet"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}Guardar wallet</Button></form></Modal>}

      {requestOpen && <Modal onClose={()=>setRequestOpen(false)}><ModalTitle title="Solicitar pago USDT" subtitle={`Saldo disponible: ${formatUsdt(balance.available)}`} onClose={()=>setRequestOpen(false)}/><form onSubmit={sendPayoutRequest} className="p-6"><Field label="Monto a solicitar"><div className="relative"><input autoFocus required type="number" min="0.01" max={balance.available} step="0.01" value={requestAmount} onChange={(e)=>setRequestAmount(e.target.value)} className={`${fieldClass} pr-16`}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold">USDT</span></div></Field><p className="mt-3 text-xs text-[#071A2D]/48">El pago se enviará a {wallet?maskWallet(wallet.address):"tu wallet verificada"} por Ethereum · ERC-20.</p><Button disabled={busy==="request"} className="mt-5 h-12 w-full bg-[#0AA883] text-white">{busy==="request"?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:null}Enviar solicitud</Button></form></Modal>}

      {documentsOperation&&<Modal onClose={()=>setDocumentsOperation(null)} width="max-w-2xl"><ModalTitle title="Factura y contrato" subtitle={`${documentsOperation.reference} · documentos privados`} onClose={()=>setDocumentsOperation(null)}/><div className="p-5"><LedgerOperationDocuments operationId={documentsOperation.id} userId={documentsOperation.userId}/></div></Modal>}

      {preview&&<Modal onClose={()=>setPreview(null)} width="max-w-4xl"><ModalTitle title={preview.proof.name} subtitle="Comprobante privado" onClose={()=>setPreview(null)}/><div className="h-[75vh] bg-[#EDF1EE] p-3">{preview.proof.mimeType==="application/pdf"?<iframe title="Comprobante" src={preview.url} className="h-full w-full rounded-xl bg-white"/>:<img src={preview.url} alt="Comprobante" className="mx-auto h-full max-w-full rounded-xl object-contain"/>}</div></Modal>}
    </>
  );
}
