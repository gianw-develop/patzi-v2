"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Building2, CheckCircle2, Copy,
  Landmark, Plus, ShieldCheck, TimerReset, Upload, UserRound,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { AssetChip, AssetMark, FlagMark } from "@/components/brand/FinancialMarks";
import OperationDocuments from "@/components/stable/OperationDocuments";
import StableSenderForm from "@/components/stable/StableSenderForm";
import { Button } from "@/components/ui/button";
import {
  formatUsd, type StableAsset, type StableOperation, type StablePaymentRail,
  useStableStore,
} from "@/lib/stable-store";

const isEthAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);
const steps = ["Monto", "Remitente USD", "Wallet", "Pago y comprobante"];

export default function StableOperationFlow() {
  const router = useRouter();
  const {
    stableEligible, kycVerified, accounts, capacity, senders,
    addSender, addOperation, uploadProof, load, loading,
  } = useStableStore();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("1000");
  const [asset, setAsset] = useState<StableAsset>("USDT");
  const [paymentRail, setPaymentRail] = useState<StablePaymentRail>("ACH");
  const [wallet, setWallet] = useState("");
  const [senderId, setSenderId] = useState("");
  const [showNewSender, setShowNewSender] = useState(false);
  const [senderConfirmed, setSenderConfirmed] = useState(false);
  const [operation, setOperation] = useState<StableOperation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsedAmount = Number(amount) || 0;
  const selectedCapacity = capacity.find((item) => item.paymentRail === paymentRail);
  const capacityAvailable = Boolean(selectedCapacity?.available);
  const activeSenders = senders.filter((sender) => sender.active);
  const selectedSender = activeSenders.find((sender) => sender.id === senderId);
  const assignedAccount = operation ? accounts.find((account) => account.id === operation.accountId) : undefined;
  const nextResetValue = capacity.find((item) => item.weekEndsAt)?.weekEndsAt;
  const nextReset = nextResetValue ? new Date(nextResetValue) : null;
  const fee = parsedAmount * 0.1;
  const receive = parsedAmount - fee;

  useEffect(() => {
    void load("user");
    const interval = window.setInterval(() => void load("user"), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const accountCopyText = useMemo(() => {
    if (!operation || !assignedAccount) return "";
    const routing = operation.paymentRail === "ACH" ? assignedAccount.achRoutingNumber : assignedAccount.wireRoutingNumber;
    return [
      "DATOS BANCARIOS PATZI",
      `Referencia: ${operation.reference}`,
      `Monto exacto: ${formatUsd(operation.usdAmount)}`,
      `Remitente autorizado: ${operation.senderLegalName}`,
      `Método: ${operation.paymentRail}`,
      `Beneficiario: ${assignedAccount.holder}`,
      `Banco: ${assignedAccount.bank}`,
      `Número de cuenta: ${assignedAccount.accountNumber}`,
      `Tipo de cuenta: ${assignedAccount.accountType}`,
      `Routing ${operation.paymentRail}: ${routing}`,
      assignedAccount.instructions ? `Instrucciones: ${assignedAccount.instructions}` : null,
    ].filter(Boolean).join("\n");
  }, [assignedAccount, operation]);

  const copyAssignedAccount = async () => {
    await navigator.clipboard.writeText(accountCopyText);
    toast.success("Datos bancarios completos copiados");
  };

  const createOperation = async () => {
    if (!selectedSender) { toast.error("Selecciona el titular que enviará los USD"); return; }
    if (!senderConfirmed) { toast.error("Confirma que el depósito saldrá de la cuenta del remitente seleccionado"); return; }
    if (!isEthAddress(wallet)) { toast.error("Introduce una wallet Ethereum válida"); return; }
    setSubmitting(true);
    try {
      const created = await addOperation({
        usdAmount: parsedAmount,
        asset,
        walletAddress: wallet,
        paymentRail,
        senderId: selectedSender.id,
        senderAccountConfirmed: senderConfirmed,
      });
      setOperation(created);
      setStep(3);
      toast.success(`Operación ${created.reference} creada`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la operación.");
    } finally {
      setSubmitting(false);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !operation) return;
    try {
      await uploadProof(operation.id, file);
      toast.success("Comprobante enviado para revisión");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el comprobante.");
    }
  };

  if (loading) return <><Header title="Patzi Stable" subtitle="Verificando tu acceso" /><div className="grid flex-1 place-items-center bg-[#F5F7F2] p-5"><div className="pathline-surface rounded-[2rem] px-8 py-7 text-sm font-semibold text-[#071A2D]/55">Cargando tu espacio Stable…</div></div></>;

  if (!stableEligible || !kycVerified) return <><Header title="Patzi Stable" subtitle="Acceso controlado" /><div className="grid flex-1 place-items-center bg-[#F5F7F2] p-5"><div className="pathline-surface max-w-lg rounded-[2rem] p-8 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FF765B]/10 text-[#D95943]"><ShieldCheck className="h-8 w-8" /></div><h1 className="mt-5 text-2xl font-semibold">Tu acceso está en revisión</h1><p className="mt-3 text-sm leading-6 text-[#071A2D]/55">Solo clientes con KYC aprobado y acceso Stable habilitado pueden crear operaciones.</p><Button onClick={() => router.push("/dashboard/profile")} className="mt-6 bg-[#071A2D]">Revisar mi perfil</Button></div></div></>;

  if (!capacity.some((item) => item.available)) return <><Header title="Patzi Stable" subtitle="Disponibilidad temporal" /><div className="grid flex-1 place-items-center bg-[#F5F7F2] p-5"><div className="pathline-surface max-w-lg rounded-[2rem] p-8 text-center"><TimerReset className="mx-auto h-10 w-10 text-slate-500" /><h1 className="mt-5 text-2xl font-semibold">Disponibilidad USD temporalmente agotada</h1><p className="mt-3 text-sm leading-6 text-[#071A2D]/55">El cupo se renovará{nextReset ? ` el ${nextReset.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}` : " el domingo"}.</p></div></div></>;

  return (
    <>
      <Header title="Patzi Stable" subtitle="USD a USDT o USDC · Ethereum ERC-20" />
      <div className="pathline-grid flex-1 bg-[#F5F7F2] p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => step > 0 && !operation ? setStep(step - 1) : router.back()} className="mb-5 flex items-center gap-2 text-xs font-semibold text-[#071A2D]/55"><ArrowLeft className="h-4 w-4" />Volver</button>
          <div className="mb-8 grid grid-cols-4 gap-2">{steps.map((label, index) => <div key={label}><div className={`h-1.5 rounded-full transition-colors ${index <= step ? "bg-[#4DE2B5]" : "bg-[#071A2D]/10"}`} /><p className={`mt-2 text-[9px] font-semibold uppercase tracking-[.1em] sm:text-[10px] ${index === step ? "text-[#071A2D]" : "text-[#071A2D]/30"}`}>{label}</p></div>)}</div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="premium-card rounded-[2rem] p-5 sm:p-8"><div className="relative z-10">
              {step === 0 && <div>
                <div className="flex items-center gap-3"><div className="flex -space-x-2"><AssetMark asset="USDT" className="h-12 w-12 ring-4 ring-white"/><AssetMark asset="USDC" className="h-12 w-12 ring-4 ring-white"/></div><div><p className="premium-kicker text-[#087F62]">Cuenta habilitada</p><h1 className="mt-1 text-2xl font-semibold">¿Cuántos USD enviará tu cliente?</h1></div></div>
                <label className="mt-8 block text-xs font-semibold uppercase tracking-[.14em] text-[#071A2D]/40">Monto del depósito</label>
                <div className="mt-2 flex items-center rounded-2xl border-2 border-[#071A2D]/10 bg-white p-4 focus-within:border-[#4C7DFF]"><span className="text-3xl font-semibold">$</span><input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-3xl font-semibold outline-none" /><span className="flex items-center gap-2 text-xs font-semibold"><FlagMark country="US"/>USD</span></div>
                <p className="mt-3 text-xs text-[#071A2D]/45">Este importe reservará cupo durante 24 horas y será el volumen usado al cargar el comprobante.</p>
                <label className="mt-6 block text-xs font-semibold uppercase tracking-[.14em] text-[#071A2D]/40">Método de envío</label>
                <div className="mt-2 grid grid-cols-2 gap-3">{(["ACH", "WIRE"] as StablePaymentRail[]).map((rail) => { const supported = Boolean(capacity.find((item) => item.paymentRail === rail)?.available); return <button key={rail} type="button" disabled={!supported} onClick={() => setPaymentRail(rail)} className={`rounded-xl border-2 p-3 text-left disabled:opacity-35 ${paymentRail === rail ? "border-[#0AA883] bg-[#E7FAF3]" : "border-[#071A2D]/9 bg-white"}`}><b className="text-sm font-semibold">{rail === "ACH" ? "Transferencia ACH" : "Domestic Wire"}</b><p className="mt-1 text-[10px] text-[#071A2D]/42">Routing específico de la cuenta asignada.</p></button>; })}</div>
                <Button onClick={() => setStep(1)} disabled={parsedAmount <= 0 || !capacityAvailable} className="mt-8 h-12 w-full bg-[#071A2D] text-white">Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>}

              {step === 1 && <div>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="premium-kicker text-[#087F62]">Identidad del depósito</p><h1 className="mt-1 text-2xl font-semibold">¿Quién enviará los USD?</h1><p className="mt-2 text-sm text-[#071A2D]/50">Selecciona al titular real de la cuenta bancaria.</p></div><Button variant="outline" onClick={() => setShowNewSender((value) => !value)} className="h-10"><Plus className="mr-2 h-4 w-4" />{showNewSender ? "Ver guardados" : "Nuevo remitente"}</Button></div>
                {showNewSender || activeSenders.length === 0 ? <div className="mt-6 rounded-2xl border border-[#071A2D]/9 bg-[#F6F8F6] p-4 sm:p-5"><StableSenderForm onSubmit={async (input) => { const sender = await addSender(input); setSenderId(sender.id); setShowNewSender(false); toast.success("Remitente guardado"); }} /></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2">{activeSenders.map((sender) => { const Icon = sender.type === "business" ? Building2 : UserRound; return <button key={sender.id} onClick={() => setSenderId(sender.id)} className={`rounded-2xl border-2 p-4 text-left ${senderId === sender.id ? "border-[#0AA883] bg-[#E7FAF3] shadow-[0_16px_35px_rgba(10,168,131,.1)]" : "border-[#071A2D]/9 bg-white"}`}><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#071A2D] text-white"><Icon className="h-5 w-5" /></div>{senderId === sender.id && <CheckCircle2 className="h-5 w-5 text-[#087F62]" />}</div><p className="mt-3 font-semibold">{sender.legalName}</p><p className="mt-1 text-[10px] text-[#071A2D]/45">{sender.email} · {sender.phone}</p>{sender.bankName && <p className="mt-2 text-[10px] font-medium text-[#356DE5]">{sender.bankName}{sender.accountLast4 ? ` · •••• ${sender.accountLast4}` : ""}</p>}</button>; })}</div>}
                {!showNewSender && activeSenders.length > 0 && <Button onClick={() => setStep(2)} disabled={!selectedSender} className="mt-8 h-12 w-full bg-[#071A2D] text-white">Usar este remitente <ArrowRight className="ml-2 h-4 w-4" /></Button>}
              </div>}

              {step === 2 && selectedSender && <div>
                <div><p className="premium-kicker text-[#087F62]">Entrega Stable</p><h1 className="mt-1 text-2xl font-semibold">Selecciona activo y wallet</h1><p className="mt-2 text-sm text-[#071A2D]/50">El depósito quedará registrado a nombre de <b>{selectedSender.legalName}</b>.</p></div>
                <div className="mt-6 grid grid-cols-2 gap-3">{(["USDT", "USDC"] as StableAsset[]).map((item) => <button key={item} onClick={() => setAsset(item)} className={`rounded-2xl border-2 p-5 text-left ${asset === item ? "-translate-y-1 border-[#4DE2B5] bg-[#4DE2B5]/10 shadow-[0_15px_30px_rgba(7,26,45,.08)]" : "border-[#071A2D]/10 bg-white"}`}><div className="flex items-center justify-between"><AssetMark asset={item} className="h-11 w-11"/>{asset === item && <CheckCircle2 className="h-5 w-5 text-[#087F62]" />}</div><p className="mt-3 text-lg font-semibold">{item}</p><div className="mt-2"><AssetChip asset="ETH"/></div></button>)}</div>
                <label className="mt-7 block text-xs font-semibold uppercase tracking-[.14em] text-[#071A2D]/40">Wallet Ethereum ERC-20</label><input value={wallet} onChange={(event) => setWallet(event.target.value.trim())} placeholder="0x..." className="mt-2 h-13 w-full rounded-xl border-2 border-[#071A2D]/10 bg-white px-4 font-mono text-sm outline-none focus:border-[#4C7DFF]" />
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#0AA883]/20 bg-[#E7FAF3]/60 p-4"><input type="checkbox" checked={senderConfirmed} onChange={(event) => setSenderConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-[#0AA883]" /><span><b className="block text-sm font-semibold">Confirmo el titular de origen</b><small className="mt-1 block leading-5 text-[#071A2D]/52">Los USD serán enviados desde una cuenta cuyo titular es {selectedSender.legalName}. El comprobante debe mostrar el mismo nombre.</small></span></label>
                <div className="mt-4 flex gap-2 rounded-xl bg-[#FF765B]/10 p-3 text-xs leading-5 text-[#A13E2C]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Verifica la wallet y la red. Una entrega blockchain no puede revertirse.</div>
                <Button onClick={() => void createOperation()} disabled={!isEthAddress(wallet) || !senderConfirmed || submitting} className="mt-8 h-12 w-full bg-[#071A2D] text-white">{submitting ? "Creando operación…" : "Crear operación"}</Button>
              </div>}

              {step === 3 && operation && assignedAccount && <div>
                <div className="flex items-start justify-between gap-4"><div><p className="premium-kicker text-[#087F62]">Operación creada</p><h1 className="mt-1 text-3xl font-semibold">{operation.reference}</h1><p className="mt-2 text-sm text-[#071A2D]/48">Remitente: <b>{operation.senderLegalName}</b></p></div><span className="status-pill status-waiting">Esperando pago</span></div>
                <div className="mt-6 rounded-2xl border border-[#071A2D]/9 bg-[#F5F7F2] p-5"><div className="mb-4 flex items-center justify-between gap-2"><span className="flex items-center gap-2 font-semibold"><Landmark className="h-5 w-5" />Cuenta asignada · {operation.paymentRail}</span><span className="rounded-full bg-[#E7FAF3] px-2.5 py-1 text-[9px] font-semibold text-[#087F62]">CUPO RESERVADO 24H</span></div>{[["Banco", assignedAccount.bank], ["Beneficiario", assignedAccount.holder], ["Cuenta", assignedAccount.accountNumber], [`Routing ${operation.paymentRail}`, operation.paymentRail === "ACH" ? assignedAccount.achRoutingNumber : assignedAccount.wireRoutingNumber], ["Tipo", assignedAccount.accountType]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-t border-[#071A2D]/7 py-3 text-sm"><span className="text-[#071A2D]/45">{label}</span><b className="text-right">{value}</b></div>)}<button type="button" onClick={() => void copyAssignedAccount()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071A2D] px-4 py-3 text-sm font-semibold text-white"><Copy className="h-4 w-4" />Copiar datos bancarios completos</button></div>
                <div className="mt-5 rounded-xl border border-[#FF765B]/25 bg-[#FF765B]/10 p-4 text-xs leading-5 text-[#A13E2C]">Envía exactamente <b>{formatUsd(operation.usdAmount)}</b> desde la cuenta de <b>{operation.senderLegalName}</b>. Después sube el comprobante PDF.</div>
                <label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#071A2D]/12 p-7 text-center hover:border-[#4DE2B5]"><Upload className="h-7 w-7 text-[#087F62]" /><span className="mt-3 font-semibold">Subir comprobante PDF</span><span className="mt-1 text-xs text-[#071A2D]/40">PDF · máximo 5 MB</span><input type="file" accept="application/pdf" className="hidden" onChange={upload} /></label>
                <OperationDocuments operation={operation} className="mt-5" />
              </div>}
            </div></section>

            <aside className="space-y-4">
              <div className="rounded-[1.7rem] bg-[#071A2D] p-6 text-white shadow-[0_28px_60px_rgba(7,26,45,.24)]"><p className="text-[10px] uppercase tracking-[.16em] text-white/42">Resumen</p><div className="mt-5 flex justify-between"><span className="text-sm text-white/55">Depósito USD</span><b>{formatUsd(parsedAmount)}</b></div><div className="mt-3 flex justify-between"><span className="text-sm text-white/55">Comisión 10%</span><b className="text-[#FF765B]">− {formatUsd(fee)}</b></div><div className="my-4 h-px bg-white/10" /><div className="flex items-end justify-between"><div><span className="text-sm text-white/55">Recibirás</span><p className="mt-1 text-3xl font-semibold text-[#4DE2B5]">{receive.toLocaleString()} <small className="text-sm">{asset}</small></p></div><AssetMark asset={asset} className="h-10 w-10" /></div></div>
              {selectedSender && <div className="premium-card rounded-[1.5rem] p-5"><div className="relative z-10"><p className="premium-kicker text-[#087F62]">Remitente seleccionado</p><p className="mt-2 font-semibold">{selectedSender.legalName}</p><p className="mt-1 text-xs text-[#071A2D]/45">{selectedSender.email}</p><p className="mt-1 text-xs text-[#071A2D]/45">{selectedSender.phone}</p></div></div>}
              <div className="rounded-[1.5rem] border border-[#071A2D]/9 bg-white/80 p-5"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-[#087F62]" /><div><p className="text-sm font-semibold">Registro por operación</p><p className="mt-1 text-xs leading-5 text-[#071A2D]/48">Patzi conservará la identidad usada en este depósito para conciliación, factura y contrato.</p></div></div></div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
