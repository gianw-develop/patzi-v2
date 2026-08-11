import { create } from "zustand";
import { createClient } from "@/lib/supabase";

export type AccountCurrency = "EUR" | "USD" | "PEN" | "VES";
export type MethodType = "bank" | "mobile";
export type BankAccountType = "checking" | "savings" | "current" | "other";

export interface PaymentAccount {
  id: string;
  currency: AccountCurrency;
  method_type: MethodType;
  method_name: string;
  account_holder: string;
  bank_name?: string;
  iban_account?: string;
  ach_enabled?: boolean;
  routing_number?: string;
  wire_enabled?: boolean;
  wire_routing_number?: string;
  account_type?: BankAccountType;
  phone?: string;
  email?: string;
  instructions?: string;
  for_deposits: boolean;
  for_payouts: boolean;
  is_active: boolean;
  daily_limit?: number;
  received_today?: number;
  weekly_limit?: number;
  weekly_used?: number;
  weekly_available?: number;
  utilization_percent?: number;
  capacity_available?: boolean;
  week_starts_at?: string;
  week_ends_at?: string;
}

interface AccountsState {
  accounts: PaymentAccount[];
  loading: boolean;
  loadAccounts: () => Promise<void>;
  addAccount: (account: Omit<PaymentAccount, "id">) => Promise<void>;
  updateAccount: (id: string, data: Omit<PaymentAccount, "id">) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}

interface AccountCapacityRow {
  account_id: string;
  weekly_limit: number | string;
  weekly_used: number | string;
  weekly_available: number | string;
  utilization_percent: number | string;
  capacity_available: boolean;
  week_starts_at: string;
  week_ends_at: string;
}

const fields = "id, currency, method_type, method_name, account_holder, bank_name, iban_account, ach_enabled, routing_number, wire_enabled, wire_routing_number, account_type, phone, email, instructions, for_deposits, for_payouts, is_active, daily_limit, received_today, weekly_limit";

function writableAccount(account: Omit<PaymentAccount, "id">) {
  const payload = { ...account };
  delete payload.weekly_used;
  delete payload.weekly_available;
  delete payload.utilization_percent;
  delete payload.capacity_available;
  delete payload.week_starts_at;
  delete payload.week_ends_at;
  return payload;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: true,

  loadAccounts: async () => {
    set({ loading: true });
    const supabase = createClient();
    const [accountsResult, capacityResult] = await Promise.all([
      supabase.from("payment_accounts").select(fields).order("currency").order("created_at"),
      supabase.rpc("get_stable_receiving_accounts"),
    ]);
    if (accountsResult.error) { set({ loading: false }); throw accountsResult.error; }
    if (capacityResult.error) { set({ loading: false }); throw capacityResult.error; }
    const capacityRows = (capacityResult.data ?? []) as AccountCapacityRow[];
    const capacityById = new Map(capacityRows.map((row) => [row.account_id, row]));
    const accounts = ((accountsResult.data ?? []) as PaymentAccount[]).map((account) => {
      const capacity = capacityById.get(account.id);
      if (!capacity) return account;
      return {
        ...account,
        weekly_limit: Number(capacity.weekly_limit),
        weekly_used: Number(capacity.weekly_used),
        weekly_available: Number(capacity.weekly_available),
        utilization_percent: Number(capacity.utilization_percent),
        capacity_available: Boolean(capacity.capacity_available),
        week_starts_at: capacity.week_starts_at,
        week_ends_at: capacity.week_ends_at,
      };
    });
    set({ accounts, loading: false });
  },

  addAccount: async (account) => {
    const supabase = createClient();
    const { error } = await supabase.from("payment_accounts").insert(writableAccount(account));
    if (error) throw error;
    await get().loadAccounts();
  },

  updateAccount: async (id, data) => {
    const supabase = createClient();
    const { error } = await supabase.from("payment_accounts").update(writableAccount(data)).eq("id", id);
    if (error) throw error;
    await get().loadAccounts();
  },

  deleteAccount: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("payment_accounts").delete().eq("id", id);
    if (error) throw error;
    await get().loadAccounts();
  },

  toggleActive: async (id) => {
    const account = get().accounts.find((item) => item.id === id);
    if (!account) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("payment_accounts")
      .update({ is_active: !account.is_active })
      .eq("id", id);
    if (error) throw error;
    await get().loadAccounts();
  },
}));
