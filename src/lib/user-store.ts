import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  full_name: string;
  email: string;
  phone: string;
  setUser: (data: { full_name: string; email: string; phone?: string }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      full_name: "",
      email: "",
      phone: "",
      setUser: ({ full_name, email, phone = "" }) =>
        set({ full_name, email, phone }),
      clearUser: () => set({ full_name: "", email: "", phone: "" }),
    }),
    { name: "patzi-user" }
  )
);
