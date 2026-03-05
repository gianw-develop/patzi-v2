import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transfer } from "@/types";

interface TransferState {
  transfers: Transfer[];
  addTransfer: (t: Transfer) => void;
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set) => ({
      transfers: [],
      addTransfer: (t) => set((state) => ({ transfers: [t, ...state.transfers] })),
    }),
    { name: "patzi-transfers" }
  )
);
