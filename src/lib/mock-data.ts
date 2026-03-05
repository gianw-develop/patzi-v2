import type { User, Transfer, Wallet, WalletTransaction, Beneficiary, AdminStats } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "u-admin",
    email: "admin@patzi.com",
    full_name: "Admin Patzi",
    country: "ES",
    role: "admin",
    kyc_status: "approved",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_WALLETS: Wallet[] = [
  {
    id: "w1",
    user_id: "u-current",
    currency: "EUR",
    balance: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "w2",
    user_id: "u-current",
    currency: "USD",
    balance: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [];

export const MOCK_BENEFICIARIES: Beneficiary[] = [];

export const MOCK_TRANSFERS: Transfer[] = [];

export const MOCK_ADMIN_STATS: AdminStats = {
  total_users: 0,
  active_users: 0,
  pending_kyc: 0,
  total_transactions: 0,
  total_volume: 0,
  total_fees_collected: 0,
  transactions_today: 0,
  volume_today: 0,
};

export const MOCK_VOLUME_CHART = [
  { month: "Sep", volume: 145000, transactions: 432 },
  { month: "Oct", volume: 198000, transactions: 587 },
  { month: "Nov", volume: 234000, transactions: 698 },
  { month: "Dic", volume: 312000, transactions: 923 },
  { month: "Ene", volume: 287000, transactions: 854 },
  { month: "Feb", volume: 356000, transactions: 1042 },
  { month: "Mar", volume: 315000, transactions: 987 },
];

export const MOCK_CURRENCY_DISTRIBUTION = [
  { currency: "EUR→PEN", value: 38, color: "#3B82F6" },
  { currency: "USD→VES", value: 29, color: "#10B981" },
  { currency: "EUR→VES", value: 18, color: "#F59E0B" },
  { currency: "USD→PEN", value: 11, color: "#8B5CF6" },
  { currency: "Otros", value: 4, color: "#6B7280" },
];
