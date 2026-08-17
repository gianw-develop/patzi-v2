"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase";

export type PaymentRail = "ACH" | "WIRE";
export type DepositStatus =
  | "waiting_payment"
  | "proof_submitted"
  | "verifying"
  | "payment_received"
  | "preparing"
  | "completed"
  | "correction_requested"
  | "blocked";

export interface LedgerProof {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface LedgerOperation {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  userEmail: string;
  depositDate: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderBank: string;
  declaredAmount: number;
  bankReceivedAmount?: number;
  bankFeeAmount?: number;
  patziFee: number;
  generatedUsdt: number;
  paymentRail: PaymentRail;
  accountId: string;
  status: DepositStatus;
  proof?: LedgerProof;
  adminNote?: string;
  createdAt: string;
}

export interface LedgerAccount {
  id: string;
  bank: string;
  holder: string;
  accountNumber: string;
  achEnabled: boolean;
  achRouting: string;
  wireEnabled: boolean;
  wireRouting: string;
  accountType: string;
  weeklyAvailable: number;
  utilization: number;
  available: boolean;
}

export interface LedgerWallet {
  id: string;
  userId: string;
  address: string;
  verified: boolean;
  verifiedAt?: string;
  updatedAt: string;
}

export interface LedgerPayout {
  id: string;
  userId: string;
  amount: number;
  walletAddress: string;
  proof: LedgerProof;
  requestId?: string;
  paidAt: string;
}

export interface LedgerPayoutRequest {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}

export interface LedgerBalance {
  credited: number;
  paid: number;
  available: number;
}

export interface DepositInput {
  amount: number;
  depositDate: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderBank: string;
  paymentRail: PaymentRail;
  accountId: string;
}

type LedgerMode = "user" | "admin";

interface DbCustomer {
  full_name: string;
  email: string;
}

interface DbOperation {
  id: string;
  reference: string;
  user_id: string;
  deposit_date: string;
  sender_legal_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  sender_bank_name: string | null;
  usd_amount: number | string;
  bank_received_amount: number | string | null;
  bank_fee_amount: number | string | null;
  settlement_fee_amount: number | string | null;
  settlement_delivery_amount: number | string | null;
  fee_amount: number | string;
  delivery_amount: number | string;
  payment_rail: PaymentRail;
  receiving_account_id: string;
  status: DepositStatus;
  proof_path: string | null;
  proof_name: string | null;
  proof_mime_type: string | null;
  proof_size: number | null;
  proof_uploaded_at: string | null;
  admin_note: string | null;
  created_at: string;
  customer: DbCustomer | DbCustomer[] | null;
}

interface DbAccount {
  account_id: string;
  bank_name: string | null;
  method_name: string;
  account_holder: string;
  account_number: string | null;
  ach_enabled: boolean;
  ach_routing_number: string | null;
  wire_enabled: boolean;
  wire_routing_number: string | null;
  account_type: string | null;
  weekly_available: number | string;
  utilization_percent: number | string;
  capacity_available: boolean;
}

interface DbWallet {
  id: string;
  user_id: string;
  address: string;
  is_verified: boolean;
  verified_at: string | null;
  updated_at: string;
}

interface DbPayout {
  id: string;
  user_id: string;
  amount: number | string;
  wallet_address: string;
  proof_path: string;
  proof_name: string;
  proof_mime_type: string;
  proof_size: number;
  payout_request_id: string | null;
  paid_at: string;
}

interface DbPayoutRequest {
  id: string;
  user_id: string;
  requested_amount: number | string;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
}

interface LedgerState {
  loading: boolean;
  error: string | null;
  stableEligible: boolean;
  kycVerified: boolean;
  operations: LedgerOperation[];
  accounts: LedgerAccount[];
  wallets: LedgerWallet[];
  payouts: LedgerPayout[];
  payoutRequests: LedgerPayoutRequest[];
  load: (mode?: LedgerMode) => Promise<void>;
  submitDeposit: (input: DepositInput, file: File) => Promise<void>;
  uploadDepositProof: (operationId: string, file: File) => Promise<void>;
  approveDeposit: (operationId: string, actualReceived: number) => Promise<void>;
  rejectDeposit: (operationId: string, reason?: string) => Promise<void>;
  saveWallet: (address: string) => Promise<void>;
  verifyWallet: (userId: string, verified: boolean) => Promise<void>;
  requestPayout: (amount: number) => Promise<void>;
  recordPayout: (userId: string, amount: number, file: File, requestId?: string) => Promise<void>;
}

const operationSelect = `
  *,
  customer:profiles!stable_operations_user_id_fkey(full_name, email)
`;

function customerOf(value: DbCustomer | DbCustomer[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function mapOperation(row: DbOperation): LedgerOperation {
  const customer = customerOf(row.customer);
  const actual = row.bank_received_amount == null ? undefined : Number(row.bank_received_amount);
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    userName: customer?.full_name ?? "Cliente Patzi",
    userEmail: customer?.email ?? "",
    depositDate: row.deposit_date,
    senderName: row.sender_legal_name ?? "Remitente no registrado",
    senderEmail: row.sender_email ?? "",
    senderPhone: row.sender_phone ?? "",
    senderBank: row.sender_bank_name ?? "No registrado",
    declaredAmount: Number(row.usd_amount),
    bankReceivedAmount: actual,
    bankFeeAmount: row.bank_fee_amount == null ? undefined : Number(row.bank_fee_amount),
    patziFee: Number(row.settlement_fee_amount ?? row.fee_amount),
    generatedUsdt: Number(row.settlement_delivery_amount ?? row.delivery_amount),
    paymentRail: row.payment_rail,
    accountId: row.receiving_account_id,
    status: row.status,
    proof: row.proof_path && row.proof_name && row.proof_mime_type && row.proof_uploaded_at
      ? {
          path: row.proof_path,
          name: row.proof_name,
          mimeType: row.proof_mime_type,
          size: row.proof_size ?? 0,
          uploadedAt: row.proof_uploaded_at,
        }
      : undefined,
    adminNote: row.admin_note ?? undefined,
    createdAt: row.created_at,
  };
}

function mapAccount(row: DbAccount): LedgerAccount {
  return {
    id: row.account_id,
    bank: row.bank_name ?? row.method_name,
    holder: row.account_holder,
    accountNumber: row.account_number ?? "",
    achEnabled: row.ach_enabled,
    achRouting: row.ach_routing_number ?? "",
    wireEnabled: row.wire_enabled,
    wireRouting: row.wire_routing_number ?? "",
    accountType: row.account_type ?? "Checking",
    weeklyAvailable: Number(row.weekly_available),
    utilization: Number(row.utilization_percent),
    available: row.capacity_available,
  };
}

function mapWallet(row: DbWallet): LedgerWallet {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address,
    verified: row.is_verified,
    verifiedAt: row.verified_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

function mapPayout(row: DbPayout): LedgerPayout {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    walletAddress: row.wallet_address,
    proof: {
      path: row.proof_path,
      name: row.proof_name,
      mimeType: row.proof_mime_type,
      size: row.proof_size,
      uploadedAt: row.paid_at,
    },
    requestId: row.payout_request_id ?? undefined,
    paidAt: row.paid_at,
  };
}

function validateProof(file: File, maxMb = 10) {
  const allowed = ["application/pdf", "image/png", "image/jpeg"];
  if (!allowed.includes(file.type)) throw new Error("El comprobante debe ser PDF, JPG o PNG.");
  if (file.size <= 0 || file.size > maxMb * 1024 * 1024) {
    throw new Error(`El comprobante debe pesar menos de ${maxMb} MB.`);
  }
}

async function session() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  return { supabase, user };
}

export function balanceFor(
  operations: LedgerOperation[],
  payouts: LedgerPayout[],
  userId: string,
): LedgerBalance {
  const creditStatuses: DepositStatus[] = ["payment_received", "preparing", "completed"];
  const credited = operations
    .filter((item) => item.userId === userId && creditStatuses.includes(item.status) && item.bankReceivedAmount != null)
    .reduce((sum, item) => sum + item.generatedUsdt, 0);
  const paid = payouts
    .filter((item) => item.userId === userId)
    .reduce((sum, item) => sum + item.amount, 0);
  return {
    credited: Math.round(credited * 100) / 100,
    paid: Math.round(paid * 100) / 100,
    available: Math.round((credited - paid) * 100) / 100,
  };
}

export const useStableLedgerStore = create<LedgerState>((set, get) => ({
  loading: true,
  error: null,
  stableEligible: false,
  kycVerified: false,
  operations: [],
  accounts: [],
  wallets: [],
  payouts: [],
  payoutRequests: [],

  load: async () => {
    const firstLoad = get().loading && get().operations.length === 0;
    set({ error: null, ...(firstLoad ? { loading: true } : {}) });
    try {
      const { supabase, user } = await session();
      const [profile, operations, accounts, wallets, payouts, requests] = await Promise.all([
        supabase.from("profiles").select("stable_eligible,kyc_status").eq("id", user.id).single(),
        supabase.from("stable_operations").select(operationSelect).order("deposit_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.rpc("get_stable_receiving_accounts"),
        supabase.from("stable_wallets").select("*").order("updated_at", { ascending: false }),
        supabase.from("stable_payouts").select("*").order("paid_at", { ascending: false }),
        supabase.from("stable_payout_requests").select("*").order("created_at", { ascending: false }),
      ]);

      for (const result of [profile, operations, accounts, wallets, payouts, requests]) {
        if (result.error) throw result.error;
      }

      set({
        loading: false,
        stableEligible: Boolean(profile.data?.stable_eligible),
        kycVerified: profile.data?.kyc_status === "approved",
        operations: ((operations.data ?? []) as unknown as DbOperation[]).map(mapOperation),
        accounts: ((accounts.data ?? []) as unknown as DbAccount[]).map(mapAccount),
        wallets: ((wallets.data ?? []) as unknown as DbWallet[]).map(mapWallet),
        payouts: ((payouts.data ?? []) as unknown as DbPayout[]).map(mapPayout),
        payoutRequests: ((requests.data ?? []) as unknown as DbPayoutRequest[]).map((row) => ({
          id: row.id,
          userId: row.user_id,
          amount: Number(row.requested_amount),
          status: row.status,
          createdAt: row.created_at,
        })),
      });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "No se pudo cargar Patzi Stable." });
    }
  },

  submitDeposit: async (input, file) => {
    validateProof(file, 10);
    const { supabase } = await session();
    const { data, error } = await supabase.rpc("create_stable_deposit", {
      p_usd_amount: input.amount,
      p_deposit_date: input.depositDate,
      p_sender_legal_name: input.senderName.trim(),
      p_sender_email: input.senderEmail.trim().toLowerCase(),
      p_sender_phone: input.senderPhone.trim(),
      p_sender_bank_name: input.senderBank.trim(),
      p_payment_rail: input.paymentRail,
      p_receiving_account_id: input.accountId,
    });
    if (error || !data?.id) throw error ?? new Error("No se pudo registrar el depósito.");
    try {
      await get().uploadDepositProof(data.id, file);
    } catch (uploadError) {
      await get().load("user");
      throw new Error(`El depósito ${data.reference} quedó guardado, pero falta subir el comprobante. ${uploadError instanceof Error ? uploadError.message : ""}`.trim());
    }
  },

  uploadDepositProof: async (operationId, file) => {
    validateProof(file, 10);
    const { supabase, user } = await session();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${operationId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("stable-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase.from("stable_operations").update({
      proof_path: path,
      proof_name: file.name,
      proof_mime_type: file.type,
      proof_size: file.size,
      proof_uploaded_at: new Date().toISOString(),
      status: "proof_submitted",
    }).eq("id", operationId);

    if (updateError) {
      await supabase.storage.from("stable-proofs").remove([path]);
      throw updateError;
    }
    await get().load("user");
  },

  approveDeposit: async (operationId, actualReceived) => {
    const { supabase } = await session();
    const { error } = await supabase.rpc("admin_approve_stable_deposit", {
      p_operation_id: operationId,
      p_bank_received_amount: actualReceived,
    });
    if (error) throw error;
    await get().load("admin");
  },

  rejectDeposit: async (operationId, reason) => {
    const { supabase } = await session();
    const { error } = await supabase.rpc("admin_reject_stable_deposit", {
      p_operation_id: operationId,
      p_reason: reason?.trim() || null,
    });
    if (error) throw error;
    await get().load("admin");
  },

  saveWallet: async (address) => {
    const { supabase } = await session();
    const { error } = await supabase.rpc("set_stable_wallet", { p_address: address.trim() });
    if (error) throw error;
    await get().load("user");
  },

  verifyWallet: async (userId, verified) => {
    const { supabase } = await session();
    const { error } = await supabase.rpc("admin_verify_stable_wallet", {
      p_user_id: userId,
      p_verified: verified,
    });
    if (error) throw error;
    await get().load("admin");
  },

  requestPayout: async (amount) => {
    const { supabase } = await session();
    const { error } = await supabase.rpc("request_stable_payout", { p_amount: amount });
    if (error) throw error;
    await get().load("user");
  },

  recordPayout: async (userId, amount, file, requestId) => {
    validateProof(file, 10);
    const { supabase } = await session();
    const key = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${userId}/${key}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("stable-payout-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { error } = await supabase.rpc("admin_record_stable_payout", {
      p_user_id: userId,
      p_amount: amount,
      p_proof_path: path,
      p_proof_name: file.name,
      p_proof_mime_type: file.type,
      p_proof_size: file.size,
      p_payout_request_id: requestId ?? null,
    });
    if (error) {
      await supabase.storage.from("stable-payout-proofs").remove([path]);
      throw error;
    }
    await get().load("admin");
  },
}));

export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUsdt(value: number) {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} USDT`;
}

export function maskWallet(address: string) {
  return address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Sin wallet";
}

async function signedFileUrl(bucket: string, path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("No se pudo abrir el comprobante.");
  return data.signedUrl;
}

export function getDepositProofUrl(proof: LedgerProof) {
  return signedFileUrl("stable-proofs", proof.path);
}

export function getPayoutProofUrl(proof: LedgerProof) {
  return signedFileUrl("stable-payout-proofs", proof.path);
}
