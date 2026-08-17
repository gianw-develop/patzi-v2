"use client";

import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Check, ChevronRight, CircleDollarSign,
  Copy, FileCheck2, Headphones, Landmark, LockKeyhole, Menu, Network,
  Route, Send, ShieldCheck, Smartphone, Upload, UserCheck, WalletCards,
} from "lucide-react";
import PathlineLogo from "@/components/brand/PathlineLogo";
import { AssetChip, AssetMark, CoinOrb, FlagMark, FlowCircuit } from "@/components/brand/FinancialMarks";
import RemittanceExperience from "@/components/landing/RemittanceExperience";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

const operations = [
  { ref: "PTZ-80421", type: "Stable", amount: "$1,000", output: "900 USDT", status: "Verificando", tone: "verification", asset: "USDT" as const },
  { ref: "RM-826417", type: "Remesa", amount: "$500", output: "S/ 1,860", status: "Pago recibido", tone: "received", asset: null },
  { ref: "PTZ-80398", type: "Stable", amount: "$2,000", output: "1,800 USDT", status: "Preparando", tone: "preparing", asset: "USDT" as const },
  { ref: "PTZ-80372", type: "Stable", amount: "$750", output: "675 USDT", status: "Completada", tone: "completed", asset: "USDT" as const },
];

