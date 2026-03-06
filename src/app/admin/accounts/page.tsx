"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Edit2, Trash2, Building2, Smartphone, CheckCircle2,
  AlertCircle, Copy, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAccountsStore, type PaymentAccount, type AccountCurrency as Currency, type MethodType } from "@/lib/accounts-store";

const CURRENCY_INFO: Record<Currency, { flag: string; symbol: string; name: string }> = {
  EUR: { flag: "🇪🇺", symbol: "€", name: "Euro" },
  USD: { flag: "🇺🇸", symbol: "$", name: "Dólar" },
  PEN: { flag: "🇵🇪", symbol: "S/", name: "Sol Peruano" },
  VES: { flag: "🇻🇪", symbol: "Bs.", name: "Bolívar" },
};

const MOBILE_METHODS: Record<Currency, string[]> = {
  EUR: ["Bizum"],
  USD: ["Zelle"],
  PEN: ["Yape", "Plin"],
  VES: ["Pagomóvil"],
};

const EMPTY_FORM: Omit<PaymentAccount, "id"> = {
  currency: "EUR", method_type: "bank", method_name: "Transferencia bancaria",
  account_holder: "", bank_name: "", iban_account: "", phone: "", email: "",
  instructions: "Solo se aceptan depósitos de titulares de cuenta.", for_deposits: true, for_payouts: true, is_active: true,
};

