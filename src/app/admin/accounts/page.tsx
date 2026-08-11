"use client";

import { useEffect, useState } from "react";
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
  AlertCircle, Copy, Eye, EyeOff, Gauge,
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
  account_holder: "", bank_name: "", iban_account: "", ach_enabled: true, routing_number: "", wire_enabled: false, wire_routing_number: "", account_type: "checking", phone: "", email: "", weekly_limit: 20000,
  instructions: "Solo se aceptan depósitos de titulares de cuenta.", for_deposits: true, for_payouts: true, is_active: true,
};

export default function AdminAccountsPage() {
  const { accounts, loadAccounts, addAccount, updateAccount, deleteAccount, toggleActive } = useAccountsStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);
  const [form, setForm] = useState<Omit<PaymentAccount, "id">>(EMPTY_FORM);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Currency>("EUR");

  const CURRENCIES: Currency[] = ["EUR", "USD", "PEN", "VES"];

  useEffect(() => {
    void loadAccounts().catch(() => toast.error("No se pudieron cargar las cuentas."));
  }, [loadAccounts]);

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

  const handleSave = async () => {
    if (!form.account_holder.trim()) { toast.error("El titular es obligatorio"); return; }
    if (form.method_type === "bank" && !form.bank_name?.trim()) { toast.error("El banco es obligatorio"); return; }
    if (form.method_type === "bank" && !form.iban_account?.trim()) { toast.error(form.currency === "EUR" ? "El IBAN es obligatorio" : "El número de cuenta es obligatorio"); return; }
    if (form.method_type === "bank" && form.currency === "USD" && !form.ach_enabled && !form.wire_enabled) { toast.error("Activa al menos un método: ACH o Wire"); return; }
    if (form.method_type === "bank" && form.currency === "USD" && form.ach_enabled && !/^\d{9}$/.test(form.routing_number ?? "")) { toast.error("El routing ACH debe tener 9 dígitos"); return; }
    if (form.method_type === "bank" && form.currency === "USD" && form.wire_enabled && !/^\d{9}$/.test(form.wire_routing_number ?? "")) { toast.error("El routing Wire debe tener 9 dígitos"); return; }
    if (form.method_type === "bank" && form.currency === "USD" && Number(form.weekly_limit) <= 0) { toast.error("El límite semanal debe ser mayor que cero"); return; }
    if (form.method_type === "mobile" && form.method_name !== "Zelle" && !form.phone?.trim()) { toast.error("El teléfono es obligatorio"); return; }
    if (form.method_name === "Zelle" && !form.phone?.trim() && !form.email?.trim()) { toast.error("Introduce teléfono o email de Zelle"); return; }

    try {
      if (editing) {
        await updateAccount(editing.id, form);
        toast.success("Cuenta actualizada");
      } else {
        await addAccount(form);
        toast.success("Cuenta añadida");
      }
      setDialogOpen(false);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "No se pudo guardar la cuenta.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      toast.success("Cuenta eliminada");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la cuenta.");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleActive(id);
      toast.success("Disponibilidad actualizada");
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "No se pudo actualizar la cuenta.");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const tabAccounts = accounts.filter((a) => a.currency === activeTab);
  const bankAccounts = tabAccounts.filter((a) => a.method_type === "bank");
  const mobileAccounts = tabAccounts.filter((a) => a.method_type === "mobile");
  const usdReceivingAccounts = accounts.filter((a) => a.currency === "USD" && a.method_type === "bank" && a.for_deposits);
  const totalWeeklyLimit = usdReceivingAccounts.reduce((sum, account) => sum + Number(account.weekly_limit ?? 20000), 0);
  const totalWeeklyUsed = usdReceivingAccounts.reduce((sum, account) => sum + Number(account.weekly_used ?? 0), 0);
  const totalWeeklyAvailable = Math.max(totalWeeklyLimit - totalWeeklyUsed, 0);
  const totalUtilization = totalWeeklyLimit > 0 ? Math.min((totalWeeklyUsed / totalWeeklyLimit) * 100, 100) : 0;

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

        {activeTab === "USD" && (
          <section className="premium-card overflow-hidden rounded-2xl p-4 sm:p-5">
            <div className="relative z-10">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#087F62]">Capacidad Business USD</p><h2 className="mt-1 text-lg font-semibold text-[#071A2D]">Balance semanal de cuentas receptoras</h2></div>
                <span className="w-fit rounded-full border border-[#0AA883]/15 bg-[#E7FAF3] px-3 py-1.5 text-[10px] font-semibold text-[#087F62]">Reinicio automático · domingo</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[{label:"Cuentas USD",value:String(usdReceivingAccounts.length)},{label:"Capacidad total",value:`$${totalWeeklyLimit.toLocaleString("en-US")}`},{label:"Recibido + reservado",value:`$${totalWeeklyUsed.toLocaleString("en-US")}`},{label:"Disponible",value:`$${totalWeeklyAvailable.toLocaleString("en-US")}`}].map((metric)=><div key={metric.label} className="rounded-xl border border-[#071A2D]/7 bg-white p-3"><p className="text-[10px] text-[#071A2D]/42">{metric.label}</p><p className="mt-1 text-xl font-semibold text-[#071A2D]">{metric.value}</p></div>)}
              </div>
              <div className="mt-4"><div className="flex items-center justify-between text-[10px] text-[#071A2D]/48"><span>Uso global de la red receptora</span><b className="text-[#071A2D]">{totalUtilization.toFixed(0)}%</b></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#071A2D]/7 shadow-inner"><div className={`h-full rounded-full transition-[width] duration-500 ${totalUtilization>=90?"bg-[#FF765B]":totalUtilization>=70?"bg-amber-500":"bg-[#0AA883]"}`} style={{width:`${totalUtilization}%`}} /></div></div>
            </div>
          </section>
        )}

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

        <div className={`grid grid-cols-1 gap-5 ${bankAccounts.length > 0 && mobileAccounts.length > 0 ? "lg:grid-cols-2" : ""}`}>
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[.08em] text-slate-600">
              <Building2 className="h-4 w-4" /> Transferencia bancaria
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 normal-case font-normal">{bankAccounts.length} cuenta{bankAccounts.length !== 1 ? "s" : ""}</span>
            </h3>
            <div className={mobileAccounts.length === 0 && bankAccounts.length > 0 ? "grid gap-4 xl:grid-cols-2" : "space-y-3"}>
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
                  <AccountCard key={acc.id} acc={acc} show={showSensitive[acc.id]} onToggleShow={() => setShowSensitive((p) => ({ ...p, [acc.id]: !p[acc.id] }))} onEdit={() => openEdit(acc)} onDelete={() => void handleDelete(acc.id)} onToggleActive={() => void handleToggle(acc.id)} onCopy={copyToClipboard} />
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[.08em] text-slate-600">
              <Smartphone className="h-4 w-4" /> Pago móvil · {MOBILE_METHODS[activeTab].join(" / ")}
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 normal-case font-normal">{mobileAccounts.length} cuenta{mobileAccounts.length !== 1 ? "s" : ""}</span>
            </h3>
            <div className={bankAccounts.length === 0 && mobileAccounts.length > 0 ? "grid gap-4 xl:grid-cols-2" : "space-y-3"}>
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
                  <AccountCard key={acc.id} acc={acc} show={showSensitive[acc.id]} onToggleShow={() => setShowSensitive((p) => ({ ...p, [acc.id]: !p[acc.id] }))} onEdit={() => openEdit(acc)} onDelete={() => void handleDelete(acc.id)} onToggleActive={() => void handleToggle(acc.id)} onCopy={copyToClipboard} />
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
                  <Label>Banco</Label>
                  <Input value={form.bank_name ?? ""} onChange={(e) => updateForm("bank_name", e.target.value)} className="mt-1.5 h-10" placeholder="CaixaBank, BCP, Bank of America..." />
                </div>
                <div>
                  <Label>{form.currency === "EUR" ? "IBAN" : "Número de cuenta"}</Label>
                  <Input value={form.iban_account ?? ""} onChange={(e) => updateForm("iban_account", e.target.value)} className="mt-1.5 h-10 font-mono" placeholder={form.currency === "EUR" ? "ES12 3456 7890 1234 5678 9012" : "1234567890"} />
                </div>
                {form.currency === "USD" && (
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                    <div>
                      <Label>Tipo de cuenta</Label>
                      <Select value={form.account_type ?? "checking"} onValueChange={(v) => updateForm("account_type", v)}>
                        <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end pb-1"><p className="text-[10px] leading-4 text-slate-500">El routing puede ser diferente según el canal bancario.</p></div>
                    <div className={`rounded-xl border p-3 transition-colors ${form.ach_enabled ? "border-[#0AA883]/25 bg-white" : "border-slate-200 bg-slate-100/70"}`}>
                      <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold text-slate-800">Aceptar ACH</p><p className="text-[9px] text-slate-500">Transferencia doméstica ACH</p></div><Switch checked={Boolean(form.ach_enabled)} onCheckedChange={(value) => updateForm("ach_enabled", value)} /></div>
                      {form.ach_enabled && <div className="mt-3"><Label>Routing ACH</Label><Input value={form.routing_number ?? ""} onChange={(e) => updateForm("routing_number", e.target.value.replace(/\D/g, "").slice(0, 9))} className="mt-1.5 h-10 font-mono" placeholder="021000021" inputMode="numeric" maxLength={9} /><p className="mt-1 text-[9px] text-slate-500">Exactamente 9 dígitos.</p></div>}
                    </div>
                    <div className={`rounded-xl border p-3 transition-colors ${form.wire_enabled ? "border-[#2775CA]/25 bg-white" : "border-slate-200 bg-slate-100/70"}`}>
                      <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold text-slate-800">Aceptar Wire</p><p className="text-[9px] text-slate-500">Domestic Wire Transfer</p></div><Switch checked={Boolean(form.wire_enabled)} onCheckedChange={(value) => updateForm("wire_enabled", value)} /></div>
                      {form.wire_enabled && <div className="mt-3"><Label>Routing Wire</Label><Input value={form.wire_routing_number ?? ""} onChange={(e) => updateForm("wire_routing_number", e.target.value.replace(/\D/g, "").slice(0, 9))} className="mt-1.5 h-10 font-mono" placeholder="026009593" inputMode="numeric" maxLength={9} /><p className="mt-1 text-[9px] text-slate-500">Puede ser distinto al routing ACH.</p></div>}
                    </div>
                    <div className="col-span-2 border-t border-blue-100 pt-3">
                      <Label>Límite semanal de recepción</Label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">$</span>
                        <Input type="number" min="1" step="100" value={form.weekly_limit ?? 20000} onChange={(e) => updateForm("weekly_limit", e.target.value)} className="h-10 pl-7 font-mono" />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">El cupo se renueva cada domingo. Límite estándar: $20,000 USD.</p>
                    </div>
                  </div>
                )}
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
              <Button onClick={() => void handleSave()} className="flex-1 bg-blue-900 hover:bg-blue-800 text-white">
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
  const showsWeeklyCapacity = acc.currency === "USD" && acc.method_type === "bank" && acc.for_deposits;
  const weeklyLimit = Number(acc.weekly_limit ?? 20000);
  const weeklyUsed = Number(acc.weekly_used ?? 0);
  const weeklyAvailable = Number(acc.weekly_available ?? Math.max(weeklyLimit - weeklyUsed, 0));
  const utilization = Math.min(Number(acc.utilization_percent ?? (weeklyUsed / weeklyLimit) * 100), 100);
  const capacityExhausted = showsWeeklyCapacity && (!acc.capacity_available || utilization >= 100);
  const barTone = utilization >= 90 ? "bg-[#FF765B]" : utilization >= 70 ? "bg-amber-500" : "bg-[#0AA883]";
  const copyFullAccount = () => {
    const details = [
      "DATOS BANCARIOS PATZI",
      `Titular: ${acc.account_holder}`,
      `Banco: ${acc.bank_name ?? ""}`,
      `Número de cuenta: ${acc.iban_account ?? ""}`,
      acc.account_type ? `Tipo de cuenta: ${acc.account_type}` : null,
      acc.ach_enabled && acc.routing_number ? `ACH routing: ${acc.routing_number}` : null,
      acc.wire_enabled && acc.wire_routing_number ? `Wire routing: ${acc.wire_routing_number}` : null,
      acc.instructions ? `Instrucciones: ${acc.instructions}` : null,
    ].filter(Boolean).join("\n");
    onCopy(details, "Datos bancarios completos");
  };
  return (
    <Card className={`overflow-hidden border border-slate-200/80 shadow-[0_12px_30px_rgba(15,23,42,.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,.1)] ${!acc.is_active || capacityExhausted ? "bg-slate-100 opacity-65 grayscale-[.35]" : ""}`}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${acc.method_type === "bank" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
              {acc.method_type === "bank" ? <Building2 className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">{acc.method_name}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-500">{acc.account_holder}</p>
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

        {showsWeeklyCapacity && (
          <div className={`rounded-2xl border p-4 ${capacityExhausted ? "border-slate-200 bg-slate-100" : "border-[#0AA883]/15 bg-[#EAF8F3]/70"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.12em] text-slate-500"><Gauge className="h-4 w-4" /> Volumen semanal</p>
                <p className="mt-1.5 text-lg font-bold text-slate-900">${weeklyUsed.toLocaleString("en-US")} <span className="text-sm font-normal text-slate-500">de ${weeklyLimit.toLocaleString("en-US")}</span></p>
              </div>
              <Badge className={`px-2.5 py-1 text-xs ${capacityExhausted ? "border-slate-200 bg-slate-200 text-slate-600" : utilization >= 90 ? "border-red-200 bg-red-50 text-red-700" : utilization >= 70 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {capacityExhausted ? "Cupo agotado" : `${utilization.toFixed(0)}% usado`}
              </Badge>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white shadow-inner"><div className={`h-full rounded-full transition-[width] duration-500 ${capacityExhausted ? "bg-slate-400" : barTone}`} style={{ width: `${utilization}%` }} /></div>
            <div className="mt-2.5 flex justify-between text-xs text-slate-500"><span>Disponible: <b className="text-slate-700">${weeklyAvailable.toLocaleString("en-US")}</b></span><span>Reinicio: domingo</span></div>
          </div>
        )}

        {acc.method_type === "bank" && acc.iban_account && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium text-slate-500">IBAN / Cuenta · {acc.bank_name}</p>
              <p className={`font-mono text-sm font-semibold text-slate-800 ${!show ? "tracking-widest" : ""}`}>
                {show ? acc.iban_account : "•••• •••• •••• " + acc.iban_account.slice(-4)}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onToggleShow} className="p-1 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={copyFullAccount} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#087f62] hover:bg-[#E7FAF3]" title="Copiar todos los datos bancarios">
                <Copy className="h-4 w-4" /><span className="hidden sm:inline">Copiar todo</span>
              </button>
            </div>
          </div>
        )}

        {acc.method_type === "bank" && (acc.routing_number || acc.wire_routing_number || acc.account_type) && (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs">
            {acc.ach_enabled && acc.routing_number && <button onClick={() => onCopy(acc.routing_number!, "Routing ACH")} className="text-left"><span className="block font-medium text-slate-500">ACH habilitado</span><span className="mt-1 block font-mono text-sm font-bold text-slate-800">{acc.routing_number}</span></button>}
            {acc.wire_enabled && acc.wire_routing_number && <button onClick={() => onCopy(acc.wire_routing_number!, "Routing Wire")} className="text-left"><span className="block font-medium text-slate-500">Wire habilitado</span><span className="mt-1 block font-mono text-sm font-bold text-slate-800">{acc.wire_routing_number}</span></button>}
            {acc.account_type && <div><span className="block font-medium text-slate-500">Tipo de cuenta</span><span className="mt-1 block text-sm font-semibold capitalize text-slate-800">{acc.account_type}</span></div>}
          </div>
        )}

        {acc.method_type === "mobile" && acc.phone && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5">
            <div>
              <p className="text-[10px] text-slate-400 mb-0.5">Teléfono {acc.method_name}</p>
              <p className="font-mono text-sm font-semibold text-slate-800">{acc.phone}</p>
            </div>
            <button onClick={() => onCopy(acc.phone!, "Teléfono")} className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {acc.for_deposits && (
            <Badge className="border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
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
          <p className="border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
            {acc.instructions}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
