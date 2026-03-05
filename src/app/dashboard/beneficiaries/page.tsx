"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Plus, User, Trash2, Edit2, Building2, Smartphone, Send,
  CheckCircle2, ChevronRight, CreditCard, Phone, Mail, IdCard,
} from "lucide-react";
import { MOCK_BENEFICIARIES } from "@/lib/mock-data";
import { CURRENCY_INFO } from "@/lib/exchange-rates";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Beneficiary, DeliveryMethod, Currency } from "@/types";

// ─── Country config ────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "PE", flag: "🇵🇪", name: "Perú",      currency: "PEN" as Currency },
  { code: "VE", flag: "🇻🇪", name: "Venezuela", currency: "VES" as Currency },
  { code: "US", flag: "🇺🇸", name: "EE.UU.",   currency: "USD" as Currency },
  { code: "ES", flag: "🇪🇸", name: "España",   currency: "EUR" as Currency },
];

// ─── Methods per country ───────────────────────────────────────────────────────
interface MethodOption {
  value: DeliveryMethod;
  app: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

const METHODS_BY_COUNTRY: Record<string, MethodOption[]> = {
  PE: [
    { value: "bank",         app: "Transferencia bancaria", label: "Depósito bancario", desc: "Abono directo a cuenta BCP, Interbank, BBVA...", icon: Building2,  color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "mobile_money", app: "Yape",  label: "Yape",  desc: "Pago instantáneo al número de celular", icon: Smartphone, color: "bg-violet-50 text-violet-700 border-violet-200" },
    { value: "mobile_money", app: "Plin",  label: "Plin",  desc: "Transferencia móvil inmediata vía Plin",  icon: Smartphone, color: "bg-pink-50 text-pink-700 border-pink-200" },
  ],
  VE: [
    { value: "bank",         app: "Transferencia bancaria", label: "Depósito bancario", desc: "Abono a cuenta bancaria en bolívares digitales", icon: Building2,  color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "mobile_money", app: "Pagomóvil", label: "Pagomóvil", desc: "Pago interbancario instantáneo por número de teléfono", icon: Smartphone, color: "bg-red-50 text-red-700 border-red-200" },
  ],
  US: [
    { value: "bank",         app: "Transferencia bancaria", label: "Depósito bancario", desc: "ACH/SWIFT a cuenta bancaria en dólares", icon: Building2,  color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "mobile_money", app: "Zelle", label: "Zelle",  desc: "Envío instantáneo por teléfono o correo electrónico", icon: Smartphone, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  ],
  ES: [
    { value: "bank",         app: "Transferencia bancaria", label: "Depósito bancario", desc: "Ingreso a IBAN en España (CaixaBank, Santander...)", icon: Building2,  color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "mobile_money", app: "Bizum", label: "Bizum",  desc: "Pago instantáneo al número de teléfono registrado",   icon: Smartphone, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ],
};

// ─── Empty form ────────────────────────────────────────────────────────────────
const EMPTY = {
  full_name: "", country: "PE", currency: "PEN" as Currency,
  delivery_method: "bank" as DeliveryMethod, delivery_app: "Transferencia bancaria",
  bank_name: "", account_number: "", phone: "", email: "", cedula: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700", "from-indigo-500 to-indigo-700",
];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

// ══════════════════════════════════════════════════════════════════════════════
export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(MOCK_BENEFICIARIES);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const upd = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const currentCountry = COUNTRIES.find((c) => c.code === form.country)!;
  const availableMethods = METHODS_BY_COUNTRY[form.country] ?? [];
  const selectedMethod = availableMethods.find((m) => m.app === form.delivery_app) ?? availableMethods[0];

  const selectCountry = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code)!;
    const methods = METHODS_BY_COUNTRY[code];
    setForm((p) => ({
      ...p,
      country: code,
      currency: country.currency,
      delivery_method: methods[0].value,
      delivery_app: methods[0].app,
      bank_name: "", account_number: "", phone: "", email: "", cedula: "",
    }));
  };