function HeroProductPreview() {
  const { t } = useLanguage();
  return (
    <div className="premium-stage relative min-h-[520px] min-w-0 w-full max-w-full overflow-hidden rounded-[2.5rem] border border-[#071A2D]/10 p-5 shadow-[0_45px_100px_rgba(7,26,45,.18)] sm:p-8">
      <div className="absolute inset-x-[-12%] top-[34%] opacity-90"><FlowCircuit id="hero-circuit" className="w-full" /></div>
      <div className="absolute left-[7%] top-[8%] h-36 w-36 rounded-full bg-white/55 blur-3xl" />
      <div className="depth-window relative z-10 mt-6 overflow-hidden rounded-[1.65rem] border border-white/80 bg-white/92 shadow-[0_40px_80px_rgba(7,26,45,.2),0_1px_0_white_inset] backdrop-blur-xl sm:ml-7">
        <div className="flex h-11 items-center gap-3 border-b border-[#071A2D]/7 bg-[#F7FAF7] px-4">
          <div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#FF765B]"/><span className="h-2 w-2 rounded-full bg-[#F7C85D]"/><span className="h-2 w-2 rounded-full bg-[#4DE2B5]"/></div>
          <div className="mx-auto rounded-full border border-[#071A2D]/7 bg-white px-9 py-1.5 text-[8px] text-[#071A2D]/38">secure.patzi.com</div>
          <ShieldCheck className="h-4 w-4 text-[#14856A]" />
        </div>
        <div className="grid sm:grid-cols-[1.02fr_.98fr]">
          <div className="p-5 sm:border-r sm:border-[#071A2D]/8">
            <div className="flex items-start justify-between gap-3"><div><p className="premium-kicker text-[#2775CA]">{t("Remesas")}</p><h3 className="mt-1 text-base font-semibold">{t("Calcula tu envío")}</h3></div><span className="rounded-full bg-[#E8F6F0] px-2.5 py-1 text-[8px] font-semibold text-[#087F62]">{t("SERVICIO PRINCIPAL")}</span></div>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-[#071A2D]/8 bg-[#F7FAF7] p-4"><p className="text-[10px] text-[#071A2D]/45">{t("Tú envías")}</p><div className="mt-1 flex items-center justify-between"><strong className="text-[1.45rem] font-semibold tracking-[-.04em]">$1,000.00</strong><span className="flex items-center gap-2 text-[10px] font-semibold"><FlagMark country="US" />USD</span></div></div>
              <div className="flex items-center gap-3 px-2"><span className="h-px flex-1 bg-[#071A2D]/8"/><div className="grid h-7 w-7 place-items-center rounded-full bg-[#071A2D] text-white shadow-lg"><ArrowRight className="h-3.5 w-3.5"/></div><span className="h-px flex-1 bg-[#071A2D]/8"/></div>
              <div className="rounded-2xl border border-[#071A2D]/8 bg-white p-4"><p className="text-[10px] text-[#071A2D]/45">{t("Ellos reciben")}</p><div className="mt-1 flex items-center justify-between"><strong className="text-[1.45rem] font-semibold tracking-[-.04em]">S/ 3,720.00</strong><span className="flex items-center gap-2 text-[10px] font-semibold"><FlagMark country="PE" />PEN</span></div></div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[9px] text-[#071A2D]/42"><span>{t("Tipo de cambio visible")}</span><span>{t("Entrega estimada · hoy")}</span></div>
          </div>
          <div className="relative overflow-hidden bg-[#071A2D] p-5 text-white">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#4DE2B5]/15 blur-3xl" />
            <div className="relative flex items-start justify-between"><div><p className="premium-kicker text-[#4DE2B5]">Patzi Stable</p><h3 className="mt-1 text-base font-semibold">{t("Acceso habilitado")}</h3></div><span className="rounded-full bg-[#4DE2B5] px-2 py-1 text-[8px] font-semibold text-[#071A2D]">{t("NUEVO")}</span></div>
            <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/[.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="flex items-center justify-between"><div><p className="text-[9px] text-white/42">{t("Tú recibes")}</p><p className="mt-1 text-2xl font-semibold tracking-[-.04em]">900.00</p></div><AssetMark asset="USDT" className="h-10 w-10 drop-shadow-[0_10px_12px_rgba(0,0,0,.3)]" /></div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[9px]"><span className="text-white/42">{t("Comisión fija")}</span><b className="font-semibold">$100 · 10%</b></div>
            </div>
            <div className="mt-4 flex items-center justify-between"><AssetChip asset="ETH" dark/><div className="flex -space-x-1"><AssetMark asset="USDT" className="h-6 w-6 ring-2 ring-[#071A2D]"/></div></div>
            <div className="mt-5 flex items-center gap-2 text-[9px] text-white/55"><FileCheck2 className="h-4 w-4 text-[#4DE2B5]"/>{t("Comprobante y wallet verificados")}</div>
          </div>
        </div>
      </div>
      <CoinOrb asset="USDT" className="depth-float absolute bottom-6 right-5 z-20 h-20 w-20 sm:-right-1 sm:h-24 sm:w-24" />
      <div className="depth-float-delayed absolute bottom-7 left-4 z-20 flex items-center gap-3 rounded-2xl border border-white/75 bg-white/88 p-3 shadow-[0_20px_45px_rgba(7,26,45,.16)] backdrop-blur-xl sm:left-1">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8F8F2] text-[#087F62]"><BadgeCheck className="h-5 w-5"/></div><div><p className="text-[9px] text-[#071A2D]/44">{t("Estado del dinero")}</p><p className="text-[11px] font-semibold">{t("Pago recibido")}</p></div>
      </div>
    </div>
  );
}

function StableExchangeCard() {
  const { t } = useLanguage();
  return (
    <div className="premium-card relative z-10 w-full max-w-[390px] rounded-[1.8rem] p-6 text-[#071A2D]">
      <div className="flex items-center justify-between"><div><p className="premium-kicker text-[#087F62]">{t("Cambio verificado")}</p><h3 className="mt-1 text-lg font-semibold">Patzi Stable</h3></div><span className="rounded-full bg-[#4DE2B5] px-2.5 py-1 text-[9px] font-semibold">{t("NUEVO")}</span></div>
      <div className="mt-6 rounded-2xl bg-[#F5F8F5] p-4"><p className="text-[9px] text-[#071A2D]/42">{t("Tú envías")}</p><div className="mt-1 flex items-center justify-between"><p className="text-3xl font-semibold tracking-[-.045em]">1,000.00</p><span className="flex items-center gap-2 text-[10px] font-semibold"><FlagMark country="US"/>USD</span></div><div className="mt-3 flex items-center justify-between border-t border-[#071A2D]/7 pt-3 text-[9px]"><span className="text-[#071A2D]/45">{t("Comisión Patzi (10%)")}</span><b className="font-semibold">100.00 USD</b></div></div>
      <div className="relative my-3 flex items-center justify-center"><span className="h-px flex-1 bg-[#071A2D]/8"/><span className="mx-3 grid h-8 w-8 place-items-center rounded-full bg-[#071A2D] text-white shadow-lg"><ArrowRight className="h-4 w-4 rotate-90"/></span><span className="h-px flex-1 bg-[#071A2D]/8"/></div>
      <div className="rounded-2xl border border-[#4DE2B5]/45 bg-[#EDFCF7] p-4"><p className="text-[9px] text-[#071A2D]/42">{t("Tú recibes")}</p><div className="mt-1 flex items-center justify-between"><p className="text-3xl font-semibold tracking-[-.045em]">900.00</p><div className="flex gap-2"><AssetMark asset="USDT"/></div></div><div className="mt-4 flex items-center justify-between"><span className="text-[9px] text-[#071A2D]/45">{t("Red de entrega")}</span><AssetChip asset="ETH"/></div></div>
      <Link href="/auth/register" className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#071A2D] text-xs font-semibold text-white shadow-[0_14px_26px_rgba(7,26,45,.2)]">{t("Solicitar acceso")} <ArrowRight className="h-4 w-4"/></Link>
    </div>
  );
}

function ProductTable() {
  const { t } = useLanguage();
  return (
    <div className="premium-card overflow-hidden rounded-[1.7rem]">
      <div className="relative z-10 flex items-center justify-between border-b border-[#071A2D]/8 px-5 py-4"><div className="flex items-center gap-3"><PathlineLogo compact/><div><p className="text-xs font-semibold">{t("Mis operaciones")}</p><p className="text-[9px] text-[#071A2D]/40">{t("Remesas y Stable en un solo historial")}</p></div></div><button className="rounded-full border border-[#071A2D]/10 px-3 py-1.5 text-[9px] font-medium">{t("Todas")} · 12</button></div>
      <div className="relative z-10 overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#F6F9F6] text-[8px] uppercase tracking-[.12em] text-[#071A2D]/38"><tr>{["Referencia","Servicio","Envías","Recibes","Estado",""].map(x=><th key={x} className="px-4 py-3 font-semibold">{t(x)}</th>)}</tr></thead><tbody>{operations.map(row=><tr key={row.ref} className="border-t border-[#071A2D]/6 text-[10px]"><td className="px-4 py-3.5 font-semibold">{row.ref}</td><td className="px-4 py-3.5"><span className="flex items-center gap-2">{row.asset?<AssetMark asset={row.asset} className="h-5 w-5"/>:<span className="grid h-5 w-5 place-items-center rounded-full bg-[#EAF1FF] text-[#2775CA]"><Send className="h-3 w-3"/></span>}{t(row.type)}</span></td><td className="px-4 py-3.5 font-medium">{row.amount} USD</td><td className="px-4 py-3.5 font-semibold">{row.output}</td><td className="px-4 py-3.5"><span className={`status-pill status-${row.tone}`}>{t(row.status)}</span></td><td className="px-4 py-3.5"><ChevronRight className="h-4 w-4"/></td></tr>)}</tbody></table></div>
      <div className="relative z-10 grid border-t border-[#071A2D]/8 bg-[#F7FAF7] sm:grid-cols-3">{[[FileCheck2,"Comprobante","comprobante_80421.pdf"],[WalletCards,"Wallet","0x7a3b...8c9f"],[Network,"Hash","0x7a3bc2...c9f1"]].map(([Icon,label,value])=><div key={String(label)} className="flex items-center gap-3 border-b border-[#071A2D]/7 p-4 last:border-0 sm:border-b-0 sm:border-r"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm"><Icon className="h-4 w-4"/></div><div className="min-w-0"><p className="text-[8px] text-[#071A2D]/40">{t(label as string)}</p><p className="mt-1 truncate text-[9px] font-semibold">{value as string}</p></div><Copy className="ml-auto h-3.5 w-3.5 text-[#071A2D]/35"/></div>)}</div>
    </div>
  );
}

function AppDevice({ stable = false }: { stable?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="w-[185px] rounded-[2.1rem] border-[6px] border-[#071A2D] bg-white p-3 text-[#071A2D] shadow-[0_35px_60px_rgba(0,0,0,.35)]">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#071A2D]/15"/>
      <div className="flex items-center justify-between"><PathlineLogo compact/><span className="h-2 w-2 rounded-full bg-[#FF765B]"/></div>
      {stable?<><p className="mt-5 premium-kicker text-[#087F62]">Patzi Stable</p><p className="mt-1 text-xl font-semibold">900.00</p><div className="mt-2 flex gap-1"><AssetChip asset="USDT"/><AssetChip asset="ETH"/></div><div className="mt-5 space-y-3">{["Enviaste USD","Pago verificado","Recibes USDT"].map((x,i)=><div key={x} className="flex items-center gap-2 text-[8px] font-medium"><span className={`grid h-4 w-4 place-items-center rounded-full ${i<2?"bg-[#4DE2B5]":"border border-[#071A2D]/12"}`}>{i<2&&<Check className="h-2.5 w-2.5"/>}</span>{t(x)}</div>)}</div></>:<><p className="mt-5 text-[9px] text-[#071A2D]/45">{t("Hola, Ana")}</p><p className="mt-3 text-[8px] text-[#071A2D]/38">{t("Actividad reciente")}</p>{operations.slice(0,3).map(row=><div key={row.ref} className="mt-3 flex items-center gap-2 border-b border-[#071A2D]/7 pb-3"><span className="h-2 w-2 rounded-full bg-[#4DE2B5]"/><div><p className="text-[7px] font-semibold">{row.ref}</p><p className="text-[6px] text-[#071A2D]/38">{t(row.status)}</p></div><span className="ml-auto text-[7px] font-medium">{row.amount}</span></div>)}</>}
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  return (
    <main className="premium-shell overflow-x-clip overflow-hidden bg-[#FBFCF9] text-[#071A2D]">
      <header className="relative z-40 border-b border-[#071A2D]/6 bg-white/88 backdrop-blur-xl"><div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-3 px-5 lg:px-8"><Link href="/"><PathlineLogo/></Link><nav className="hidden items-center gap-7 text-[13px] font-medium md:flex"><a href="#remesas">{t("Remesas")}</a><a href="#stable">Patzi Stable</a><a href="#control">{t("Cómo funciona")}</a><a href="#ayuda">{t("Ayuda")}</a></nav><div className="ml-auto flex items-center gap-2"><div className="hidden sm:block"><LanguageSwitcher /></div><div className="sm:hidden"><LanguageSwitcher compact /></div><div className="hidden items-center gap-2 sm:flex"><Link href="/auth/login" className="px-3 py-3 text-xs font-semibold">{t("Ingresar")}</Link><Link href="/auth/register" className="rounded-xl bg-[#071A2D] px-4 py-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(7,26,45,.16)]">{t("Crear cuenta")}</Link></div><Menu className="h-5 w-5 sm:hidden"/></div></div></header>

      <section className="relative bg-white"><div className="mx-auto grid min-h-[650px] min-w-0 max-w-[1240px] items-center gap-12 px-5 py-14 lg:grid-cols-[.78fr_1.22fr] lg:px-8"><div className="relative z-10 min-w-0"><div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#071A2D]/8 bg-[#F3F8F5] px-3 py-2 text-[10px] font-semibold text-[#087F62]"><span className="h-2 w-2 rounded-full bg-[#4DE2B5] shadow-[0_0_0_5px_rgba(77,226,181,.15)]"/>{t("Remesas + Stablecoins, una sola cuenta")}</div><h1 className="mt-6 max-w-[540px] text-[clamp(2.6rem,12vw,3.15rem)] font-semibold leading-[.98] tracking-[-.06em] sm:text-[4.15rem]">{t("Tu dinero, con una ruta más clara.")}</h1><p className="mt-6 max-w-[500px] text-[1.05rem] leading-7 text-[#071A2D]/60">{t("Envía remesas con confianza. Y, si tu cuenta está habilitada, cambia USD a USDT sin salir de Patzi.")}</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/dashboard/send" className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[#071A2D] px-6 text-xs font-semibold text-white shadow-[0_16px_28px_rgba(7,26,45,.19)]">{t("Enviar dinero")} <ArrowRight className="h-4 w-4"/></Link><a href="#stable" className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-[#071A2D]/14 bg-white px-6 text-xs font-semibold shadow-sm">{t("Conocer Patzi Stable")} <ArrowRight className="h-4 w-4"/></a></div><div className="mt-8 flex flex-wrap gap-4 text-[10px] text-[#071A2D]/48"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#087F62]"/>{t("Cuenta verificada")}</span><span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-[#2775CA]"/>{t("Comprobantes PDF")}</span><span className="flex items-center gap-2"><Network className="h-4 w-4 text-[#627EEA]"/>Ethereum ERC-20</span></div></div><div className="min-w-0 max-w-full"><HeroProductPreview/></div></div></section>

      <section className="border-y border-[#071A2D]/6 bg-[#F1F8F4]"><div className="mx-auto grid max-w-[1120px] gap-6 px-5 py-7 md:grid-cols-3">{[[CircleDollarSign,"Tarifas visibles","Sabes exactamente lo que pagas."],[Route,"Seguimiento real","Cada operación tiene un estado claro."],[Headphones,"Soporte humano","Personas reales cuando las necesitas."]].map(([Icon,title,text])=><div key={String(title)} className="flex items-center gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white bg-white shadow-[0_8px_20px_rgba(7,26,45,.07)]"><Icon className="h-5 w-5"/></div><div><h3 className="text-sm font-semibold">{t(title as string)}</h3><p className="mt-1 text-[11px] text-[#071A2D]/48">{t(text as string)}</p></div></div>)}</div></section>

      <RemittanceExperience />

      <section id="stable" className="relative overflow-hidden bg-[#061827] text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(77,226,181,.14),transparent_28%)]"/><div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8"><div className="relative z-10"><div className="flex items-center gap-3"><p className="premium-kicker text-[#4DE2B5]">{t("Nuevo servicio")}</p><span className="rounded-full bg-[#4DE2B5]/12 px-2 py-1 text-[8px] text-[#4DE2B5]">{t("CUENTAS APTAS")}</span></div><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em]">{t("USD entra.")}<br/>{t("USDT sale.")}</h2><p className="mt-5 max-w-md text-base leading-7 text-white/58">{t("Tú transfieres USD a la cuenta asignada, subes el comprobante y nosotros enviamos USDT a tu wallet verificada.")}</p><div className="mt-8 grid max-w-lg grid-cols-3 gap-4">{[["10%",CircleDollarSign,"Comisión fija"],["ETH",Network,"Red ERC-20"],["KYC",LockKeyhole,"Solo habilitados"]].map(([value,Icon,label])=><div key={String(value)} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"><Icon className="h-5 w-5 text-[#4DE2B5]"/><p className="mt-4 text-lg font-semibold">{value as string}</p><p className="mt-1 text-[9px] text-white/42">{t(label as string)}</p></div>)}</div><div className="mt-7 flex flex-wrap gap-2"><AssetChip asset="USDT" dark/><AssetChip asset="ETH" dark/></div></div><div className="relative flex min-h-[430px] items-center justify-center lg:justify-end"><div className="absolute inset-x-[-20%] top-[34%]"><FlowCircuit id="stable-circuit" dark className="w-full"/></div><StableExchangeCard/><CoinOrb asset="ETH" className="absolute left-[3%] top-[4%] h-16 w-16 sm:h-20 sm:w-20"/></div></div></section>

      <section id="control" className="bg-[#F5F8F5]"><div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-24 lg:grid-cols-[.52fr_1.48fr] lg:items-center lg:px-8"><div><p className="premium-kicker text-[#087F62]">{t("Control total")}</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.045em]">{t("Cada envío tiene una historia.")}</h2><p className="mt-4 text-sm leading-6 text-[#071A2D]/52">{t("Mira tus remesas y cambios, comprobantes, wallet y hash de transacción.")}</p><div className="mt-7 space-y-3">{[["waiting","Esperando pago"],["verification","Verificando comprobante"],["received","Pago recibido"],["preparing","Preparando stablecoin"],["completed","Completada"]].map(([tone,label])=><div key={label} className="flex items-center gap-3"><span className={`status-pill status-${tone} !h-6 !w-6 !justify-center !p-0 !text-[0]`}/><p className="text-[11px] font-medium">{t(label)}</p></div>)}</div></div><ProductTable/></div></section>

      <section className="relative overflow-hidden bg-[#071A2D] text-white"><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-20 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:px-8"><div><p className="premium-kicker text-[#4DE2B5]">{t("Próximamente")}</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.045em]">{t("Patzi irá contigo.")}</h2><p className="mt-5 max-w-sm text-sm leading-6 text-white/55">{t("Una futura app para remesas, Stable y toda tu actividad. La web ya funciona hoy; la app es el siguiente paso.")}</p><div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[10px] font-medium"><Smartphone className="h-4 w-4 text-[#4DE2B5]"/>{t("APP PATZI · EN DESARROLLO")}</div></div><div className="flex items-end justify-center gap-4 lg:justify-end"><AppDevice/><div className="translate-y-4"><AppDevice stable/></div><CoinOrb asset="USDT" className="hidden h-20 w-20 sm:grid"/></div></div></section>

      <section className="border-y border-[#071A2D]/6 bg-[#EFF7F3]"><div className="mx-auto grid max-w-[1120px] gap-7 px-5 py-8 md:grid-cols-3">{[[UserCheck,"Identidad verificada","Protegemos el acceso al servicio Stable."],[ShieldCheck,"Wallet y red confirmadas","Validamos Ethereum ERC-20 antes del envío."],[Upload,"Revisión transparente","El comprobante y cada estado quedan registrados."]].map(([Icon,title,text])=><div key={String(title)} className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white bg-white shadow-sm"><Icon className="h-5 w-5"/></div><div><h3 className="text-sm font-semibold">{t(title as string)}</h3><p className="mt-1 text-[10px] leading-4 text-[#071A2D]/48">{t(text as string)}</p></div></div>)}</div></section>

      <section id="ayuda" className="bg-white"><div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-8"><div className="grid gap-7 sm:grid-cols-[200px_1fr]"><div><p className="premium-kicker text-[#2775CA]">{t("Ayuda")}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">{t("Preguntas frecuentes")}</h2></div><div className="divide-y divide-[#071A2D]/9">{["¿Qué es Patzi Stable?","¿Cómo funciona el envío de USD?","¿Qué activo recibiré?","¿Dónde coloco mi wallet?","¿Cuánto tarda la revisión?"].map(q=><details key={q} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold">{t(q)}<ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90"/></summary><p className="pt-3 text-[11px] leading-5 text-[#071A2D]/50">{t("Tu wallet USDT se guarda una sola vez. Cada depósito solo necesita los datos del remitente, el banco receptor y el comprobante.")}</p></details>)}</div></div><div className="rounded-[2rem] bg-[#F2F7F4] p-8"><Landmark className="h-7 w-7 text-[#087F62]"/><h2 className="mt-5 text-3xl font-semibold tracking-[-.04em]">{t("Empieza con una remesa.")}</h2><p className="mt-3 text-sm text-[#071A2D]/52">{t("Es rápido, claro y seguro.")}</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/dashboard/send" className="rounded-xl bg-[#071A2D] px-6 py-3 text-xs font-semibold text-white">{t("Enviar dinero")}</Link><Link href="/auth/register" className="rounded-xl border border-[#071A2D]/14 bg-white px-6 py-3 text-xs font-semibold">{t("Crear cuenta")}</Link></div></div></div></section>

      <footer className="bg-[#061523] text-white"><div className="mx-auto grid max-w-[1240px] gap-9 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,1fr)] lg:px-8"><div><PathlineLogo inverse/><p className="mt-4 max-w-[210px] text-[10px] leading-5 text-white/42">{t("Una ruta más clara para mover tu dinero.")}</p><div className="mt-5 flex gap-2"><AssetMark asset="USDT"/><AssetMark asset="ETH"/></div></div>{[["Productos","Remesas","Patzi Stable"],["Compañía","Quiénes somos","Trabajo con nosotros"],["Ayuda","Centro de ayuda","Contáctanos"],["Legal","Términos y condiciones","Aviso de privacidad"]].map(group=><div key={group[0]}><h3 className="text-[10px] font-semibold">{t(group[0])}</h3><p className="mt-4 text-[9px] text-white/44">{t(group[1])}</p><p className="mt-3 text-[9px] text-white/44">{t(group[2])}</p></div>)}</div><div className="border-t border-white/8 px-5 py-5 text-center text-[9px] text-white/28">© 2026 Patzi. {t("Todos los derechos reservados.")}</div></footer>
    </main>
  );
}
