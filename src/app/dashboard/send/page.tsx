"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, ArrowRight, Building2,
  Smartphone, User, ChevronRight, AlertCircle,
} from "lucide-react";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { useRatesStore, calcTransferLive } from "@/lib/rates-store";
import { MOCK_WALLETS, MOCK_BENEFICIARIES } from "@/lib/mock-data";
import { useTransferStore } from "@/lib/transfer-store";
import type { Currency, DeliveryMethod } from "@/types";
import { toast } from "sonner";

const STEPS = ["Origen", "Destino", "Beneficiario", "Confirmar"];

interface DeliveryOption {
  value: DeliveryMethod;
  appName: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  phoneLabel: string | null;
}

const DELIVERY_BY_CURRENCY: Record<Currency, DeliveryOption[]> = {
  EUR: [
    { value: "bank", appName: "Transferencia bancaria", label: "Transferencia bancaria", icon: Building2, desc: "Ingreso directo a cuenta IBAN en España", phoneLabel: null },
    { value: "mobile_money", appName: "Bizum", label: "Bizum", icon: Smartphone, desc: "Pago instantáneo al número de teléfono registrado", phoneLabel: "Teléfono Bizum" },
  ],
  USD: [
    { value: "bank", appName: "Transferencia bancaria", label: "Transferencia bancaria", icon: Building2, desc: "Depósito ACH/SWIFT a cuenta bancaria en EE.UU.", phoneLabel: null },
    { value: "mobile_money", appName: "Zelle", label: "Zelle", icon: Smartphone, desc: "Transferencia instantánea por teléfono o correo electrónico", phoneLabel: "Teléfono o email Zelle" },
  ],
  PEN: [
    { value: "bank", appName: "Transferencia bancaria", label: "Transferencia bancaria", icon: Building2, desc: "Depósito a cuenta bancaria en soles peruanos", phoneLabel: null },
    { value: "mobile_money", appName: "Yape", label: "Yape", icon: Smartphone, desc: "Pago inmediato al número de celular registrado en Yape", phoneLabel: "Número de celular Yape" },
    { value: "mobile_money", appName: "Plin", label: "Plin", icon: Smartphone, desc: "Transferencia móvil instantánea vía Plin", phoneLabel: "Número de celular Plin" },
  ],
  VES: [
    { value: "bank", appName: "Transferencia bancaria", label: "Transferencia bancaria", icon: Building2, desc: "Depósito a cuenta bancaria en bolívares digitales", phoneLabel: null },
    { value: "mobile_money", appName: "Pagomóvil", label: "Pagomóvil", icon: Smartphone, desc: "Pago interbancario instantáneo por número de teléfono", phoneLabel: "Teléfono Pagomóvil" },
  ],
};

