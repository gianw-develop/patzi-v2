import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeLocalStorage } from "@/lib/safe-storage";

interface ThemeState {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      darkMode: false,
      setDarkMode: (v) => set({ darkMode: v }),
    }),
    { name: "patzi-theme", storage: createJSONStorage(() => safeLocalStorage) }
  )
);
