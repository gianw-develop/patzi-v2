"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase";

export type StableAsset = "USDT" | "USDC";
export type StablePaymentRail = "ACH" | "WIRE";
export type StableStatus =
  | "waiting_payment"
  | "proof_submitted"
  | "verifying"
  | "payment_received"
  | "preparing"
  | "completed"
  | "correction_requested"
  | "blocked";

export type OperationRisk = "low" | "medium" | "high";
export type StableSenderType = "person" | "business";
export type StableDocumentType = "invoice" | "contract";
type StableMode = "user" | "admin";

export interface StableProof {
  name: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
}

export interface StableSender {
  id: string;
  userId: string;
  type: StableSenderType;
  legalName: string;
  email: string;
  phone: string;
  bankName?: string;
  accountLast4?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StableDocument {
  id: string;
  type: StableDocumentType;
  path: string;
  name: string;
  mimeType: "application/pdf";
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export type StableSenderInput = {
  type: StableSenderType;
  legalName: string;
  email: string;
  phone: string;
  bankName?: string;
  accountLast4?: string;
};

export interface StableHistoryEntry {
  id: string;
  status: StableStatus;
  label: string;
  actor: string;
  createdAt: string;
}

export interface StableOperation {
  id: string;
  reference: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerKycStatus: "not_submitted" | "pending" | "approved" | "rejected";
  customerStableEligible: boolean;
  senderId?: string;
  senderType?: StableSenderType;
  senderLegalName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderBankName?: string;
  senderAccountLast4?: string;
  senderConfirmedAt?: string;
  usdAmount: number;
  quotedFeeAmount: number;
  quotedDeliveryAmount: number;
  bankReceivedAmount?: number;
  bankFeeAmount?: number;
  feeAmount: number;
  asset: StableAsset;
  deliveryAmount: number;
  network: "Ethereum · ERC-20";
  walletAddress: string;
  paymentRail: StablePaymentRail;
  accountId: string;
  status: StableStatus;
  risk: OperationRisk;
  proof?: StableProof;
  documents: StableDocument[];
  txHash?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  history: StableHistoryEntry[];
}

export interface ReceivingAccount {
  id: string;
  bank: string;
  holder: string;
  accountNumber: string;
  achEnabled: boolean;
  achRoutingNumber: string;
  wireEnabled: boolean;
  wireRoutingNumber: string;
  accountType: string;
  label: string;
  instructions?: string;
  active: boolean;
  weeklyLimit: number;
  weeklyUsed: number;
  weeklyAvailable: number;
  utilizationPercent: number;
  capacityAvailable: boolean;
  weekStartsAt: string;
  weekEndsAt: string;
}

export interface StableCapacitySummary {
  paymentRail: StablePaymentRail;
  available: boolean;
  weekEndsAt: string;
}

interface DbCustomer {
  id: string;
  full_name: string;
  email: string;
  kyc_status: "not_submitted" | "pending" | "approved" | "rejected";
  stable_eligible: boolean;
}

interface DbStableSender {
  id: string;
  user_id: string;
  sender_type: StableSenderType;
  legal_name: string;
  email: string;
  phone: string;
  bank_name: string | null;
  account_last4: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbStableDocument {
  id: string;
  document_type: StableDocumentType;
  storage_path: string;
  file_name: string;
  mime_type: "application/pdf";
  file_size: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

interface DbHistory {
  id: string;
  status: StableStatus;
  label: string;
  actor_name: string;
  created_at: string;
}

interface DbStableOperation {
  id: string;
  reference: string;
  user_id: string;
  usd_amount: number | string;
  fee_amount: number | string;
  bank_received_amount: number | string | null;
  bank_fee_amount: number | string | null;
  settlement_fee_amount: number | string | null;
  settlement_delivery_amount: number | string | null;
  asset: StableAsset;
  delivery_amount: number | string;
  wallet_address: string;
  payment_rail: StablePaymentRail;
  receiving_account_id: string;
  status: StableStatus;
  risk: OperationRisk;
  proof_path: string | null;
  proof_name: string | null;
  proof_mime_type: string | null;
  proof_size: number | null;
  proof_uploaded_at: string | null;
  tx_hash: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  sender_id: string | null;
  sender_type: StableSenderType | null;
  sender_legal_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  sender_bank_name: string | null;
  sender_account_last4: string | null;
  sender_confirmed_at: string | null;
  customer: DbCustomer | DbCustomer[] | null;
  history: DbHistory[] | null;
  documents: DbStableDocument[] | null;
}

interface DbPaymentAccount {
  account_id: string;
  bank_name: string | null;
  account_holder: string;
  account_number: string | null;
  ach_enabled: boolean;
  ach_routing_number: string | null;
  wire_enabled: boolean;
  wire_routing_number: string | null;
  account_type: string | null;
  method_name: string;
  instructions: string | null;
  is_active: boolean;
  weekly_limit: number | string;
  weekly_used: number | string;
  weekly_available: number | string;
  utilization_percent: number | string;
  capacity_available: boolean;
  week_starts_at: string;
  week_ends_at: string;
}

interface DbCapacitySummary {
  payment_rail: StablePaymentRail;
  capacity_available: boolean;
  week_ends_at: string;
}

interface StableState {
  mode: StableMode;
  loading: boolean;
  error: string | null;
  stableEligible: boolean;
  kycVerified: boolean;
  operations: StableOperation[];
  senders: StableSender[];
  accounts: ReceivingAccount[];
  capacity: StableCapacitySummary[];
  load: (mode?: StableMode) => Promise<void>;
  setStableEligible: (userId: string, eligible: boolean) => Promise<void>;
  addSender: (input: StableSenderInput) => Promise<StableSender>;
  updateSender: (senderId: string, input: StableSenderInput & { active?: boolean }) => Promise<void>;
  addOperation: (input: { usdAmount: number; asset: StableAsset; walletAddress: string; paymentRail: StablePaymentRail; senderId: string; senderAccountConfirmed: boolean }) => Promise<StableOperation>;
  attachSender: (operationId: string, senderId: string, senderAccountConfirmed: boolean) => Promise<StableOperation>;
  uploadProof: (operationId: string, file: File) => Promise<void>;
  uploadOperationDocument: (operation: StableOperation, type: StableDocumentType, file: File) => Promise<void>;
  updateStatus: (operationId: string, status: StableStatus, label: string, actor?: string, note?: string) => Promise<void>;
  reconcileOperation: (operationId: string, bankReceivedAmount: number) => Promise<void>;
  setTransactionHash: (operationId: string, txHash: string) => Promise<void>;
  assignAccount: (operationId: string, accountId: string) => Promise<void>;
  deleteOperation: (operationId: string) => Promise<{ storageCleanupPending: boolean }>;
}

const operationSelect = `
  *,
  customer:profiles!stable_operations_user_id_fkey(
    id, full_name, email, kyc_status, stable_eligible
  ),
  history:stable_operation_history(
    id, status, label, actor_name, created_at
  ),
  documents:stable_operation_documents(
    id, document_type, storage_path, file_name, mime_type, file_size, uploaded_by, created_at, updated_at
  )
`;

function oneCustomer(customer: DbCustomer | DbCustomer[] | null): DbCustomer | null {
  if (Array.isArray(customer)) return customer[0] ?? null;
  return customer;
}

function mapSender(row: DbStableSender): StableSender {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.sender_type,
    legalName: row.legal_name,
    email: row.email,
    phone: row.phone,
    bankName: row.bank_name ?? undefined,
    accountLast4: row.account_last4 ?? undefined,
    active: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOperation(row: DbStableOperation): StableOperation {
  const customer = oneCustomer(row.customer);
  const quotedFeeAmount = Number(row.fee_amount);
  const quotedDeliveryAmount = Number(row.delivery_amount);
  const bankReceivedAmount = row.bank_received_amount == null ? undefined : Number(row.bank_received_amount);
  const settlementFeeAmount = row.settlement_fee_amount == null ? undefined : Number(row.settlement_fee_amount);
  const settlementDeliveryAmount = row.settlement_delivery_amount == null ? undefined : Number(row.settlement_delivery_amount);
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    customerName: customer?.full_name ?? "Cliente Patzi",
    customerEmail: customer?.email ?? "",
    customerKycStatus: customer?.kyc_status ?? "not_submitted",
    customerStableEligible: customer?.stable_eligible ?? false,
    senderId: row.sender_id ?? undefined,
    senderType: row.sender_type ?? undefined,
    senderLegalName: row.sender_legal_name ?? undefined,
    senderEmail: row.sender_email ?? undefined,
    senderPhone: row.sender_phone ?? undefined,
    senderBankName: row.sender_bank_name ?? undefined,
    senderAccountLast4: row.sender_account_last4 ?? undefined,
    senderConfirmedAt: row.sender_confirmed_at ?? undefined,
    usdAmount: Number(row.usd_amount),
    quotedFeeAmount,
    quotedDeliveryAmount,
    bankReceivedAmount,
    bankFeeAmount: row.bank_fee_amount == null ? undefined : Number(row.bank_fee_amount),
    feeAmount: settlementFeeAmount ?? quotedFeeAmount,
    asset: row.asset,
    deliveryAmount: settlementDeliveryAmount ?? quotedDeliveryAmount,
    network: "Ethereum · ERC-20",
    walletAddress: row.wallet_address,
    paymentRail: row.payment_rail,
    accountId: row.receiving_account_id,
    status: row.status,
    risk: row.risk,
    proof: row.proof_path && row.proof_name && row.proof_mime_type && row.proof_uploaded_at
      ? {
          path: row.proof_path,
          name: row.proof_name,
          mimeType: row.proof_mime_type,
          size: row.proof_size ?? 0,
          uploadedAt: row.proof_uploaded_at,
        }
      : undefined,
    documents: (row.documents ?? []).map((document) => ({
      id: document.id,
      type: document.document_type,
      path: document.storage_path,
      name: document.file_name,
      mimeType: document.mime_type,
      size: document.file_size,
      uploadedBy: document.uploaded_by,
      uploadedAt: document.updated_at ?? document.created_at,
    })),
    txHash: row.tx_hash ?? undefined,
    adminNote: row.admin_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: (row.history ?? [])
      .map((entry) => ({
        id: entry.id,
        status: entry.status,
        label: entry.label,
        actor: entry.actor_name,
        createdAt: entry.created_at,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function mapAccount(row: DbPaymentAccount): ReceivingAccount {
  const lastFour = row.account_number?.replace(/\s/g, "").slice(-4) ?? "—";
  return {
    id: row.account_id,
    bank: row.bank_name ?? row.method_name,
    holder: row.account_holder,
    accountNumber: row.account_number ?? "",
    achEnabled: row.ach_enabled,
    achRoutingNumber: row.ach_routing_number ?? "",
    wireEnabled: row.wire_enabled,
    wireRoutingNumber: row.wire_routing_number ?? "",
    accountType: row.account_type ?? "",
    label: `${row.bank_name ?? row.method_name} · ${lastFour}`,
    instructions: row.instructions ?? undefined,
    active: row.is_active,
    weeklyLimit: Number(row.weekly_limit),
    weeklyUsed: Number(row.weekly_used),
    weeklyAvailable: Number(row.weekly_available),
    utilizationPercent: Number(row.utilization_percent),
    capacityAvailable: row.capacity_available,
    weekStartsAt: row.week_starts_at,
    weekEndsAt: row.week_ends_at,
  };
}

async function currentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  return { supabase, user };
}

export const STABLE_STATUS: Record<StableStatus, { label: string; tone: string }> = {
  waiting_payment: { label: "Esperando pago", tone: "waiting" },
  proof_submitted: { label: "Comprobante enviado", tone: "verification" },
  verifying: { label: "Verificando comprobante", tone: "verification" },
  payment_received: { label: "Pago recibido", tone: "received" },
  preparing: { label: "Preparando stablecoin", tone: "preparing" },
  completed: { label: "Completada", tone: "completed" },
  correction_requested: { label: "Corrección requerida", tone: "blocked" },
  blocked: { label: "Bloqueada", tone: "blocked" },
};

export const useStableStore = create<StableState>((set, get) => ({
  mode: "user",
  loading: true,
  error: null,
  stableEligible: false,
  kycVerified: false,
  operations: [],
  senders: [],
  accounts: [],
  capacity: [],

  load: async (requestedMode) => {
    const mode = requestedMode ?? get().mode;
    const firstLoad = get().loading && get().operations.length === 0 && get().senders.length === 0 && get().accounts.length === 0;
    set({ error: null, mode, ...(firstLoad ? { loading: true } : {}) });
    try {
      const { supabase, user } = await currentUser();
      const [profileResult, operationsResult, sendersResult, accountsResult, capacityResult] = await Promise.all([
        supabase.from("profiles").select("stable_eligible, kyc_status").eq("id", user.id).single(),
        supabase.from("stable_operations").select(operationSelect).order("created_at", { ascending: false }),
        supabase.from("stable_senders").select("*").order("legal_name", { ascending: true }),
        supabase.rpc("get_stable_receiving_accounts"),
        supabase.rpc("get_stable_capacity_summary"),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (operationsResult.error) throw operationsResult.error;
      if (sendersResult.error) throw sendersResult.error;
      if (accountsResult.error) throw accountsResult.error;
      if (capacityResult.error) throw capacityResult.error;

      set({
        stableEligible: Boolean(profileResult.data?.stable_eligible),
        kycVerified: profileResult.data?.kyc_status === "approved",
        operations: ((operationsResult.data ?? []) as unknown as DbStableOperation[]).map(mapOperation),
        senders: ((sendersResult.data ?? []) as unknown as DbStableSender[]).map(mapSender),
        accounts: ((accountsResult.data ?? []) as unknown as DbPaymentAccount[]).map(mapAccount),
        capacity: ((capacityResult.data ?? []) as unknown as DbCapacitySummary[]).map((row) => ({
          paymentRail: row.payment_rail,
          available: row.capacity_available,
          weekEndsAt: row.week_ends_at,
        })),
        loading: false,
      });
    } catch (loadError) {
      set({ loading: false, error: loadError instanceof Error ? loadError.message : "No se pudieron cargar las operaciones." });
    }
  },

  setStableEligible: async (userId, eligible) => {
    const { supabase } = await currentUser();
    const { error } = await supabase.rpc("admin_update_user_access", {
      target_user_id: userId,
      new_stable_eligible: eligible,
    });
    if (error) throw error;
    await get().load("admin");
  },

  addSender: async (input) => {
    const { supabase, user } = await currentUser();
    const { data, error } = await supabase
      .from("stable_senders")
      .insert({
        user_id: user.id,
        sender_type: input.type,
        legal_name: input.legalName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        bank_name: input.bankName?.trim() || null,
        account_last4: input.accountLast4?.trim() || null,
      })
      .select("*")
      .single();

    if (error || !data) throw error ?? new Error("No se pudo guardar el remitente.");
    const sender = mapSender(data as DbStableSender);
    set({ senders: [...get().senders, sender].sort((a, b) => a.legalName.localeCompare(b.legalName)) });
    return sender;
  },

  updateSender: async (senderId, input) => {
    const { supabase } = await currentUser();
    const { error } = await supabase
      .from("stable_senders")
      .update({
        sender_type: input.type,
        legal_name: input.legalName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        bank_name: input.bankName?.trim() || null,
        account_last4: input.accountLast4?.trim() || null,
        ...(typeof input.active === "boolean" ? { is_active: input.active } : {}),
      })
      .eq("id", senderId);
    if (error) throw error;
    await get().load("user");
  },

  addOperation: async ({ usdAmount, asset, walletAddress, paymentRail, senderId, senderAccountConfirmed }) => {
    const { supabase } = await currentUser();
    const { data, error } = await supabase.rpc("create_stable_operation", {
      p_usd_amount: usdAmount,
      p_asset: asset,
      p_wallet_address: walletAddress,
      p_payment_rail: paymentRail,
      p_sender_id: senderId,
      p_sender_account_confirmed: senderAccountConfirmed,
    });

    if (error || !data) throw error ?? new Error("No se pudo crear la operación.");
    await get().load("user");
    const created = get().operations.find((operation) => operation.id === data.id);
    if (!created) throw new Error("La operación se creó, pero no pudo cargarse.");
    return created;
  },

  attachSender: async (operationId, senderId, senderAccountConfirmed) => {
    const { supabase } = await currentUser();
    const { data, error } = await supabase.rpc("attach_stable_sender", {
      p_operation_id: operationId,
      p_sender_id: senderId,
      p_sender_account_confirmed: senderAccountConfirmed,
    });
    if (error || !data) throw error ?? new Error("No se pudo registrar el remitente.");
    await get().load("user");
    const updated = get().operations.find((item) => item.id === operationId);
    if (!updated) throw new Error("El remitente se guardó, pero la operación no pudo recargarse.");
    return updated;
  },

  uploadProof: async (operationId, file) => {
    if (file.type !== "application/pdf") throw new Error("El comprobante debe ser PDF.");
    if (file.size > 5 * 1024 * 1024) throw new Error("El archivo supera el límite de 5 MB.");

    const { supabase, user } = await currentUser();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${operationId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("stable-proofs")
      .upload(path, file, { contentType: "application/pdf", upsert: false });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from("stable_operations")
      .update({
        proof_path: path,
        proof_name: file.name,
        proof_mime_type: file.type,
        proof_size: file.size,
        proof_uploaded_at: new Date().toISOString(),
        status: "proof_submitted",
      })
      .eq("id", operationId);

    if (updateError) {
      await supabase.storage.from("stable-proofs").remove([path]);
      throw updateError;
    }

    const previousPath = get().operations.find((operation) => operation.id === operationId)?.proof?.path;
    if (previousPath && previousPath !== path) {
      await supabase.storage.from("stable-proofs").remove([previousPath]);
    }
    await get().load("user");
  },

  uploadOperationDocument: async (operation, type, file) => {
    if (file.type !== "application/pdf") throw new Error("El documento debe ser PDF.");
    if (file.size > 10 * 1024 * 1024) throw new Error("El archivo supera el límite de 10 MB.");

    const { supabase, user } = await currentUser();
    const previousDocument = operation.documents.find((document) => document.type === type);
    const path = `${operation.userId}/${operation.id}/${type}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("stable-documents")
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    if (uploadError) throw uploadError;

    const { error: documentError } = await supabase
      .from("stable_operation_documents")
      .upsert({
        operation_id: operation.id,
        document_type: type,
        storage_path: path,
        file_name: file.name,
        mime_type: "application/pdf",
        file_size: file.size,
        uploaded_by: user.id,
      }, { onConflict: "operation_id,document_type" });

    if (documentError) {
      await supabase.storage.from("stable-documents").remove([path]);
      throw documentError;
    }

    if (previousDocument?.path && previousDocument.path !== path) {
      await supabase.storage.from("stable-documents").remove([previousDocument.path]);
    }
    await get().load("admin");
  },

  updateStatus: async (operationId, status, _label, _actor, note) => {
    const { supabase } = await currentUser();
    const { error } = await supabase
      .from("stable_operations")
      .update({ status, ...(note ? { admin_note: note } : {}) })
      .eq("id", operationId);
    if (error) throw error;
    await get().load("admin");
  },

  reconcileOperation: async (operationId, bankReceivedAmount) => {
    const { supabase } = await currentUser();
    const { error } = await supabase.rpc("admin_reconcile_stable_operation", {
      p_operation_id: operationId,
      p_bank_received_amount: bankReceivedAmount,
    });
    if (error) throw error;
    await get().load("admin");
  },

  setTransactionHash: async (operationId, txHash) => {
    const { supabase } = await currentUser();
    const { error } = await supabase
      .from("stable_operations")
      .update({ tx_hash: txHash, status: "completed" })
      .eq("id", operationId);
    if (error) throw error;
    await get().load("admin");
  },

  assignAccount: async (operationId, accountId) => {
    const { supabase } = await currentUser();
    const { error } = await supabase
      .from("stable_operations")
      .update({ receiving_account_id: accountId })
      .eq("id", operationId);
    if (error) throw error;
    await get().load("admin");
  },

  deleteOperation: async (operationId) => {
    const { supabase } = await currentUser();
    const { data, error } = await supabase.rpc("admin_delete_stable_operation", {
      p_operation_id: operationId,
    });
    if (error) throw error;

    const result = (data ?? {}) as { proof_path?: string | null; document_paths?: string[] | null };
    const cleanup = await Promise.all([
      result.proof_path
        ? supabase.storage.from("stable-proofs").remove([result.proof_path])
        : Promise.resolve({ error: null }),
      result.document_paths?.length
        ? supabase.storage.from("stable-documents").remove(result.document_paths)
        : Promise.resolve({ error: null }),
    ]);
    await get().load("admin");
    return { storageCleanupPending: cleanup.some((item) => Boolean(item.error)) };
  },
}));

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function shortWallet(wallet: string) {
  return `${wallet.slice(0, 8)}…${wallet.slice(-6)}`;
}

async function downloadPrivateFile(bucket: string, path: string, name: string) {
  const supabase = createClient();
  const preview = window.open("", "_blank");
  if (preview) {
    preview.document.title = `Abriendo ${name}`;
    preview.document.body.innerHTML = '<p style="font:16px system-ui;padding:24px;color:#071A2D">Abriendo documento privado…</p>';
  }
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      preview?.close();
      return false;
    }
    if (preview) preview.location.replace(data.signedUrl);
    else window.location.assign(data.signedUrl);
    return true;
  } catch {
    preview?.close();
    return false;
  }
}

export async function downloadStableDocument(document: StableDocument) {
  return downloadPrivateFile("stable-documents", document.path, document.name);
}

export async function downloadProof(proof: StableProof) {
  return downloadPrivateFile("stable-proofs", proof.path, proof.name);
}
