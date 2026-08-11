"use client";

import { useEffect, useState } from "react";
import { Building2, LoaderCircle, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { StableSenderInput } from "@/lib/stable-store";

const emptySender: StableSenderInput = {
  type: "person",
  legalName: "",
  email: "",
  phone: "",
  bankName: "",
  accountLast4: "",
};

export default function StableSenderForm({
  initialValue,
  onSubmit,
  submitLabel = "Guardar remitente",
}: {
  initialValue?: StableSenderInput;
  onSubmit: (input: StableSenderInput) => Promise<void>;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<StableSenderInput>(initialValue ?? emptySender);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialValue ?? emptySender);
  }, [initialValue]);

  const update = (key: keyof StableSenderInput, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const valid = form.legalName.trim().length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    && form.phone.trim().length >= 6
    && (!form.accountLast4 || /^\d{4}$/.test(form.accountLast4));

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        legalName: form.legalName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        bankName: form.bankName?.trim(),
        accountLast4: form.accountLast4?.trim(),
      });
      if (!initialValue) setForm(emptySender);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el remitente.");
    } finally {
      setSaving(false);
    }
  };

  const shell = "mt-1.5 h-11 w-full rounded-xl border border-[#071A2D]/10 bg-white px-3 text-sm outline-none transition-colors focus:border-[#2775CA]";
  const label = "text-[10px] font-semibold uppercase tracking-[.11em] text-[#071A2D]/45";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {(["person", "business"] as const).map((type) => (
          <button key={type} type="button" onClick={() => setForm((current) => ({ ...current, type }))} className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left ${form.type === type ? "border-[#0AA883] bg-[#E7FAF3]" : "border-[#071A2D]/8 bg-white"}`}>
            {type === "person" ? <UserRound className="h-5 w-5 text-[#087F62]" /> : <Building2 className="h-5 w-5 text-[#356DE5]" />}
            <span><b className="block text-xs">{type === "person" ? "Persona" : "Empresa"}</b><small className="text-[9px] text-[#071A2D]/42">{type === "person" ? "Titular individual" : "Cuenta corporativa"}</small></span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={`sm:col-span-2 ${label}`}>Nombre legal del titular<input className={shell} value={form.legalName} onChange={(event) => update("legalName", event.target.value)} placeholder={form.type === "person" ? "John Michael Smith" : "Example Holdings LLC"} /></label>
        <label className={label}>Correo electrónico<input type="email" className={shell} value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="cliente@email.com" /></label>
        <label className={label}>Teléfono<input type="tel" className={shell} value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+1 305 555 0101" /></label>
        <label className={label}>Banco de origen <span className="normal-case tracking-normal text-[#071A2D]/30">(opcional)</span><input className={shell} value={form.bankName ?? ""} onChange={(event) => update("bankName", event.target.value)} placeholder="Bank of America" /></label>
        <label className={label}>Últimos 4 de la cuenta <span className="normal-case tracking-normal text-[#071A2D]/30">(opcional)</span><input inputMode="numeric" maxLength={4} className={shell} value={form.accountLast4 ?? ""} onChange={(event) => update("accountLast4", event.target.value.replace(/\D/g, ""))} placeholder="1234" /></label>
      </div>
      <Button type="button" onClick={() => void save()} disabled={!valid || saving} className="mt-5 h-11 w-full bg-[#071A2D] text-white">
        {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? "Guardando…" : submitLabel}
      </Button>
    </div>
  );
}
