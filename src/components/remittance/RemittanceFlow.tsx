"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Clock3, Loader2, Save, Smartphone, UserRound } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { calcTransferLive, useRatesStore } from "@/lib/rates-store";
import { createClient } from "@/lib/supabase";
import { useTransferStore } from "@/lib/transfer-store";
import type { Beneficiary, Currency, DeliveryMethod } from "@/types";

type Draft = {
  step: number; sendCurrency: "EUR" | "USD"; receiveCurrency: Currency; amount: string;
  beneficiaryId: string; mode: "existing" | "new"; updatedAt: string;
};

const METHODS: Record<Currency, { method: DeliveryMethod; app: string; label: string; hint: string }[]> = {
  EUR: [
    { method: "bank", app: "Transferencia bancaria", label: "Transferencia bancaria", hint: "Cuenta IBAN en Europa" },
    { method: "mobile_money", app: "Bizum", label: "Bizum", hint: "Teléfono asociado a Bizum" },
  ],
  USD: [
    { method: "bank", app: "Transferencia bancaria", label: "Transferencia bancaria", hint: "Cuenta bancaria en Estados Unidos" },
    { method: "mobile_money", app: "Zelle", label: "Zelle", hint: "Teléfono o correo asociado a Zelle" },
  ],
  PEN: [
    { method: "bank", app: "Transferencia bancaria", label: "Transferencia bancaria", hint: "Cuenta bancaria en soles" },
    { method: "mobile_money", app: "Yape", label: "Yape", hint: "Celular asociado a Yape" },
    { method: "mobile_money", app: "Plin", label: "Plin", hint: "Celular asociado a Plin" },
  ],
  VES: [
    { method: "bank", app: "Transferencia bancaria", label: "Transferencia bancaria", hint: "Cuenta bancaria en bolívares" },
    { method: "mobile_money", app: "Pago móvil", label: "Pago móvil", hint: "Teléfono, banco y cédula" },
  ],
};

const emptyNew = { full_name: "", bank_name: "", account_number: "", phone: "", email: "", cedula: "" };

function beneficiaryDetail(item: Beneficiary) {
  if (item.delivery_method === "bank") return [item.bank_name, item.account_number].filter(Boolean).join(" · ");
  return item.delivery_app === "Zelle" ? (item.email || item.phone || "Sin dato de pago") : (item.phone || "Sin teléfono");
}