export default function SendPage() {
  const [step, setStep] = useState(0);
  const [sendCurrency, setSendCurrency] = useState<Currency>("EUR");
  const [receiveCurrency, setReceiveCurrency] = useState<Currency>("PEN");
  const [sendAmount, setSendAmount] = useState("200");
  const { markups, liveRates, setLiveRates } = useRatesStore();
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>(DELIVERY_BY_CURRENCY["PEN"][0]);
  const [useExisting, setUseExisting] = useState(true);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(MOCK_BENEFICIARIES[0]?.id ?? "");
  const [newBenef, setNewBenef] = useState({ name: "", account: "", bank: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const addTransfer = useTransferStore((s) => s.addTransfer);

  useEffect(() => {
    if (Object.keys(liveRates).length === 0) {
      fetch("/api/rates")
        .then((r) => r.json())
        .then((d) => setLiveRates(d.rates, d.updated_at, d.source))
        .catch(() => {});
    }
  }, [liveRates, setLiveRates]);
  const doneRef = React.useRef(`PTZ-2026-${Math.floor(Math.random() * 9000 + 1000)}`);

  const [result, setResult] = useState<{
    receiveAmount: number; exchangeRate: number; fee: number; totalCharged: number;
  } | null>(null);

  useEffect(() => {
    const amt = parseFloat(sendAmount);
    if (!isNaN(amt) && amt > 0 && sendCurrency !== receiveCurrency) {
      const pair = `${sendCurrency}-${receiveCurrency}`;
      setResult(calcTransferLive(pair, amt, liveRates, markups));
    } else setResult(null);
  }, [sendAmount, sendCurrency, receiveCurrency, liveRates, markups]);

  const wallets = MOCK_WALLETS;
  const currentWallet = wallets.find((w) => w.currency === (sendCurrency as "EUR" | "USD"));
  const beneficiaryObj = MOCK_BENEFICIARIES.find((b) => b.id === selectedBeneficiary);
  const fromInfo = CURRENCY_INFO[sendCurrency];
  const toInfo = CURRENCY_INFO[receiveCurrency];

  const canProceedStep0 = result && parseFloat(sendAmount) > 0;
  const deliveryMethod = deliveryOption.value;
  const canProceedStep1 = receiveCurrency && deliveryOption;
  const canProceedStep2 = useExisting ? !!selectedBeneficiary : !!newBenef.name;

  const handleConfirm = async () => {
    if (!result) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1800));
    const benef = beneficiaryObj || { full_name: newBenef.name, country: "", currency: receiveCurrency, delivery_method: deliveryOption.value };
    addTransfer({
      id: `t${Date.now()}`,
      user_id: "u1",
      reference: doneRef.current,
      beneficiary_name: benef.full_name,
      beneficiary_country: CURRENCY_INFO[receiveCurrency].country,
      send_currency: sendCurrency,
      receive_currency: receiveCurrency,
      send_amount: parseFloat(sendAmount),
      receive_amount: result.receiveAmount,
      exchange_rate: result.exchangeRate,
      fee: 0,
      total_charged: result.totalCharged,
      delivery_method: deliveryOption.value,
      delivery_app: deliveryOption.appName,
      speed: "express",
      status: "pending",
      status_history: [{ status: "pending", timestamp: new Date().toISOString() }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setSending(false);
    setDone(true);
    toast.success("¡Transferencia iniciada con éxito!");
  };

  if (done) {
    return (
      <>
        <Header title="Enviar dinero" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Solicitud enviada!</h2>
            <p className="text-slate-500 mb-2">
              Tu transferencia de{" "}
              <strong>{fromInfo.symbol}{parseFloat(sendAmount).toFixed(2)} {sendCurrency}</strong>{" "}
              a <strong>{beneficiaryObj?.full_name || newBenef.name}</strong> está siendo revisada.
            </p>
            <p className="text-slate-500 mb-4">
              El receptor recibirá{" "}
              <strong>{toInfo.symbol}{result?.receiveAmount.toFixed(2)} {receiveCurrency}</strong>{" "}
              una vez aprobada.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-amber-800 mb-2">Próximos pasos</p>
              <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
                <li>Nuestro equipo revisa y valida tu solicitud</li>
                <li>El pago se procesa al beneficiario</li>
                <li>Recibes notificación con el comprobante de pago</li>
              </ol>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-sm px-4 py-1.5 mb-8">
              Referencia: {doneRef.current}
            </Badge>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => { setStep(0); setDone(false); }}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
              >
                Nuevo envío
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/dashboard/history"}>
                Ver estado en historial
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Enviar dinero" subtitle="Completa los pasos para enviar tu transferencia" />
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 mb-5 sm:mb-8 overflow-x-auto pb-1 scrollbar-hide">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    i === step
                      ? "bg-blue-900 text-white"
                      : i < step
                      ? "bg-emerald-100 text-emerald-700 cursor-pointer"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i < step ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-xs">{i + 1}</span>
                  )}
                  {s}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </div>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              {step === 0 && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-lg">¿Cuánto quieres enviar?</h3>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Divisa de envío</Label>
                    <div className="flex gap-2">
                      {(["EUR", "USD"] as Currency[]).map((c) => {
                        const wallet = wallets.find((w) => w.currency === c);
                        return (
                          <button
                            key={c}
                            onClick={() => { setSendCurrency(c); if (c === receiveCurrency) setReceiveCurrency("PEN"); }}
                            className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                              sendCurrency === c ? "border-blue-900 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{CURRENCY_INFO[c].flag}</span>
                              <span className="font-bold text-slate-800">{c}</span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Saldo: {CURRENCY_INFO[c].symbol}{wallet?.balance.toFixed(2) ?? "0.00"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="amount">Monto a enviar</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                        {fromInfo.symbol}
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        className="pl-7 h-12 text-lg font-semibold"
                        min="1"
                        step="0.01"
                      />
                    </div>
                    {currentWallet && parseFloat(sendAmount) > currentWallet.balance && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Saldo insuficiente
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Pago mismo día</p>
                      <p className="text-xs text-slate-500">Tu transferencia llega el mismo día hábil</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setStep(1)}
                    disabled={!canProceedStep0}
                    className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-semibold"
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-lg">¿A dónde envías?</h3>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Divisa de destino</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["PEN", "VES", "USD", "EUR"] as Currency[])
                        .filter((c) => c !== sendCurrency)
                        .map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setReceiveCurrency(c);
                              setDeliveryOption(DELIVERY_BY_CURRENCY[c][0]);
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              receiveCurrency === c ? "border-blue-900 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <span className="text-lg mr-2">{CURRENCY_INFO[c].flag}</span>
                            <span className="font-bold text-slate-800">{c}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{CURRENCY_INFO[c].country}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Método de entrega</Label>
                    <div className="space-y-2">
                      {DELIVERY_BY_CURRENCY[receiveCurrency].map((opt) => (
                        <button
                          key={opt.appName}
                          onClick={() => setDeliveryOption(opt)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            deliveryOption.appName === opt.appName ? "border-blue-900 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            opt.value === "bank" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            <opt.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-sm">{opt.appName}</p>
                            <p className="text-xs text-slate-500">{opt.desc}</p>
                          </div>
                          {deliveryOption.appName === opt.appName && (
                            <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  {result && (
                    <div className="bg-blue-50 rounded-xl p-4 space-y-1.5 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>El receptor recibe</span>
                        <span className="font-bold text-blue-900 text-base">
                          {toInfo.symbol}{result.receiveAmount.toFixed(2)} {receiveCurrency}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Tasa</span>
                        <span>1 {sendCurrency} = {result.exchangeRate.toFixed(4)} {receiveCurrency}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Comisión</span>
                        <span className="font-bold text-emerald-600">Gratis ✓</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Atrás</Button>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!canProceedStep1}
                      className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold"
                    >
                      Continuar <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-lg">¿Quién recibe?</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUseExisting(true)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${useExisting ? "border-blue-900 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-500"}`}
                    >
                      Beneficiario guardado
                    </button>
                    <button
                      onClick={() => setUseExisting(false)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${!useExisting ? "border-blue-900 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-500"}`}
                    >
                      Nuevo beneficiario
                    </button>
                  </div>

                  {useExisting ? (
                    <div className="space-y-2">
                      {MOCK_BENEFICIARIES.filter((b) => b.currency === receiveCurrency).length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                          <User className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-sm font-medium text-slate-500">Sin beneficiarios en {receiveCurrency}</p>
                          <p className="text-xs text-slate-400 mt-1">Añade un nuevo beneficiario para esta divisa</p>
                          <button onClick={() => setUseExisting(false)} className="mt-3 text-xs text-blue-600 font-medium hover:text-blue-800">
                            + Nuevo beneficiario
                          </button>
                        </div>
                      ) : null}
                      {MOCK_BENEFICIARIES.filter((b) => b.currency === receiveCurrency).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBeneficiary(b.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            selectedBeneficiary === b.id ? "border-blue-900 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{b.full_name}</p>
                            <p className="text-xs text-slate-500">
                              {CURRENCY_INFO[b.currency].flag} {b.currency} · {b.bank_name || b.phone}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label>Nombre completo</Label>
                        <Input
                          value={newBenef.name}
                          onChange={(e) => setNewBenef({ ...newBenef, name: e.target.value })}
                          placeholder="Nombre del receptor"
                          className="mt-1.5"
                        />
                      </div>
                      {deliveryMethod === "bank" && (
                        <>
                          <div>
                            <Label>Banco</Label>
                            <Input
                              value={newBenef.bank}
                              onChange={(e) => setNewBenef({ ...newBenef, bank: e.target.value })}
                              placeholder="Nombre del banco"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label>Número de cuenta</Label>
                            <Input
                              value={newBenef.account}
                              onChange={(e) => setNewBenef({ ...newBenef, account: e.target.value })}
                              placeholder="Número de cuenta bancaria"
                              className="mt-1.5"
                            />
                          </div>
                        </>
                      )}
                      {deliveryMethod === "mobile_money" && deliveryOption.phoneLabel && (
                        <div>
                          <Label>{deliveryOption.phoneLabel}</Label>
                          <Input
                            value={newBenef.phone}
                            onChange={(e) => setNewBenef({ ...newBenef, phone: e.target.value })}
                            placeholder={receiveCurrency === "USD" ? "+1 305 000 0000 o email" : receiveCurrency === "PEN" ? "+51 987 000 000" : receiveCurrency === "VES" ? "+58 414 000 0000" : "+34 612 000 000"}
                            className="mt-1.5"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                      className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold"
                    >
                      Continuar <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && result && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-lg">Confirmar transferencia</h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                      <span className="text-3xl">{fromInfo.flag}</span>
                      <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-slate-800">
                          {fromInfo.symbol}{parseFloat(sendAmount).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">{sendCurrency}</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-slate-400" />
                      <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-blue-900">
                          {toInfo.symbol}{result.receiveAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">{receiveCurrency}</p>
                      </div>
                      <span className="text-3xl">{toInfo.flag}</span>
                    </div>
                    {[
                      ["Beneficiario", beneficiaryObj?.full_name || newBenef.name],
                      ["Método de entrega", deliveryOption.appName],
                      ["Entrega estimada", "Mismo día hábil"],
                      ["Tasa de cambio", `1 ${sendCurrency} = ${result.exchangeRate.toFixed(4)} ${receiveCurrency}`],
                      ["Total a enviar", `${fromInfo.symbol}${result.totalCharged.toFixed(2)}`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-800">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200 mt-1">
                      <span className="text-slate-500">Comisión</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Gratis
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Al confirmar, aceptas nuestros términos de servicio. La tasa está garantizada por 30 minutos.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Atrás</Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={sending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {sending ? "Procesando..." : "Confirmar y enviar"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
