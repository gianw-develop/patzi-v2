import { create } from "zustand";
import { createClient } from "@/lib/supabase";

export type DepositStatus = "pending" | "approved" | "rejected";
type DepositMode = "user" | "admin";

export interface DepositRequest {
  id: string;
  user_id: string;
  user_name: string;
  currency: "EUR" | "USD";
  amount: number;
  method: "bank" | "mobile";
  method_label: string;
  proof_file_name: string;
  proof_path: string;
  proof_data_url: string;
  status: DepositStatus;
  admin_note?: string;
  created_at: string;
  reviewed_at?: string;
}

interface DepositState {
  mode: DepositMode;
  requests: DepositRequest[];
  loading: boolean;
  loadRequests: (mode?: DepositMode) => Promise<void>;
  addRequest: (input: {
    currency: "EUR" | "USD";
    amount: number;
    method: "bank" | "mobile";
    method_label: string;
    file: File;
    payment_account_id?: string;
  }) => Promise<void>;
  updateStatus: (id: string, status: DepositStatus, note?: string) => Promise<void>;
}

interface DbDeposit {
  id: string;
  user_id: string;
  currency: "EUR" | "USD";
  amount: number | string;
  method: "bank" | "mobile";
  method_label: string;
  proof_file_name: string;
  proof_path: string;
  status: DepositStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  customer: { full_name: string } | { full_name: string }[] | null;
}

async function sessionClient() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Tu sesión ha caducado.");
  return { supabase, user };
}

export const useDepositStore = create<DepositState>((set, get) => ({
  mode: "user",
  requests: [],
  loading: true,

  loadRequests: async (requestedMode) => {
    const mode = requestedMode ?? get().mode;
    set({ loading: true, mode });
    const { supabase } = await sessionClient();
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("*, customer:profiles!deposit_requests_user_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    if (error) { set({ loading: false }); throw error; }

    const mapped = await Promise.all(((data ?? []) as unknown as DbDeposit[]).map(async (row) => {
      const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
      const signed = await supabase.storage.from("deposit-proofs").createSignedUrl(row.proof_path, 300);
      return {
        id: row.id,
        user_id: row.user_id,
        user_name: customer?.full_name ?? "Cliente Patzi",
        currency: row.currency,
        amount: Number(row.amount),
        method: row.method,
        method_label: row.method_label,
        proof_file_name: row.proof_file_name,
        proof_path: row.proof_path,
        proof_data_url: signed.data?.signedUrl ?? "",
        status: row.status,
        admin_note: row.admin_note ?? undefined,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at ?? undefined,
      } satisfies DepositRequest;
    }));

    set({ requests: mapped, loading: false });
  },

  addRequest: async ({ currency, amount, method, method_label, file, payment_account_id }) => {
    if (file.size > 5 * 1024 * 1024) throw new Error("El comprobante supera 5 MB.");
    const { supabase, user } = await sessionClient();
    const requestId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${requestId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("deposit-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { error } = await supabase.from("deposit_requests").insert({
      id: requestId,
      user_id: user.id,
      payment_account_id: payment_account_id ?? null,
      currency,
      amount,
      method,
      method_label,
      proof_path: path,
      proof_file_name: file.name,
    });
    if (error) {
      await supabase.storage.from("deposit-proofs").remove([path]);
      throw error;
    }
    await get().loadRequests("user");
  },

  updateStatus: async (id, status, note) => {
    const { supabase } = await sessionClient();
    const { error } = await supabase
      .from("deposit_requests")
      .update({ status, admin_note: note ?? null })
      .eq("id", id);
    if (error) throw error;
    await get().loadRequests("admin");
  },
}));
