import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DepositStatus = "pending" | "approved" | "rejected";

export interface DepositRequest {
  id: string;
  user_id: string;
  user_name: string;
  currency: "EUR" | "USD";
  amount: number;
  method: "bank" | "mobile";
  method_label: string;
  proof_file_name: string;
  proof_data_url: string;
  status: DepositStatus;
  admin_note?: string;
  created_at: string;
  reviewed_at?: string;
}

interface DepositState {
  requests: DepositRequest[];
  addRequest: (r: DepositRequest) => void;
  updateStatus: (id: string, status: DepositStatus, note?: string) => void;
}

export const useDepositStore = create<DepositState>()(
  persist(
    (set) => ({
      requests: [],
      addRequest: (r) => set((s) => ({ requests: [r, ...s.requests] })),
      updateStatus: (id, status, note) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id
              ? { ...r, status, admin_note: note, reviewed_at: new Date().toISOString() }
              : r
          ),
        })),
    }),
    { name: "patzi-deposits" }
  )
);
