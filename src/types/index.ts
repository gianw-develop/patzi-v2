export type Currency = "EUR" | "USD" | "PEN" | "VES";
export type TransferStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type TransferSpeed = "express" | "economy";
export type DeliveryMethod = "bank" | "cash" | "mobile_money" | "home_delivery";
export type KYCStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  country?: string;
  role: UserRole;
  kyc_status: KYCStatus;
  kyc_document_url?: string;
  kyc_rejection_reason?: string;
  stable_eligible?: boolean;
  risk_level?: "low" | "medium" | "high";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: string;
  user_id: string;
  full_name: string;
  country: string;
  currency: Currency;
  delivery_method: DeliveryMethod;
  delivery_app?: string;
  bank_name?: string;
  account_number?: string;
  phone?: string;
  email?: string;
  cedula?: string;
  created_at: string;
}

export interface Transfer {
  id: string;
  user_id: string;
  beneficiary_id?: string;
  beneficiary_name: string;
  beneficiary_country: string;
  send_currency: Currency;
  receive_currency: Currency;
  send_amount: number;
  receive_amount: number;
  exchange_rate: number;
  fee: number;
  total_charged: number;
  delivery_method: DeliveryMethod;
  delivery_app?: string;
  speed: TransferSpeed;
  status: TransferStatus;
  status_history: StatusHistoryEntry[];
  reference: string;
  note?: string;
  proof_url?: string;
  proof_note?: string;
  beneficiary_snapshot?: {
    full_name?: string; country?: string; currency?: Currency; delivery_method?: DeliveryMethod;
    delivery_app?: string; bank_name?: string; account_number?: string; phone?: string; email?: string; cedula?: string;
  };
  customer_name?: string;
  customer_email?: string;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryEntry {
  status: TransferStatus;
  timestamp: string;
  note?: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: Currency;
  to_currency: Currency;
  rate: number;
  markup_percent: number;
  fee_fixed: number;
  fee_percent: number;
  updated_at: string;
}

export interface Corridor {
  from: Currency;
  to: Currency;
  country_name: string;
  country_code: string;
  flag: string;
  delivery_methods: DeliveryMethod[];
  express_available: boolean;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  pending_kyc: number;
  total_transactions: number;
  total_volume: number;
  total_fees_collected: number;
  transactions_today: number;
  volume_today: number;
}
