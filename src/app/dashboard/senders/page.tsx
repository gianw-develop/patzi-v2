"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Plus, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import StableSenderForm from "@/components/stable/StableSenderForm";
import { Button } from "@/components/ui/button";
import { useStableStore } from "@/lib/stable-store";

export default function StableSendersPage() {
  const { senders, operations, stableEligible, kycVerified, load, addSender, updateSender, loading } = useStableStore();
  const [selectedId, setSelectedId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const selected = senders.find((sender) => sender.id === selectedId) ?? senders[0];

  useEffect(() => { void load("user"); }, [load]);

  if (loading) return <><Header title="Remitentes USD" subtitle="Cargando tus clientes Stable" /><div className="grid flex-1 place-items-center bg-[#F5F7F2]">Cargando…</div></>;

  if (!stableEligible || !kycVerified) {
    return <><Header title="Remitentes USD" subtitle="Acceso Stable controlado" /><div className="grid flex-1 place-items-center bg-[#F5F7F2] p-5"><div className="premium-card max-w-lg rounded-[2rem] p-8 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-[#087F62]" /><h1 className="mt-4 text-2xl font-semibold">Disponible para cuentas Stable aprobadas</h1><p className="mt-2 text-sm text-[#071A2D]/50">Cuando Patzi apruebe tu acceso podrás registrar a los titulares que enviarán USD.</p></div></div></>;
  }

  return (
    <>
      <Header title="Remitentes USD" subtitle="Titulares autorizados para enviar fondos a tus operaciones Stable" />
      <div className="pathline-grid flex-1 bg-[#F5F7F2] p-4 sm:p-7">
        <div className="mx-auto max-w-[1250px]">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="premium-kicker text-[#087F62]">Directorio privado</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.04em]">Tus remitentes de USD</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#071A2D]/50">Cada operación conserva una copia histórica del titular, aunque después actualices sus datos.</p></div>
            <Button onClick={() => setCreating(true)} className="h-11 bg-[#071A2D] text-white"><Plus className="mr-2 h-4 w-4" />Nuevo remitente</Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(300px,.75fr)_minmax(0,1.25fr)]">
            <section className="premium-card overflow-hidden rounded-[1.7rem]">
              <div className="relative z-10 border-b border-[#071A2D]/8 p-5"><p className="text-sm font-semibold">Remitentes registrados</p><p className="mt-1 text-[10px] text-[#071A2D]/42">{senders.filter((item) => item.active).length} activos</p></div>
              <div className="relative z-10 max-h-[680px] overflow-y-auto">
                {senders.length === 0 ? <div className="p-8 text-center text-sm text-[#071A2D]/45">Todavía no has registrado remitentes.</div> : senders.map((sender) => {
                  const count = operations.filter((operation) => operation.senderId === sender.id).length;
                  const Icon = sender.type === "business" ? Building2 : UserRound;
                  return <button key={sender.id} onClick={() => { setSelectedId(sender.id); setCreating(false); }} className={`flex w-full items-center gap-3 border-b border-[#071A2D]/7 p-4 text-left transition-colors ${selected?.id === sender.id && !creating ? "bg-[#E7FAF3] shadow-[inset_4px_0_0_#0AA883]" : "hover:bg-[#071A2D]/[.025]"}`}><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#071A2D] text-white"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{sender.legalName}</p><p className="mt-1 truncate text-[10px] text-[#071A2D]/42">{sender.email}</p><p className="mt-1 text-[9px] font-medium text-[#087F62]">{count} {count === 1 ? "operación" : "operaciones"}</p></div><span className={`h-2.5 w-2.5 rounded-full ${sender.active ? "bg-[#0AA883]" : "bg-slate-300"}`} /></button>;
                })}
              </div>
            </section>

            <section className="premium-card rounded-[1.7rem] p-5 sm:p-7">
              <div className="relative z-10">
                {creating || !selected ? <><div className="mb-5"><p className="premium-kicker text-[#087F62]">Nuevo titular</p><h2 className="mt-1 text-xl font-semibold">Registrar remitente USD</h2></div><StableSenderForm onSubmit={async (input) => { const sender = await addSender(input); setSelectedId(sender.id); setCreating(false); toast.success("Remitente guardado"); }} /></> : <><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="premium-kicker text-[#087F62]">Ficha del remitente</p><h2 className="mt-1 text-xl font-semibold">{selected.legalName}</h2><p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#087F62]"><CheckCircle2 className="h-3.5 w-3.5" />Datos disponibles para nuevas operaciones</p></div><Button variant="outline" onClick={() => void updateSender(selected.id, { type: selected.type, legalName: selected.legalName, email: selected.email, phone: selected.phone, bankName: selected.bankName, accountLast4: selected.accountLast4, active: !selected.active }).then(() => toast.success(selected.active ? "Remitente pausado" : "Remitente activado")).catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo actualizar el remitente."))} className="h-9 text-xs">{selected.active ? "Pausar" : "Activar"}</Button></div><StableSenderForm initialValue={{ type: selected.type, legalName: selected.legalName, email: selected.email, phone: selected.phone, bankName: selected.bankName, accountLast4: selected.accountLast4 }} submitLabel="Actualizar datos" onSubmit={async (input) => { await updateSender(selected.id, { ...input, active: selected.active }); toast.success("Datos actualizados"); }} /></>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
