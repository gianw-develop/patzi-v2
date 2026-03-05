"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme-store";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  return <>{children}</>;
}
