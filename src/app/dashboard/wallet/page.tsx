"use client";

import { useState, useRef } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet,
  Building2, CheckCircle2, Smartphone, Clock, Upload, FileImage, X,
} from "lucide-react";
import { MOCK_WALLETS, MOCK_WALLET_TRANSACTIONS } from "@/lib/mock-data";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { useDepositStore } from "@/lib/deposit-store";
import { useUserStore } from "@/lib/user-store";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { WalletCurrency } from "@/types";

const TX_TYPE_CONFIG = {
  deposit: { label: "Recarga", icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50", sign: "+" },
  withdrawal: { label: "Retiro", icon: ArrowUpRight, color: "text-red-600", bg: "bg-red-50", sign: "-" },
  transfer_out: { label: "Envío", icon: ArrowUpRight, color: "text-orange-600", bg: "bg-orange-50", sign: "-" },
  transfer_in: { label: "Recibido", icon: ArrowDownLeft, color: "text-blue-600", bg: "bg-blue-50", sign: "+" },
};

const PENDING_DEPOSITS_KEY = "patzi-pending-deposit-ids";

export default function WalletPage() {
  const wallets = MOCK_WALLETS;
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositCurrency, setDepositCurrency] = useState<WalletCurrency>("EUR");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<"bank" | "mobile">("bank");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofDataUrl, setProofDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addRequest = useDepositStore((s) => s.addRequest);
  const allRequests = useDepositStore((s) => s.requests);
  const { full_name, email } = useUserStore();

  const transactions = MOCK_WALLET_TRANSACTIONS;

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("El archivo supera los 10 MB"); return; }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofDataUrl(ev.target?.result as string ?? "");
    reader.readAsDataURL(file);
  };

  const clearProof = () => {
    setProofFile(null);
    setProofDataUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Ingresa un monto válido"); return; }
    if (!proofFile || !proofDataUrl) { toast.error("Adjunta el comprobante de pago"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const methodLabel = depositMethod === "bank"
      ? (depositCurrency === "EUR" ? "Transferencia SEPA" : "Transferencia ACH")
      : (depositCurrency === "EUR" ? "Bizum" : "Zelle");
    addRequest({
      id: `dep${Date.now()}`,
      user_id: email || "unknown",
      user_name: full_name || "Usuario",
      currency: depositCurrency,
      amount: amt,
      method: depositMethod,
      method_label: methodLabel,
      proof_file_name: proofFile.name,
      proof_data_url: proofDataUrl,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    setLoading(false);
    setDone(true);
  };

  const closeModal = () => {
    setDepositOpen(false);
    setDone(false);
    setDepositAmount("");
    clearProof();
  };

  const pendingForWallet = (currency: WalletCurrency) =>
    allRequests.filter((r) => r.currency === currency && r.status === "pending").length;

  return (
    <>
      <Header title="Mi billetera" subtitle="Gestiona tus saldos en EUR y USD" />
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wallets.map((wallet) => {
            const info = CURRENCY_INFO[wallet.currency];
            const txs = transactions.filter((t) => t.wallet_id === wallet.id);
            const totalIn = txs.filter((t) => ["deposit", "transfer_in"].includes(t.type))
              .reduce((a, t) => a + t.amount, 0);
            const totalOut = txs.filter((t) => ["withdrawal", "transfer_out"].includes(t.type))
              .reduce((a, t) => a + t.amount, 0);
            return (
              <Card key={wallet.id} className="border-0 shadow-sm overflow-hidden">
                <div className={`h-2 ${wallet.currency === "EUR" ? "bg-blue-900" : "bg-emerald-600"}`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{info.flag}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Billetera {wallet.currency}</p>
                        <p className="text-3xl font-bold text-slate-800">
                          {info.symbol}{wallet.balance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Activa</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Total recargado</span>
                      </div>
                      <p className="font-bold text-slate-800">{info.symbol}{totalIn.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-orange-600 mb-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Total enviado</span>
                      </div>
                      <p className="font-bold text-slate-800">{info.symbol}{totalOut.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => { setDepositCurrency(wallet.currency as WalletCurrency); setDepositOpen(true); }}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Recargar saldo
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((tx) => {
                const config = TX_TYPE_CONFIG[tx.type];
                const TxIcon = config.icon;
                const info = CURRENCY_INFO[tx.currency];
                return (
                  <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <TxIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{config.label}</p>
                      <p className="text-xs text-slate-500 truncate">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${config.sign === "+" ? "text-emerald-600" : "text-red-600"}`}>
                        {config.sign}{info.symbol}{tx.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(tx.created_at), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={depositOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-900" />
              Recargar billetera {depositCurrency}
            </DialogTitle>
          </DialogHeader>
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <p className="font-bold text-slate-800 text-lg mb-1">Solicitud enviada</p>
              <p className="text-slate-500 text-sm mb-1">
                Tu comprobante de <strong>{CURRENCY_INFO[depositCurrency].symbol}{parseFloat(depositAmount).toFixed(2)}</strong> está siendo revisado.
              </p>
              <p className="text-xs text-slate-400 mb-5">Recibirás confirmación cuando el admin apruebe la recarga.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mb-5">
                <p className="text-xs font-semibold text-amber-800 mb-1">Estado actual</p>
                <p className="text-xs text-amber-700">⏳ En revisión · El saldo se acreditará una vez aprobado</p>
              </div>
              <Button onClick={closeModal} className="w-full bg-blue-900 hover:bg-blue-800 text-white">Entendido</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex gap-2">
                {(["EUR", "USD"] as WalletCurrency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setDepositCurrency(c)}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      depositCurrency === c ? "border-blue-900 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {CURRENCY_INFO[c].flag} {c}
                  </button>
                ))}
              </div>
              <div>
                <Label>Monto a recargar</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    {CURRENCY_INFO[depositCurrency].symbol}
                  </span>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="100.00"
                    className="pl-7 h-11"
                    min="1"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(String(amt))}
                      className="flex-1 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 font-medium transition-colors"
                    >
                      {CURRENCY_INFO[depositCurrency].symbol}{amt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Método de pago</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setDepositMethod("bank")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      depositMethod === "bank" ? "border-blue-900 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      depositMethod === "bank" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {depositCurrency === "EUR" ? "Transferencia bancaria (SEPA)" : "Transferencia bancaria (ACH)"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {depositCurrency === "EUR" ? "Ingresa desde cualquier banco español o europeo" : "Desde cuenta bancaria en EE.UU."}
                      </p>
                    </div>
                    {depositMethod === "bank" && <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />}
                  </button>
                  <button
                    onClick={() => setDepositMethod("mobile")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      depositMethod === "mobile" ? "border-blue-900 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      depositMethod === "mobile"
                        ? depositCurrency === "EUR" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {depositCurrency === "EUR" ? "Bizum" : "Zelle"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {depositCurrency === "EUR"
                          ? "Pago instantáneo desde tu móvil español"
                          : "Transferencia instantánea por teléfono o email"}
                      </p>
                    </div>
                    {depositMethod === "mobile" && <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />}
                  </button>
                </div>
                {depositMethod === "bank" && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-semibold text-blue-800">Datos para la transferencia</p>
                    {depositCurrency === "EUR" ? (
                      <>
                        <p className="text-xs text-blue-700">IBAN: <span className="font-mono font-semibold">ES12 3456 7890 1234 5678 9012</span></p>
                        <p className="text-xs text-blue-700">Beneficiario: <span className="font-semibold">Patzi Payments S.L.</span></p>
                        <p className="text-xs text-blue-700">Concepto: <span className="font-semibold">RECARGA-{depositAmount || "XXX"}</span></p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-blue-700">Routing: <span className="font-mono font-semibold">021000021</span></p>
                        <p className="text-xs text-blue-700">Account: <span className="font-mono font-semibold">000123456789</span></p>
                        <p className="text-xs text-blue-700">Beneficiary: <span className="font-semibold">Patzi Payments Inc.</span></p>
                      </>
                    )}
                  </div>
                )}
                {depositMethod === "mobile" && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600">
                      {depositCurrency === "EUR"
                        ? "Envía el monto exacto al número Bizum: +34 612 345 678 (Patzi Payments). Incluye tu referencia en el concepto."
                        : "Send to Zelle: payments@patzi.com (Patzi Payments). Include your reference in the memo."}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Proof of payment ──────────────────────────────────────── */}
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">
                  Comprobante de pago <span className="text-red-500">*</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleProofChange}
                  className="hidden"
                  id="proof-file-input"
                />
                {proofFile ? (
                  <div className="border-2 border-emerald-400 bg-emerald-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      {proofDataUrl.startsWith("data:image") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proofDataUrl}
                          alt="preview"
                          className="w-12 h-12 rounded-lg object-cover border border-emerald-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileImage className="w-6 h-6 text-emerald-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-800 truncate">{proofFile.name}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          {(proofFile.size / 1024).toFixed(0)} KB · Listo para enviar
                        </p>
                      </div>
                      <button
                        onClick={clearProof}
                        className="w-6 h-6 rounded-full bg-emerald-200 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-emerald-700" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="proof-file-input"
                    className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-5 cursor-pointer transition-colors text-center"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Adjuntar comprobante</p>
                      <p className="text-xs text-slate-400 mt-0.5">Captura de pantalla o PDF · máx. 10 MB</p>
                    </div>
                  </label>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-start gap-1">
                  <span className="text-amber-500 font-bold">!</span>
                  El saldo no se acredita automáticamente. El admin revisará tu comprobante antes de aprobar.
                </p>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={loading || !depositAmount || !proofFile}
                className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-semibold disabled:opacity-50"
              >
                {loading
                  ? "Enviando comprobante..."
                  : !proofFile
                  ? "Adjunta el comprobante para continuar"
                  : `Enviar solicitud de recarga ${depositAmount ? CURRENCY_INFO[depositCurrency].symbol + parseFloat(depositAmount).toFixed(2) : ""}`
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