export default function AdminAccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount, toggleActive } = useAccountsStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);
  const [form, setForm] = useState<Omit<PaymentAccount, "id">>(EMPTY_FORM);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Currency>("EUR");

  const CURRENCIES: Currency[] = ["EUR", "USD", "PEN", "VES"];

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, currency: activeTab });
    setDialogOpen(true);
  };

  const openEdit = (acc: PaymentAccount) => {
    setEditing(acc);
    setForm({ ...acc });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.account_holder.trim()) { toast.error("El titular es obligatorio"); return; }
    if (form.method_type === "mobile" && form.method_name !== "Zelle" && !form.phone?.trim()) { toast.error("El teléfono es obligatorio"); return; }
    if (form.method_name === "Zelle" && !form.phone?.trim() && !form.email?.trim()) { toast.error("Introduce teléfono o email de Zelle"); return; }

    if (editing) {
      updateAccount(editing.id, form);
      toast.success("Cuenta actualizada");
    } else {
      addAccount({ ...form, id: crypto.randomUUID() });
      toast.success("Cuenta añadida");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    toast.success("Cuenta eliminada");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const tabAccounts = accounts.filter((a) => a.currency === activeTab);
  const bankAccounts = tabAccounts.filter((a) => a.method_type === "bank");
  const mobileAccounts = tabAccounts.filter((a) => a.method_type === "mobile");

  const updateForm = (field: string, value: string | boolean) => {
    setForm((p) => {
      const updated = { ...p, [field]: value };
      if (field === "currency" || field === "method_type") {
        const currency = field === "currency" ? (value as Currency) : p.currency;
        const mtype = field === "method_type" ? (value as MethodType) : p.method_type;
        updated.method_name = mtype === "bank" ? "Transferencia bancaria" : MOBILE_METHODS[currency][0] ?? "";
      }
      return updated;
    });
  };

  return (
    <>
      <Header title="Cuentas de cobro" subtitle="Gestiona las cuentas bancarias y pagos móviles por divisa" />
      <div className="flex-1 p-3 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {CURRENCIES.map((c) => {
              const info = CURRENCY_INFO[c];
              const count = accounts.filter((a) => a.currency === c && a.is_active).length;
              return (
                <button
                  key={c}
                  onClick={() => setActiveTab(c)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === c ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {info.flag} {c}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${count > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <Button onClick={openCreate} className="bg-blue-900 hover:bg-blue-800 text-white">
            <Plus className="w-4 h-4 mr-1" /> Nueva cuenta
          </Button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-800">Nota importante: </span>
            <span className="text-amber-700">
              La billetera Patzi solo acepta depósitos en <strong>EUR y USD</strong> vía transferencia bancaria o pago móvil.
              No se aceptan depósitos en tarjeta de crédito ni débito.
              Las cuentas PEN/VES son exclusivamente para <strong>pagos a beneficiarios</strong>.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Transferencia bancaria
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 normal-case font-normal">{bankAccounts.length} cuenta{bankAccounts.length !== 1 ? "s" : ""}</span>
            </h3>
            <div className="space-y-3">
              {bankAccounts.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                  <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No hay cuentas bancarias para {activeTab}</p>
                  <Button size="sm" variant="outline" onClick={openCreate} className="mt-3 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Añadir cuenta
                  </Button>
                </div>
              ) : (
                bankAccounts.map((acc) => (
                  <AccountCard key={acc.id} acc={acc} show={showSensitive[acc.id]} onToggleShow={() => setShowSensitive((p) => ({ ...p, [acc.id]: !p[acc.id] }))} onEdit={() => openEdit(acc)} onDelete={() => handleDelete(acc.id)} onToggleActive={() => toggleActive(acc.id)} onCopy={copyToClipboard} />
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" /> Pago móvil · {MOBILE_METHODS[activeTab].join(" / ")}
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 normal-case font-normal">{mobileAccounts.length} cuenta{mobileAccounts.length !== 1 ? "s" : ""}</span>
            </h3>
            <div className="space-y-3">
              {mobileAccounts.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                  <Smartphone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No hay cuentas de pago móvil para {activeTab}</p>
                  <Button size="sm" variant="outline" onClick={openCreate} className="mt-3 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Añadir cuenta
                  </Button>
                </div>
              ) : (
                mobileAccounts.map((acc) => (
                  <AccountCard key={acc.id} acc={acc} show={showSensitive[acc.id]} onToggleShow={() => setShowSensitive((p) => ({ ...p, [acc.id]: !p[acc.id] }))} onEdit={() => openEdit(acc)} onDelete={() => handleDelete(acc.id)} onToggleActive={() => toggleActive(acc.id)} onCopy={copyToClipboard} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cuenta" : "Nueva cuenta de cobro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Divisa</Label>
                <Select value={form.currency} onValueChange={(v) => updateForm("currency", v)}>
                  <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{CURRENCY_INFO[c].flag} {c} — {CURRENCY_INFO[c].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de método</Label>
                <Select value={form.method_type} onValueChange={(v) => updateForm("method_type", v)}>
                  <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank"><Building2 className="w-3.5 h-3.5 mr-1.5 inline" /> Transferencia bancaria</SelectItem>
                    <SelectItem value="mobile"><Smartphone className="w-3.5 h-3.5 mr-1.5 inline" /> Pago móvil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.method_type === "mobile" && (
              <div>
                <Label>App / Plataforma</Label>
                <Select value={form.method_name} onValueChange={(v) => updateForm("method_name", v)}>
                  <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOBILE_METHODS[form.currency].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Titular de la cuenta</Label>
              <Input value={form.account_holder} onChange={(e) => updateForm("account_holder", e.target.value)} className="mt-1.5 h-10" placeholder="Patzi Financial S.L." />
            </div>

            {form.method_type === "bank" && (
              <>
                <div>
                  <Label>Banco <span className="text-slate-400 font-normal">(opcional)</span></Label>
                  <Input value={form.bank_name ?? ""} onChange={(e) => updateForm("bank_name", e.target.value)} className="mt-1.5 h-10" placeholder="CaixaBank, BCP, Bank of America..." />
                </div>
                <div>
                  <Label>IBAN / Número de cuenta <span className="text-slate-400 font-normal">(opcional)</span></Label>
                  <Input value={form.iban_account ?? ""} onChange={(e) => updateForm("iban_account", e.target.value)} className="mt-1.5 h-10 font-mono" placeholder="ES12 3456 7890 1234 5678 9012" />
                </div>
              </>
            )}

            {form.method_type === "mobile" && form.method_name !== "Zelle" && (
              <div>
                <Label>Teléfono registrado</Label>
                <Input value={form.phone ?? ""} onChange={(e) => updateForm("phone", e.target.value)} className="mt-1.5 h-10" placeholder="+34 612 345 678" type="tel" />
              </div>
            )}

            {form.method_name === "Zelle" && (
              <>
                <div>
                  <Label>Teléfono Zelle <span className="text-slate-400 font-normal">(opcional si hay email)</span></Label>
                  <Input value={form.phone ?? ""} onChange={(e) => updateForm("phone", e.target.value)} className="mt-1.5 h-10" placeholder="+1 305 456 7890" type="tel" />
                </div>
                <div>
                  <Label>Email Zelle <span className="text-slate-400 font-normal">(opcional si hay teléfono)</span></Label>
                  <Input value={form.email ?? ""} onChange={(e) => updateForm("email", e.target.value)} className="mt-1.5 h-10" placeholder="pagos@patzi.com" type="email" />
                </div>
              </>
            )}

            <div>
              <Label>Instrucciones para el usuario</Label>
              <textarea
                value={form.instructions ?? ""}
                onChange={(e) => updateForm("instructions", e.target.value)}
                className="mt-1.5 w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/40"
                placeholder="Ej: Indica tu nombre completo y la referencia de tu pedido en el concepto del pago. Una vez realizado, adjunta el comprobante en la plataforma para verificar tu transferencia."
              />
            </div>

            <Separator />

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.for_deposits} onCheckedChange={(v) => updateForm("for_deposits", v)} id="dep" />
                <Label htmlFor="dep" className="text-xs cursor-pointer">Aceptar depósitos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.for_payouts} onCheckedChange={(v) => updateForm("for_payouts", v)} id="pay" />
                <Label htmlFor="pay" className="text-xs cursor-pointer">Realizar pagos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => updateForm("is_active", v)} id="act" />
                <Label htmlFor="act" className="text-xs cursor-pointer">Activa</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-blue-900 hover:bg-blue-800 text-white">
                {editing ? "Guardar cambios" : "Añadir cuenta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AccountCardProps {
  acc: PaymentAccount;
  show: boolean;
  onToggleShow: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onCopy: (text: string, label: string) => void;
}

function AccountCard({ acc, show, onToggleShow, onEdit, onDelete, onToggleActive, onCopy }: AccountCardProps) {
  const info = CURRENCY_INFO[acc.currency];
  return (
    <Card className={`border-0 shadow-sm transition-opacity ${!acc.is_active ? "opacity-60" : ""}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${acc.method_type === "bank" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
              {acc.method_type === "bank" ? <Building2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{acc.method_name}</p>
              <p className="text-xs text-slate-500">{acc.account_holder}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Switch checked={acc.is_active} onCheckedChange={onToggleActive} />
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onEdit}>
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            </Button>
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </Button>
          </div>
        </div>

        {acc.method_type === "bank" && acc.iban_account && (
          <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 mb-0.5">IBAN / Cuenta · {acc.bank_name}</p>
              <p className={`text-xs font-mono font-semibold text-slate-700 ${!show ? "tracking-widest" : ""}`}>
                {show ? acc.iban_account : "•••• •••• •••• " + acc.iban_account.slice(-4)}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onToggleShow} className="p-1 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => onCopy(acc.iban_account!, "IBAN")} className="p-1 text-slate-400 hover:text-slate-600">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {acc.method_type === "mobile" && acc.phone && (
          <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-slate-400 mb-0.5">Teléfono {acc.method_name}</p>
              <p className="text-xs font-mono font-semibold text-slate-700">{acc.phone}</p>
            </div>
            <button onClick={() => onCopy(acc.phone!, "Teléfono")} className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {acc.for_deposits && (
            <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Depósitos
            </Badge>
          )}
          {acc.for_payouts && (
            <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Pagos a usuarios
            </Badge>
          )}
          {!acc.is_active && (
            <Badge className="text-[10px] bg-slate-100 text-slate-500 border-slate-200 px-2 py-0.5">
              Inactiva
            </Badge>
          )}
        </div>

        {acc.instructions && (
          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-2">
            {acc.instructions}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
