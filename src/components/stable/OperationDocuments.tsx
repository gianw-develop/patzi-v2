"use client";

import { useState, type ChangeEvent } from "react";
import { CheckCircle2, Download, FileCheck2, FileText, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  downloadProof,
  downloadStableDocument,
  type StableDocumentType,
  type StableOperation,
  useStableStore,
} from "@/lib/stable-store";
import { cn } from "@/lib/utils";

const documentMeta: Record<StableDocumentType, { label: string; hint: string }> = {
  invoice: { label: "Factura", hint: "Documento de facturación" },
  contract: { label: "Contrato", hint: "Acuerdo de la operación" },
};

export default function OperationDocuments({
  operation,
  admin = false,
  className,
}: {
  operation: StableOperation;
  admin?: boolean;
  className?: string;
}) {
  const uploadOperationDocument = useStableStore((state) => state.uploadOperationDocument);
  const [uploading, setUploading] = useState<StableDocumentType | null>(null);
  const [opening, setOpening] = useState<"proof" | StableDocumentType | null>(null);

  const openProof = async () => {
    if (!operation.proof || opening) return;
    setOpening("proof");
    try {
      if (!(await downloadProof(operation.proof))) toast.error("No se pudo abrir el comprobante privado.");
    } finally {
      setOpening(null);
    }
  };

  const openDocument = async (type: StableDocumentType) => {
    const document = operation.documents.find((item) => item.type === type);
    if (!document || opening) return;
    setOpening(type);
    try {
      if (!(await downloadStableDocument(document))) toast.error("No se pudo abrir el documento privado.");
    } finally {
      setOpening(null);
    }
  };

  const upload = async (type: StableDocumentType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(type);
    try {
      await uploadOperationDocument(operation, type, file);
      toast.success(`${documentMeta[type].label} guardado correctamente`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el documento.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      <article className="rounded-2xl border border-[#071A2D]/9 bg-white p-3.5 shadow-[0_10px_28px_rgba(7,26,45,.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF0EC] text-[#D9563E]"><FileCheck2 className="h-4.5 w-4.5" /></div>
          {operation.proof && <button type="button" onClick={() => void openProof()} disabled={opening === "proof"} className="grid h-8 w-8 place-items-center rounded-lg border border-[#071A2D]/9 transition-all hover:border-[#0AA883] active:scale-95 disabled:opacity-60" aria-label="Abrir comprobante">{opening === "proof" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}</button>}
        </div>
        <p className="mt-3 text-xs font-semibold">Comprobante</p>
        <p className="mt-1 truncate text-[10px] text-[#071A2D]/45">{operation.proof?.name ?? "Pendiente del remitente"}</p>
        <span className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold", operation.proof ? "bg-[#E7FAF3] text-[#087F62]" : "bg-[#FFF4D8] text-[#A46600]")}>
          {operation.proof && <CheckCircle2 className="h-3 w-3" />}{operation.proof ? "Disponible" : "Pendiente"}
        </span>
      </article>

      {(["invoice", "contract"] as StableDocumentType[]).map((type) => {
        const document = operation.documents.find((item) => item.type === type);
        const busy = uploading === type;
        return (
          <article key={type} className="rounded-2xl border border-[#071A2D]/9 bg-white p-3.5 shadow-[0_10px_28px_rgba(7,26,45,.05)]">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF1FF] text-[#356DE5]"><FileText className="h-4.5 w-4.5" /></div>
              {document && <button type="button" onClick={() => void openDocument(type)} disabled={opening === type} className="grid h-8 w-8 place-items-center rounded-lg border border-[#071A2D]/9 transition-all hover:border-[#0AA883] active:scale-95 disabled:opacity-60" aria-label={`Abrir ${documentMeta[type].label}`}>{opening === type ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}</button>}
            </div>
            <p className="mt-3 text-xs font-semibold">{documentMeta[type].label}</p>
            <p className="mt-1 truncate text-[10px] text-[#071A2D]/45">{document?.name ?? documentMeta[type].hint}</p>
            {admin ? (
              <label className="mt-3 flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#071A2D]/10 bg-[#F6F8F6] text-[9px] font-semibold text-[#071A2D] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0AA883] hover:shadow-sm active:translate-y-0 active:scale-[.98] motion-reduce:transform-none">
                {busy ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}{busy ? "Guardando…" : document ? "Reemplazar PDF" : "Subir PDF"}
                <input type="file" accept="application/pdf" className="hidden" disabled={busy} onChange={(event) => void upload(type, event)} />
              </label>
            ) : (
              <span className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold", document ? "bg-[#E7FAF3] text-[#087F62]" : "bg-slate-100 text-slate-500")}>
                {document && <CheckCircle2 className="h-3 w-3" />}{document ? "Disponible" : "Pendiente de Patzi"}
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}