  const selectMethod = (m: MethodOption) => {
    setForm((p) => ({ ...p, delivery_method: m.value, delivery_app: m.app, bank_name: "", account_number: "", phone: "", email: "", cedula: "" }));
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEdit = (b: Beneficiary) => {
    setEditing(b);
    setForm({
      full_name: b.full_name, country: b.country, currency: b.currency,
      delivery_method: b.delivery_method, delivery_app: b.delivery_app ?? "Transferencia bancaria",
      bank_name: b.bank_name ?? "", account_number: b.account_number ?? "",
      phone: b.phone ?? "", email: b.email ?? "", cedula: b.cedula ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.full_name.trim()) { toast.error("El nombre del beneficiario es obligatorio"); return; }
    if (form.delivery_method === "bank" && !form.account_number.trim()) { toast.error("El número de cuenta es obligatorio"); return; }
    if (form.delivery_method === "mobile_money" && !form.phone.trim()) { toast.error("El teléfono es obligatorio"); return; }
    if (editing) {
      setBeneficiaries((p) => p.map((b) => b.id === editing.id ? { ...b, ...form } : b));
      toast.success("Beneficiario actualizado correctamente");
    } else {
      const newB: Beneficiary = { id: `b${Date.now()}`, user_id: "u1", ...form, created_at: new Date().toISOString() };
      setBeneficiaries((p) => [...p, newB]);
      toast.success("Beneficiario añadido correctamente");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setBeneficiaries((p) => p.filter((b) => b.id !== id));
    toast.success("Beneficiario eliminado");
  };

  return (
    <>
      <Header title="Beneficiarios" subtitle="Gestiona tus contactos de envío guardados" />
      <div className="flex-1 p-3 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {beneficiaries.length} beneficiario{beneficiaries.length !== 1 ? "s" : ""} guardado{beneficiaries.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={openNew} className="bg-blue-900 hover:bg-blue-800 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Añadir beneficiario
          </Button>
        </div>

        {beneficiaries.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">Sin beneficiarios guardados</p>
              <p className="text-sm text-slate-400 mb-5">Añade tus contactos para agilizar tus envíos</p>
              <Button onClick={openNew} className="bg-blue-900 hover:bg-blue-800 text-white">
                <Plus className="w-4 h-4 mr-1.5" /> Añadir primero
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {beneficiaries.map((b) => {
              const currInfo = CURRENCY_INFO[b.currency];
              const isBank = b.delivery_method === "bank";
              return (
                <Card key={b.id} className="border-0 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(b.id)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-white font-bold text-sm tracking-wide">{initials(b.full_name)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{b.full_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-base leading-none">{currInfo.flag}</span>
                              <span className="text-xs text-slate-500">{currInfo.country}</span>
                              <span className="text-slate-300 text-xs">·</span>
                              <span className="text-xs font-semibold text-slate-600">{b.currency}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => openEdit(b)}>
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleDelete(b.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isBank ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                            {isBank ? <Building2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {b.delivery_app ?? (isBank ? "Transferencia bancaria" : "Pago móvil")}
                          </span>
                        </div>
                        {isBank && b.bank_name && (
                          <p className="text-xs text-slate-500 pl-8">{b.bank_name}</p>
                        )}
                        {isBank && b.account_number && (
                          <p className="text-xs text-slate-400 font-mono pl-8 truncate">{b.account_number}</p>
                        )}
                        {!isBank && b.phone && (
                          <p className="text-xs text-slate-500 pl-8">{b.phone}</p>
                        )}
                        {!isBank && b.email && (
                          <p className="text-xs text-slate-500 pl-8">{b.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Añadido {format(new Date(b.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                      <Button size="sm" asChild className="h-7 text-xs bg-blue-900 hover:bg-blue-800 text-white px-3">
                        <a href="/dashboard/send">
                          <Send className="w-3 h-3 mr-1.5" /> Enviar
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Premium Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] p-0 gap-0 overflow-hidden">

          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 pt-6 pb-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-bold text-lg">
                {editing ? "Editar beneficiario" : "Nuevo beneficiario"}
              </h2>
              <Badge className="bg-white/15 text-white border-white/20 text-xs">
                {currentCountry.flag} {currentCountry.name} · {form.currency}
              </Badge>
            </div>
            <p className="text-blue-200 text-xs">
              {editing ? "Actualiza los datos del contacto" : "Añade un nuevo destinatario de transferencia"}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[75vh] overflow-y-auto">

            {/* Name */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                Titular / Receptor
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={form.full_name}
                  onChange={(e) => upd("full_name", e.target.value)}
                  placeholder="Nombre completo del receptor"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Country selector */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                País de destino
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c.code)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                      form.country === c.code
                        ? "border-blue-700 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl leading-none">{c.flag}</span>
                    <span className={`text-[10px] font-semibold leading-tight text-center ${form.country === c.code ? "text-blue-800" : "text-slate-600"}`}>
                      {c.name}
                    </span>
                    {form.country === c.code && (
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-700 flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Method selector */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                Método de pago
              </Label>
              <div className="space-y-2">
                {availableMethods.map((m) => (
                  <button
                    key={m.app}
                    type="button"
                    onClick={() => selectMethod(m)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      selectedMethod?.app === m.app
                        ? "border-blue-700 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${m.color}`}>
                      <m.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${selectedMethod?.app === m.app ? "text-blue-800" : "text-slate-800"}`}>
                        {m.app}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight mt-0.5">{m.desc}</p>
                    </div>
                    {selectedMethod?.app === m.app && (
                      <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic fields */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 block">
                Datos del beneficiario
              </Label>

              {/* BANK */}
              {form.delivery_method === "bank" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.bank_name}
                      onChange={(e) => upd("bank_name", e.target.value)}
                      placeholder={form.country === "PE" ? "BCP, Interbank, BBVA..." : form.country === "VE" ? "Banco de Venezuela, Banesco..." : form.country === "US" ? "Bank of America, Chase..." : "CaixaBank, Santander..."}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.account_number}
                      onChange={(e) => upd("account_number", e.target.value)}
                      placeholder={form.country === "ES" ? "ES12 3456 7890 1234 5678 9012" : form.country === "PE" ? "191-12345678-0-90" : form.country === "US" ? "Routing + Account number" : "0102-0000-00-0000000001"}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {/* BIZUM */}
              {form.delivery_app === "Bizum" && (
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.phone}
                    onChange={(e) => upd("phone", e.target.value)}
                    placeholder="+34 612 345 678"
                    type="tel"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              )}

              {/* YAPE or PLIN */}
              {(form.delivery_app === "Yape" || form.delivery_app === "Plin") && (
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.phone}
                    onChange={(e) => upd("phone", e.target.value)}
                    placeholder="+51 987 654 321"
                    type="tel"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              )}

              {/* ZELLE */}
              {form.delivery_app === "Zelle" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.phone}
                      onChange={(e) => upd("phone", e.target.value)}
                      placeholder="+1 305 456 7890 (opcional si usa email)"
                      type="tel"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.email}
                      onChange={(e) => upd("email", e.target.value)}
                      placeholder="correo@email.com (opcional si usa teléfono)"
                      type="email"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* PAGOMÓVIL */}
              {form.delivery_app === "Pagomóvil" && (
                <div className="space-y-3">
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.cedula}
                      onChange={(e) => upd("cedula", e.target.value)}
                      placeholder="Cédula de identidad (V-12345678)"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.bank_name}
                      onChange={(e) => upd("bank_name", e.target.value)}
                      placeholder="Banco (Banco de Venezuela, Banesco...)"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.phone}
                      onChange={(e) => upd("phone", e.target.value)}
                      placeholder="+58 414 123 4567"
                      type="tel"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 h-11 bg-blue-900 hover:bg-blue-800 text-white font-semibold">
              {editing ? "Guardar cambios" : "Añadir beneficiario"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
