import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccountCurrency = "EUR" | "USD" | "PEN" | "VES";
export type MethodType = "bank" | "mobile";

export interface PaymentAccount {
  id: string;
  currency: AccountCurrency;
  method_type: MethodType;
  method_name: string;
  account_holder: string;
  bank_name?: string;
  iban_account?: string;
  phone?: string;
  email?: string;
  instructions?: string;
  for_deposits: boolean;
  for_payouts: boolean;
  is_active: boolean;
}

interface AccountsState {
  accounts: PaymentAccount[];
  addAccount: (acc: PaymentAccount) => void;
  updateAccount: (id: string, data: Omit<PaymentAccount, "id">) => void;
  deleteAccount: (id: string) => void;
  toggleActive: (id: string) => void;
}

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set) => ({
      accounts: [],
      addAccount: (acc) => set((s) => ({ accounts: [...s.accounts, acc] })),
      updateAccount: (id, data) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...data, id } : a)),
        })),
      deleteAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
      toggleActive: (id) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, is_active: !a.is_active } : a
          ),
        })),
    }),
    { name: "patzi-accounts" }
  )
);
