"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { CheckCircle2, Download, Eye, FileText, LoaderCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

type DocumentType = "invoice" | "contract";

interface StoredDocument {
  id: string;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  file_size: number;
  updated_at: string;
}

const meta: Record<DocumentType, { label: string; hint: string }> = {
  invoice: { label: "Factura", hint: "Documento de facturación" },
  contract: { label: "Contrato", hint: "Acuerdo firmado de la operación" },
};

export default function LedgerOperationDocuments({
  operationId,
  userId,
  admin = false,
}: {
  operationId: string;
  userId: string;
  admin?: boolean;
}) {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stable_operation_documents")
      .select("id,document_type,storage_path,file_name,file_size,updated_at")
      .eq("operation_id", operationId)
      .order("document_type");
    if (error) throw error;
    setDocuments((data ?? []) as StoredDocument[]);
  }, [operationId]);

  useEffect(() => {
    let active = true;
    void refresh()
      .catch((error) => active && toast.error(error instanceof Error ? error.message : t("No se pudieron cargar los documentos.")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refresh, t]);

  const open = async (document: StoredDocument) => {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("stable-documents").createSignedUrl(document.storage_path, 300);
    if (error || !data?.signedUrl) return toast.error(t("No se pudo abrir el documento privado."));
    setPreview({ name: document.file_name, url: data.signedUrl });
  };

  const download = async (document: StoredDocument) => {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("stable-documents")
      .createSignedUrl(document.storage_path, 300, { download: document.file_name });
    if (error || !data?.signedUrl) return toast.error(t("No se pudo descargar el documento privado."));
    window.location.assign(data.signedUrl);
  };

  const upload = async (type: DocumentType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error(t("La factura o contrato debe ser PDF."));
    if (file.size > 10 * 1024 * 1024) return toast.error(t("El PDF supera el límite de 10 MB."));

    setUploading(type);
    const supabase = createClient();
    const previous = documents.find((item) => item.document_type === type);
    const path = `${userId}/${operationId}/${type}-${Date.now()}.pdf`;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(t("Tu sesión ha caducado."));
      const { error: storageError } = await supabase.storage
        .from("stable-documents")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (storageError) throw storageError;

      const { error: rowError } = await supabase.from("stable_operation_documents").upsert({
        operation_id: operationId,
        document_type: type,
        storage_path: path,
        file_name: file.name,
        mime_type: "application/pdf",
        file_size: file.size,
        uploaded_by: auth.user.id,
      }, { onConflict: "operation_id,document_type" });
      if (rowError) {
        await supabase.storage.from("stable-documents").remove([path]);
        throw rowError;
      }
      if (previous?.storage_path && previous.storage_path !== path) {
        await supabase.storage.from("stable-documents").remove([previous.storage_path]);
      }
      await refresh();
      toast.success(`${t(meta[type].label)} ${t("guardado correctamente.")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar el documento."));
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="grid min-h-40 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin text-[#0AA883]" /></div>;

  return <>
    <div className="grid gap-3 sm:grid-cols-2">
      {(["invoice", "contract"] as DocumentType[]).map((type) => {
        const document = documents.find((item) => item.document_type === type);
        const busy = uploading === type;
        return <article key={type} className="rounded-2xl border border-[#071A2D]/8 bg-white p-4 shadow-[0_12px_30px_rgba(7,26,45,.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF1FF] text-[#356DE5]"><FileText className="h-5 w-5" /></div>
            {document && <div className="flex gap-2"><button type="button" onClick={() => void open(document)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#071A2D]/9 px-3 text-xs font-semibold"><Eye className="h-4 w-4" />{t("Abrir")}</button><button type="button" onClick={() => void download(document)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#071A2D]/9" aria-label={`${t("Descargar")} ${t(meta[type].label)}`}><Download className="h-4 w-4" /></button></div>}
          </div>
          <p className="mt-4 text-sm font-semibold">{t(meta[type].label)}</p>
          <p className="mt-1 truncate text-xs text-[#071A2D]/45">{document?.file_name ?? t(meta[type].hint)}</p>
          {document && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E7FAF3] px-2.5 py-1 text-[10px] font-semibold text-[#087F62]"><CheckCircle2 className="h-3 w-3" />{t("Disponible para el cliente")}</span>}
          {admin ? <label className="mt-4 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#071A2D]/10 bg-[#F7F9F7] text-xs font-semibold transition hover:border-[#0AA883]">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{busy ? t("Guardando…") : document ? t("Reemplazar PDF") : t("Subir PDF")}
            <input type="file" accept="application/pdf" disabled={busy} className="hidden" onChange={(event) => void upload(type, event)} />
          </label> : !document && <span className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{t("Pendiente de Patzi")}</span>}
        </article>;
      })}
    </div>

    {preview && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#071A2D]/45 p-3 backdrop-blur-sm" onMouseDown={() => setPreview(null)}>
      <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex h-14 items-center justify-between border-b px-4"><b className="truncate text-sm">{preview.name}</b><button onClick={() => setPreview(null)} className="grid h-9 w-9 place-items-center rounded-lg border"><X className="h-4 w-4" /></button></div>
        <iframe title={preview.name} src={preview.url} className="h-[calc(90vh-3.5rem)] w-full bg-[#EDF1EE]" />
      </div>
    </div>}
  </>;
}
