import { cn } from "@/lib/utils";

export type AssetSymbol = "ETH" | "USDT" | "USDC";
export type FlagCountry = "US" | "ES" | "GB" | "PE" | "VE" | "MX";

export function AssetMark({ asset, className = "h-7 w-7" }: { asset: AssetSymbol; className?: string }) {
  if (asset === "ETH") {
    return (
      <svg viewBox="0 0 40 40" className={cn("shrink-0", className)} role="img" aria-label="Ethereum">
        <circle cx="20" cy="20" r="19" fill="#627EEA" />
        <path d="M20 6.8 12.5 20.2 20 24.6l7.5-4.4L20 6.8Z" fill="#fff" fillOpacity=".94" />
        <path d="m12.5 21.7 7.5 10.6 7.5-10.6-7.5 4.4-7.5-4.4Z" fill="#fff" fillOpacity=".72" />
      </svg>
    );
  }

  if (asset === "USDT") {
    return (
      <svg viewBox="0 0 40 40" className={cn("shrink-0", className)} role="img" aria-label="Tether USDT">
        <circle cx="20" cy="20" r="19" fill="#26A17B" />
        <path d="M10.4 10.3h19.2v4.6h-7.1v3.2c5.1.2 8.9 1.1 8.9 2.3s-3.8 2.1-8.9 2.3v7.7h-5v-7.7c-5.1-.2-8.9-1.1-8.9-2.3s3.8-2.1 8.9-2.3v-3.2h-7.1v-4.6Zm9.6 10.8c5.3 0 9.5-.6 9.5-1.3 0-.5-2.8-1-7-1.2v1.8c-.8.1-1.7.1-2.5.1s-1.7 0-2.5-.1v-1.8c-4.2.2-7 .7-7 1.2 0 .7 4.2 1.3 9.5 1.3Z" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" className={cn("shrink-0", className)} role="img" aria-label="USD Coin USDC">
      <circle cx="20" cy="20" r="19" fill="#2775CA" />
      <path d="M15.4 30.8a12 12 0 0 1 0-21.6v3A9.3 9.3 0 0 0 11 20a9.3 9.3 0 0 0 4.4 7.8v3Zm9.2 0v-3A9.3 9.3 0 0 0 29 20a9.3 9.3 0 0 0-4.4-7.8v-3a12 12 0 0 1 0 21.6Z" fill="#fff" />
      <path d="M21.3 12.6v2c2.4.3 3.8 1.6 4.2 3.7h-2.8c-.3-1-1.1-1.5-2.5-1.5-1.2 0-2 .5-2 1.2 0 .7.5 1 2.2 1.4l1.8.4c2.5.6 3.7 1.8 3.7 3.8 0 2.3-1.7 3.8-4.6 4.1v2h-2.2v-2c-2.6-.3-4.3-1.7-4.6-4h2.9c.3 1.2 1.3 1.8 2.9 1.8 1.4 0 2.3-.5 2.3-1.4 0-.7-.6-1.1-2.2-1.5l-1.8-.4c-2.5-.6-3.7-1.7-3.7-3.7 0-2.2 1.6-3.7 4.2-4v-1.9h2.2Z" fill="#fff" />
    </svg>
  );
}

export function FlagMark({ country, className = "h-5 w-7" }: { country: FlagCountry; className?: string }) {
  if (country === "GB") {
    return (
      <svg viewBox="0 0 30 20" className={cn("overflow-hidden rounded-[4px] shadow-sm", className)} role="img" aria-label="United Kingdom">
        <path fill="#012169" d="M0 0h30v20H0z" />
        <path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20" />
        <path stroke="#C8102E" strokeWidth="1.8" d="m0 0 30 20M30 0 0 20" />
        <path fill="#fff" d="M12 0h6v20h-6zM0 7h30v6H0z" />
        <path fill="#C8102E" d="M13.4 0h3.2v20h-3.2zM0 8.4h30v3.2H0z" />
      </svg>
    );
  }
  if (country === "ES") {
    return (
      <svg viewBox="0 0 30 20" className={cn("overflow-hidden rounded-[4px] shadow-sm", className)} role="img" aria-label="España">
        <path fill="#AA151B" d="M0 0h30v20H0z" />
        <path fill="#F1BF00" d="M0 5h30v10H0z" />
        <rect x="8" y="8" width="2.2" height="4" rx=".35" fill="#AA151B" />
      </svg>
    );
  }
  if (country === "PE") {
    return <svg viewBox="0 0 30 20" className={cn("overflow-hidden rounded-[4px] shadow-sm", className)} role="img" aria-label="Perú"><path fill="#D91023" d="M0 0h10v20H0zM20 0h10v20H20z"/><path fill="#fff" d="M10 0h10v20H10z"/></svg>;
  }
  if (country === "VE") {
    return (
      <svg viewBox="0 0 30 20" className={cn("overflow-hidden rounded-[4px] shadow-sm", className)} role="img" aria-label="Venezuela">
        <path fill="#F4D900" d="M0 0h30v6.67H0z" />
        <path fill="#0033A0" d="M0 6.67h30v6.66H0z" />
        <path fill="#CF142B" d="M0 13.33h30V20H0z" />
        {[9, 11, 13, 15, 17, 19, 21, 23].map((x, index) => (
          <circle key={x} cx={x} cy={10.3 - Math.abs(3.5 - index) * .2} r=".48" fill="#fff" />
        ))}
      </svg>
    );
  }
  if (country === "MX") {
    return <svg viewBox="0 0 30 20" className={cn("overflow-hidden rounded-[4px] shadow-sm", className)} role="img" aria-label="México"><path fill="#006847" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#CE1126" d="M20 0h10v20H20z"/><circle cx="15" cy="10" r="1.8" fill="#9C6B30"/></svg>;
  }
  return (
    <svg viewBox="0 0 30 20" className={cn("overflow-hidden rounded-[4px] shadow-sm", className)} role="img" aria-label="Estados Unidos">
      <path fill="#fff" d="M0 0h30v20H0z" />
      {[0,3,6,9,12,15,18].map((y) => <path key={y} fill="#B22234" d={`M0 ${y}h30v1.55H0z`} />)}
      <path fill="#3C3B6E" d="M0 0h13v10.8H0z" />
      {[2,6,10].map((x) => [2,5.2,8.4].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".55" fill="#fff" />))}
    </svg>
  );
}