export default function RemittanceFlow() {
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState("");
  const [sendCurrency, setSendCurrency] = useState<"EUR" | "USD">("EUR");
  const [receiveCurrency, setReceiveCurrency] = useState<Currency>("PEN");
  const [amount, setAmount] = useState("200");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [methodIndex, setMethodIndex] = useState(0);
  const [newBeneficiary, setNewBeneficiary] = useState(emptyNew);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createdReference, setCreatedReference] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const addTransfer = useTransferStore((state) => state.addTransfer);
  const { liveRates, markups, fees, activePairs, setLiveRates, setMarkups, setPricing } = useRatesStore();

  const availableBeneficiaries = beneficiaries.filter((item) => item.currency === receiveCurrency);
  const selected = availableBeneficiaries.find((item) => item.id === beneficiaryId);
  const method = METHODS[receiveCurrency][methodIndex] ?? METHODS[receiveCurrency][0];
  const pair = `${sendCurrency}-${receiveCurrency}`;
  const calculation = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0 && activePairs.includes(pair)
      ? calcTransferLive(pair, value, liveRates, markups, fees)
      : null;
  }, [activePairs, amount, fees, liveRates, markups, pair]);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const [beneficiaryResult, rateResponse] = await Promise.all([
      supabase.from("beneficiaries").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      fetch("/api/rates", { cache: "no-store" }),
    ]);
    if (beneficiaryResult.error) toast.error("No pudimos cargar tus beneficiarios.");
    else setBeneficiaries((beneficiaryResult.data ?? []) as Beneficiary[]);
    if (rateResponse.ok) {
      const data = await rateResponse.json();
      setLiveRates(data.rates ?? {}, data.updated_at, data.source);
      setMarkups(data.markups ?? {});
      setPricing(data.fees ?? {}, data.activePairs ?? []);
    } else toast.error("No pudimos actualizar las tasas.");
    setLoading(false);
  }, [setLiveRates, setMarkups, setPricing]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = sessionStorage.getItem(`patzi-remittance-draft:${userId}`);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      setStep(Math.min(2, Math.max(0, draft.step || 0)));
      setSendCurrency(draft.sendCurrency || "EUR");
      setReceiveCurrency(draft.receiveCurrency || "PEN");
      setAmount(draft.amount || "200");
      setBeneficiaryId(draft.beneficiaryId || "");
      setMode(draft.mode || "existing");
      toast.info("Recuperamos el envío que estabas preparando.");
    } catch { sessionStorage.removeItem(`patzi-remittance-draft:${userId}`); }
  }, [userId]);

  useEffect(() => {
    if (!userId || createdReference) return;
    const timer = window.setTimeout(() => {
      const draft: Draft = { step, sendCurrency, receiveCurrency, amount, beneficiaryId, mode, updatedAt: new Date().toISOString() };
      sessionStorage.setItem(`patzi-remittance-draft:${userId}`, JSON.stringify(draft));
      setDraftSaved(true);
      window.setTimeout(() => setDraftSaved(false), 1200);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [amount, beneficiaryId, createdReference, mode, receiveCurrency, sendCurrency, step, userId]);

  useEffect(() => {
    if (!availableBeneficiaries.some((item) => item.id === beneficiaryId)) {
      setBeneficiaryId(availableBeneficiaries[0]?.id ?? "");
    }
  }, [availableBeneficiaries, beneficiaryId]);

  const validateNew = () => {
    if (!newBeneficiary.full_name.trim()) return "Escribe el nombre completo del beneficiario.";
    if (method.method === "bank" && (!newBeneficiary.bank_name.trim() || !newBeneficiary.account_number.trim())) return "Completa el banco y número de cuenta.";
    if (method.app === "Pago móvil" && (!newBeneficiary.phone.trim() || !newBeneficiary.bank_name.trim() || !newBeneficiary.cedula.trim())) return "Pago móvil requiere teléfono, banco y cédula.";
    if (["Yape", "Plin", "Bizum"].includes(method.app) && !newBeneficiary.phone.trim()) return `${method.app} requiere un teléfono.`;
    if (method.app === "Zelle" && !newBeneficiary.phone.trim() && !newBeneficiary.email.trim()) return "Zelle requiere teléfono o correo.";
    return "";
  };

  const saveNewBeneficiary = async () => {
    const errorMessage = validateNew();
    if (errorMessage) { toast.error(errorMessage); return null; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("beneficiaries").insert({
      user_id: userId, full_name: newBeneficiary.full_name.trim(), country: CURRENCY_INFO[receiveCurrency].country,
      currency: receiveCurrency, delivery_method: method.method, delivery_app: method.app,
      bank_name: newBeneficiary.bank_name.trim() || null, account_number: newBeneficiary.account_number.trim() || null,
      phone: newBeneficiary.phone.trim() || null, email: newBeneficiary.email.trim() || null,
      cedula: newBeneficiary.cedula.trim() || null, is_active: true,
    }).select("*").single();
    setSaving(false);
    if (error || !data) { toast.error(error?.message || "No se pudo guardar el beneficiario."); return null; }
    const item = data as Beneficiary;
    setBeneficiaries((current) => [item, ...current]);
    setBeneficiaryId(item.id);
    setMode("existing");
    setNewBeneficiary(emptyNew);
    toast.success("Beneficiario guardado.");
    return item;
  };

  const goToConfirmation = async () => {
    if (mode === "new") {
      const item = await saveNewBeneficiary();
      if (!item) return;
    } else if (!selected) { toast.error("Selecciona un beneficiario."); return; }
    setStep(2);
  };

  const confirm = async () => {
    if (!selected || !calculation) return;
    setSaving(true);
    try {
      const transfer = await addTransfer({ beneficiaryId: selected.id, sendCurrency, sendAmount: Number(amount), quotedExchangeRate: calculation.exchangeRate });
      sessionStorage.removeItem(`patzi-remittance-draft:${userId}`);
      setCreatedReference(transfer.reference);
      toast.success("Remesa registrada correctamente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la remesa.");
      await loadData();
      setStep(0);
    } finally { setSaving(false); }
  };

  if (loading) return <><Header title="Enviar dinero" /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#087F62]" /></div></>;

  if (createdReference) return (
    <><Header title="Enviar dinero" /><main className="flex flex-1 items-center justify-center p-5"><section className="w-full max-w-lg rounded-[2rem] border border-[#071A2D]/8 bg-white p-8 text-center shadow-[0_28px_70px_rgba(7,26,45,.12)]">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#E7FAF3] text-[#087F62]"><CheckCircle2 className="h-8 w-8" /></div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[.22em] text-[#087F62]">Solicitud registrada</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-[#071A2D]">Tu remesa está en revisión</h1>
      <p className="mt-3 text-sm text-[#071A2D]/55">Conserva esta referencia: <strong className="text-[#071A2D]">{createdReference}</strong>. Verás cada cambio de estado en tu historial.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2"><Button variant="outline" onClick={() => location.assign("/dashboard/history")}>Ver historial</Button><Button onClick={() => location.reload()} className="bg-[#071A2D] text-white">Crear otro envío</Button></div>
    </section></main></>
  );

  return <><Header title="Enviar dinero" subtitle="Tu envío se guarda mientras lo completas" /><main className="flex-1 p-4 sm:p-7">
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between"><div className="flex gap-2">{["Monto", "Beneficiario", "Confirmar"].map((label, index) => <span key={label} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${step === index ? "bg-[#071A2D] text-white" : index < step ? "bg-[#E7FAF3] text-[#087F62]" : "bg-white text-[#071A2D]/40"}`}>{index + 1}. {label}</span>)}</div><span className={`hidden items-center gap-1.5 text-[10px] text-[#087F62] sm:flex ${draftSaved ? "opacity-100" : "opacity-45"}`}><Save className="h-3 w-3" /> Guardado automático</span></div>
      <section className="overflow-hidden rounded-[2rem] border border-[#071A2D]/8 bg-white shadow-[0_24px_60px_rgba(7,26,45,.09)]">
        {step === 0 && <div className="grid gap-7 p-6 md:grid-cols-[1.15fr_.85fr] md:p-9"><div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#087F62]">Origen y destino</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">¿Cuánto quieres enviar?</h2>
          <Label className="mt-7 block">Divisa de origen</Label><div className="mt-2 grid grid-cols-2 gap-2">{(["EUR", "USD"] as const).map((currency) => <button key={currency} onClick={() => { setSendCurrency(currency); if (currency === receiveCurrency) setReceiveCurrency(currency === "EUR" ? "PEN" : "VES"); }} className={`rounded-2xl border p-4 text-left ${sendCurrency === currency ? "border-[#087F62] bg-[#F0FBF7]" : "border-[#071A2D]/10"}`}><span className="text-xl">{CURRENCY_INFO[currency].flag}</span><strong className="ml-2">{currency}</strong></button>)}</div>
          <Label className="mt-5 block" htmlFor="remittance-amount">Monto</Label><div className="relative mt-2"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold">{CURRENCY_INFO[sendCurrency].symbol}</span><Input id="remittance-amount" type="number" min="1" max="100000" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-16 rounded-2xl pl-10 text-2xl font-semibold" /></div>
          <Label className="mt-5 block">Divisa que reciben</Label><div className="mt-2 grid grid-cols-2 gap-2">{(["PEN", "VES", "USD", "EUR"] as Currency[]).filter((currency) => currency !== sendCurrency).map((currency) => <button key={currency} onClick={() => { setReceiveCurrency(currency); setMethodIndex(0); }} className={`rounded-2xl border p-3 text-left ${receiveCurrency === currency ? "border-[#FF765D] bg-[#FFF5F2]" : "border-[#071A2D]/10"}`}><span>{CURRENCY_INFO[currency].flag}</span><strong className="ml-2 text-sm">{currency}</strong></button>)}</div>
        </div><aside className="rounded-[1.6rem] bg-[#071A2D] p-6 text-white"><p className="text-[10px] uppercase tracking-[.18em] text-white/45">Estimación en vivo</p>{calculation ? <><p className="mt-5 text-sm text-white/50">El beneficiario recibe</p><p className="mt-1 text-4xl font-semibold tracking-[-.04em] text-[#4DE2B5]">{CURRENCY_INFO[receiveCurrency].symbol}{calculation.receiveAmount.toLocaleString("es-ES", { maximumFractionDigits: 2 })}</p><div className="mt-8 space-y-3 border-t border-white/10 pt-5 text-xs"><div className="flex justify-between"><span className="text-white/45">Tasa</span><b>1 {sendCurrency} = {calculation.exchangeRate.toFixed(4)} {receiveCurrency}</b></div><div className="flex justify-between"><span className="text-white/45">Comisión</span><b>{CURRENCY_INFO[sendCurrency].symbol}{calculation.fee.toFixed(2)}</b></div><div className="flex justify-between"><span className="text-white/45">Entrega</span><b>Mismo día hábil</b></div></div></> : <p className="mt-5 text-sm text-white/55">Este corredor no está disponible o el monto no es válido.</p>}<Button onClick={() => setStep(1)} disabled={!calculation} className="mt-8 w-full bg-[#4DE2B5] text-[#071A2D] hover:bg-[#3bd5a8]">Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button></aside></div>}

        {step === 1 && <div className="p-6 md:p-9"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#087F62]">Datos de entrega</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">¿Quién recibirá el dinero?</h2>
          <div className="mt-6 flex gap-2"><button onClick={() => setMode("existing")} className={`rounded-xl px-4 py-2 text-xs font-semibold ${mode === "existing" ? "bg-[#071A2D] text-white" : "bg-[#F4F7F5]"}`}>Beneficiario guardado</button><button onClick={() => setMode("new")} className={`rounded-xl px-4 py-2 text-xs font-semibold ${mode === "new" ? "bg-[#071A2D] text-white" : "bg-[#F4F7F5]"}`}>Nuevo beneficiario</button></div>
          {mode === "existing" ? <div className="mt-5 grid gap-3 md:grid-cols-2">{availableBeneficiaries.length ? availableBeneficiaries.map((item) => <button key={item.id} onClick={() => setBeneficiaryId(item.id)} className={`rounded-2xl border p-4 text-left ${beneficiaryId === item.id ? "border-[#087F62] bg-[#F0FBF7]" : "border-[#071A2D]/10"}`}><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white"><UserRound className="h-4 w-4" /></span><div><strong className="text-sm">{item.full_name}</strong><p className="mt-1 text-xs text-[#071A2D]/50">{item.delivery_app || "Transferencia bancaria"} · {beneficiaryDetail(item)}</p></div></div></button>) : <div className="col-span-2 rounded-2xl border border-dashed p-7 text-center text-sm text-[#071A2D]/50">No tienes beneficiarios para {receiveCurrency}. Crea uno nuevo.</div>}</div> : <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Label>Método de entrega</Label><div className="mt-2 grid gap-2 sm:grid-cols-3">{METHODS[receiveCurrency].map((item, index) => <button key={item.app} onClick={() => setMethodIndex(index)} className={`rounded-2xl border p-4 text-left ${methodIndex === index ? "border-[#087F62] bg-[#F0FBF7]" : "border-[#071A2D]/10"}`}>{item.method === "bank" ? <Building2 className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}<strong className="mt-3 block text-sm">{item.label}</strong><span className="text-[10px] text-[#071A2D]/45">{item.hint}</span></button>)}</div></div>
            <div className="md:col-span-2"><Label>Nombre completo</Label><Input value={newBeneficiary.full_name} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, full_name: e.target.value })} className="mt-2" /></div>
            {(method.method === "bank" || method.app === "Pago móvil") && <><div><Label>Banco</Label><Input value={newBeneficiary.bank_name} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, bank_name: e.target.value })} className="mt-2" /></div>{method.method === "bank" && <div><Label>Número de cuenta / IBAN</Label><Input value={newBeneficiary.account_number} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, account_number: e.target.value })} className="mt-2" /></div>}</>}
            {method.method === "mobile_money" && <div><Label>Teléfono</Label><Input value={newBeneficiary.phone} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, phone: e.target.value })} className="mt-2" /></div>}
            {method.app === "Zelle" && <div><Label>Correo Zelle</Label><Input type="email" value={newBeneficiary.email} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, email: e.target.value })} className="mt-2" /></div>}
            {method.app === "Pago móvil" && <div><Label>Cédula</Label><Input value={newBeneficiary.cedula} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, cedula: e.target.value })} className="mt-2" /></div>}
          </div>}
          <div className="mt-7 flex gap-3"><Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="mr-2 h-4 w-4" /> Atrás</Button><Button onClick={() => void goToConfirmation()} disabled={saving || (mode === "existing" && !selected)} className="ml-auto bg-[#071A2D] text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
        </div>}

        {step === 2 && selected && calculation && <div className="grid gap-7 p-6 md:grid-cols-[1fr_.82fr] md:p-9"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#087F62]">Revisión final</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Confirma los datos</h2><div className="mt-6 space-y-3 rounded-2xl bg-[#F5F8F5] p-5 text-sm">{[["Beneficiario", selected.full_name], ["Entrega", selected.delivery_app || "Transferencia bancaria"], ["Datos de pago", beneficiaryDetail(selected)], ["Tasa", `1 ${sendCurrency} = ${calculation.exchangeRate.toFixed(4)} ${receiveCurrency}`], ["Comisión", `${CURRENCY_INFO[sendCurrency].symbol}${calculation.fee.toFixed(2)} ${sendCurrency}`]].map(([label, value]) => <div key={label} className="flex justify-between gap-5 border-b border-[#071A2D]/7 pb-3 last:border-0 last:pb-0"><span className="text-[#071A2D]/45">{label}</span><strong className="text-right">{value}</strong></div>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-[#071A2D]/50"><Clock3 className="h-4 w-4 text-[#087F62]" /> La operación queda pendiente de revisión administrativa.</p></div><aside className="rounded-[1.6rem] bg-[#071A2D] p-6 text-white"><p className="text-xs text-white/45">Tú envías</p><p className="mt-1 text-3xl font-semibold">{CURRENCY_INFO[sendCurrency].symbol}{Number(amount).toFixed(2)} {sendCurrency}</p><div className="my-5 h-px bg-white/10" /><p className="text-xs text-white/45">Recibe</p><p className="mt-1 text-3xl font-semibold text-[#4DE2B5]">{CURRENCY_INFO[receiveCurrency].symbol}{calculation.receiveAmount.toFixed(2)} {receiveCurrency}</p><Button onClick={() => void confirm()} disabled={saving} className="mt-8 w-full bg-[#4DE2B5] text-[#071A2D] hover:bg-[#3bd5a8]">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Confirmar envío</Button><Button variant="ghost" onClick={() => setStep(1)} disabled={saving} className="mt-2 w-full text-white hover:bg-white/10 hover:text-white">Revisar beneficiario</Button></aside></div>}
      </section>
    </div>
  </main></>;
}
