import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeLocalStorage } from "@/lib/safe-storage";

interface UserState {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  kyc_status: "not_submitted" | "pending" | "approved" | "rejected";
  stable_eligible: boolean;
  is_active: boolean;
  setUser: (data: {
    id?: string;
    full_name: string;
    email: string;
    phone?: string;
    role?: "user" | "admin";
    kyc_status?: "not_submitted" | "pending" | "approved" | "rejected";
    stable_eligible?: boolean;
    is_active?: boolean;
  }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: "",
      full_name: "",
      email: "",
      phone: "",
      role: "user",
      kyc_status: "not_submitted",
      stable_eligible: false,
      is_active: true,
      setUser: ({
        id = "",
        full_name,
        email,
        phone = "",
        role = "user",
        kyc_status = "not_submitted",
        stable_eligible = false,
        is_active = true,
      }) => set({ id, full_name, email, phone, role, kyc_status, stable_eligible, is_active }),
      clearUser: () => set({
        id: "",
        full_name: "",
        email: "",
        phone: "",
        role: "user",
        kyc_status: "not_submitted",
        stable_eligible: false,
        is_active: true,
      }),
    }),
    { name: "patzi-user", storage: createJSONStorage(() => safeLocalStorage) }
  )
);
