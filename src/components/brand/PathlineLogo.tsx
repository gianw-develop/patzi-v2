import { cn } from "@/lib/utils";

type PathlineLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  admin?: boolean;
  className?: string;
};

export default function PathlineLogo({
  compact = false,
  inverse = false,
  admin = false,
  className,
}: PathlineLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)} aria-label={admin ? "Patzi Admin" : "Patzi"}>
      <svg
        viewBox="0 0 54 54"
        className="h-10 w-10 shrink-0 drop-shadow-[0_8px_18px_rgba(7,26,45,.18)]"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="patzi-logo-surface" x1="4" y1="2" x2="50" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor={inverse ? "#173A56" : "#12314A"}/><stop offset="1" stopColor="#061523"/></linearGradient>
        </defs>
        <rect x=".7" y=".7" width="52.6" height="52.6" rx="15" fill="url(#patzi-logo-surface)" stroke={inverse ? "rgba(255,255,255,.18)" : "rgba(7,26,45,.16)"} strokeWidth="1.4" />
        <path
          d="M14 15h17.5c6.9 0 11.5 4.3 11.5 10.1s-4.6 10-11.5 10H22v7"
          fill="none"
          stroke="#4DE2B5"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 24v18h8V31h10.5"
          fill="none"
          stroke="#FF765B"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="31" r="3.4" fill="#F5F7F2" stroke="#071A2D" strokeWidth="1.5" />
        <circle cx="14" cy="42" r="3.8" fill="#fff" />
      </svg>
      {!compact && (
        <div className="flex items-center gap-2 leading-none">
          <div className={cn("text-[1.55rem] font-semibold tracking-[-0.045em]", inverse ? "text-white" : "text-[#071A2D]")}>Patzi</div>
          {admin && <div className={cn("rounded-full px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.15em]", inverse ? "bg-[#4DE2B5]/15 text-[#4DE2B5]" : "bg-[#071A2D]/7 text-[#486071]")}>Admin</div>}
        </div>
      )}
    </div>
  );
}
