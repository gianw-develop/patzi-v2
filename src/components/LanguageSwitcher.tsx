"use client";

import { FlagMark } from "@/components/brand/FinancialMarks";
import { useLanguage, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const options: Array<{ code: Language; label: string; country: "ES" | "GB" }> = [
    { code: "es", label: "ES", country: "ES" },
    { code: "en", label: "EN", country: "GB" },
  ];

  return (
    <div className={cn(
      "inline-flex items-center rounded-full border p-1 shadow-sm backdrop-blur-xl",
      inverse ? "border-white/12 bg-white/8" : "border-[#071A2D]/10 bg-white/88",
    )} role="group" aria-label={language === "es" ? "Seleccionar idioma" : "Select language"}>
      {options.map((option) => {
        const active = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            className={cn(
              "flex h-8 items-center justify-center gap-1.5 rounded-full px-2 text-[10px] font-semibold transition-colors",
              compact && "w-9 px-0",
              active
                ? inverse ? "bg-white text-[#071A2D] shadow-sm" : "bg-[#071A2D] text-white shadow-sm"
                : inverse ? "text-white/55 hover:text-white" : "text-[#071A2D]/45 hover:text-[#071A2D]",
            )}
            aria-pressed={active}
            aria-label={option.code === "es" ? "Español" : "English"}
          >
            <FlagMark country={option.country} className="h-3.5 w-5" />
            {!compact && option.label}
          </button>
        );
      })}
    </div>
  );
}