export function AssetChip({ asset, dark = false }: { asset: AssetSymbol; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm", dark ? "border-white/12 bg-white/8 text-white" : "border-[#071A2D]/10 bg-white text-[#071A2D]")}> 
      <AssetMark asset={asset} className="h-5 w-5" />{asset}
    </span>
  );
}

export function CoinOrb({ asset, className }: { asset: AssetSymbol; className?: string }) {
  return (
    <div className={cn("coin-orb grid place-items-center rounded-full border border-white/70 bg-white/80 shadow-[0_18px_40px_rgba(7,26,45,.22)] backdrop-blur-xl", className)}>
      <AssetMark asset={asset} className="h-[62%] w-[62%] drop-shadow-[0_8px_10px_rgba(7,26,45,.2)]" />
    </div>
  );
}

export function FlowCircuit({ id, dark = false, className }: { id: string; dark?: boolean; className?: string }) {
  const path = "M30 104h134c58 0 52-62 110-62h177c58 0 52 62 110 62h169";
  return (
    <svg viewBox="0 0 760 150" className={cn("overflow-visible", className)} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-flow`} x1="30" y1="75" x2="730" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF765B"/><stop offset=".45" stopColor="#FF765B"/><stop offset=".52" stopColor="#4DE2B5"/><stop offset="1" stopColor="#4DE2B5"/>
        </linearGradient>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d={path} stroke={dark ? "rgba(255,255,255,.1)" : "rgba(7,26,45,.08)"} strokeWidth="12" strokeLinecap="round" />
      <path d={path} stroke={`url(#${id}-flow)`} strokeWidth="4" strokeLinecap="round" />
      <path d={path} stroke="rgba(255,255,255,.82)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 18" className="circuit-path" />
      <g filter={`url(#${id}-glow)`}>
        <circle cx="362" cy="42" r="14" fill={dark ? "#071A2D" : "#fff"} stroke={dark ? "rgba(255,255,255,.8)" : "#E9F1EC"} strokeWidth="6" />
        <circle cx="362" cy="42" r="4.5" fill="#071A2D" />
      </g>
      <circle r="6" fill="#fff" stroke="#4DE2B5" strokeWidth="3" className="circuit-moving" filter={`url(#${id}-glow)`}>
        <animateMotion dur="4.2s" repeatCount="indefinite" path={path} />
      </circle>
      <circle r="3.5" fill="#FF765B" className="circuit-moving" opacity=".9">
        <animateMotion dur="4.2s" begin="-2.1s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  );
}
