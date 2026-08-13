import { create } from "zustand";
import { createClient } from "@/lib/supabase";
import type { Transfer, TransferStatus } from "@/types";

type TransferMode = "user" | "admin";

interface DbTransferHistory {
  status: TransferStatus;
  note: string | null;
  created_at: string;
}

interface DbTransfer extends Omit<Transfer, "status_history" | "send_amount" | "receive_amount" | "exchange_rate" | "fee" | "total_charged"> {
  send_amount: number | string;
  receive_amount: number | string;
  exchange_rate: number | string;
  fee: number | string;
  total_charged: number | string;
  customer: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  status_history: DbTransferHistory[] | null;
}

export interface CreateRemittanceInput {
  beneficiaryId: string;
  sendCurrency: "EUR" | "USD";
  sendAmount: number;
  quotedExchangeRate: number;
}

interface TransferState {
  mode: TransferMode;
  transfers: Transfer[];
  loading: boolean;
  loadTransfers: (mode?: TransferMode) => Promise<void>;
  addTransfer: (input: CreateRemittanceInput) => Promise<Transfer>;
  updateStatus: (id: string, status: TransferStatus, note?: string) => Promise<void>;
  completeWithProof: (id: string, file: File, note?: string) => Promise<void>;
}

function firstCustomer(customer: DbTransfer["customer"]) {
  return Array.isArray(customer) ? customer[0] ?? null : customer;
}

function mapTransfer(row: DbTransfer): Transfer {
  const customer = firstCustomer(row.customer);
  return {
    ...row,
    send_amount: Number(row.send_amount),
    receive_amount: Number(row.receive_amount),
    exchange_rate: Number(row.exchange_rate),
    fee: Number(row.fee),
    total_charged: Number(row.total_charged),
    status_history: (row.status_history ?? [])
      .map((entry) => ({ status: entry.status, timestamp: entry.created_at, note: entry.note ?? undefined }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    customer_name: customer?.full_name,
    customer_email: customer?.email,
  };
}

async function authenticatedClient() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Tu sesión ha caducado.");
  return { supabase, user };
}

const transferSelect = `
  *,
  customer:profiles!transfers_user_id_fkey(full_name, email),
  status_history:transfer_status_history(status, note, created_at)
`;

export const useTransferStore = create<TransferState>((set, get) => ({
  mode: "user",
  transfers: [],
  loading: true,

  loadTransfers: async (requestedMode) => {
    const mode = requestedMode ?? get().mode;
    set({ loading: true, mode });
    const { supabase } = await authenticatedClient();
    const { data, error } = await supabase
      .from("transfers")
      .select(transferSelect)
      .order("created_at", { ascending: false });
    if (error) { set({ loading: false }); throw error; }
    set({ transfers: ((data ?? []) as unknown as DbTransfer[]).map(mapTransfer), loading: false });
  },

  addTransfer: async (input) => {
    const { supabase } = await authenticatedClient();
    const { data, error } = await supabase.rpc("create_remittance_request", {
      p_beneficiary_id: input.beneficiaryId, p_send_currency: input.sendCurrency,
      p_send_amount: input.sendAmount, p_quoted_exchange_rate: input.quotedExchangeRate,
    });
    if (error || !data) throw error ?? new Error("No se pudo crear la remesa.");
    const createdRow = Array.isArray(data) ? data[0] : data;
    await get().loadTransfers("user");
    const created = get().transfers.find((item) => item.id === createdRow.id);
    if (!created) throw new Error("La remesa se creó, pero no pudo cargarse.");
    return created;
  },

  updateStatus: async (id, status, note) => {
    const { supabase } = await authenticatedClient();
    const { error } = await supabase
      .from("transfers")
      .update({ status, ...(note ? { admin_note: note } : {}) })
      .eq("id", id);
    if (error) throw error;
    await get().loadTransfers("admin");
  },

  completeWithProof: async (id, file, note) => {
    if (file.size > 5 * 1024 * 1024) throw new Error("El comprobante supera 5 MB.");
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      throw new Error("El comprobante debe ser PDF, PNG, JPG o WEBP.");
    }
    const { supabase } = await authenticatedClient();
    const transfer = get().transfers.find((item) => item.id === id);
    if (!transfer) throw new Error("No encontramos la remesa.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${transfer.user_id}/${id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("remittance-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const previousPath = transfer.proof_url;
    const { error } = await supabase
      .from("transfers")
      .update({ status: "completed", proof_url: path, proof_note: note ?? null })
      .eq("id", id);
    if (error) {
      await supabase.storage.from("remittance-proofs").remove([path]);
      throw error;
    }
    if (previousPath && previousPath !== path) {
      await supabase.storage.from("remittance-proofs").remove([previousPath]);
    }
    await get().loadTransfers("admin");
  },
}));

export async function signedRemittanceProof(path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("remittance-proofs").createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
