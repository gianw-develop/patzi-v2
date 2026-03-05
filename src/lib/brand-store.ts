import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BrandState {
  logoUrl: string | null;
  platformName: string;
  setLogo: (url: string | null) => void;
  setPlatformName: (name: string) => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      logoUrl: null,
      platformName: "Patzi",
      setLogo: (url) => set({ logoUrl: url }),
      setPlatformName: (name) => set({ platformName: name }),
    }),
    { name: "patzi-brand" }
  )
);
