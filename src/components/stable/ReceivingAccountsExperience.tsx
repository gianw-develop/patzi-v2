"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy, Landmark, LoaderCircle, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { type LedgerAccount, useStableLedgerStore } from "@/lib/stable-ledger-store";

function bankAddress(instructions: string) {
  return instructions.replace(/^Bank address:\s*/i, "").trim();
}

function accountCopyText(account: LedgerAccount) {
  return [
    "PATZI RECEIVING ACCOUNT",
    `Beneficiary: ${account.holder}`,
    `Bank: ${account.bank}`,
    `Account number: ${account.accountNumber}`,
    account.achEnabled ? `ACH routing: ${account.achRouting}` : null,
    account.wireEnabled ? `Wire routing: ${account.wireRouting}` : null,
    account.swift ? `SWIFT: ${account.swift}` : null,
    `Account type: ${account.accountType}`,
    account.instructions ? `Bank address / instructions: ${bankAddress(account.instructions)}` : null,
  ].filter(Boolean).join("\n");
}

export default function ReceivingAccountsExperience() {
  const { t } = useLanguage();
  const { loading, error, stableEligible, kycVerified, accounts, load } = useStableLedgerStore();
  const availableAccounts = useMemo(() => accounts.filter((account) => account.available), [accounts]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const activeExpandedId = expandedId ?? availableAccounts[0]?.id ?? "";

  useEffect(() => { void load("user"); }, [load]);

  const copyValue = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast.success(t("Datos bancarios copiados"));
      window.setTimeout(() => setCopied((current) => current === key ? "" : current), 1800);
    } catch {
      toast.error(t("No se pudieron copiar los datos bancarios"));
    }
  };

  if (loading) return <><Header title={t("Cuentas receptoras")} subtitle={t("Cargando cuentas bancarias")} /><div className="grid flex-1 place-items-center bg-[#F5F7F2]"><LoaderCircle className="h-8 w-8 animate-spin text-[#0AA883]" /></div></>;

  if (!stableEligible || !kycVerified) return <><Header title={t("Cuentas receptoras")} subtitle={t("Acceso controlado")} /><div className="grid flex-1 place-items-center bg-[#F5F7F2] p-5"><div className="pathline-surface max-w-lg rounded-[2rem] p-8 text-center"><ShieldCheck className="mx-auto h-12 w-12 text-[#0AA883]"/><h1 className="mt-4 text-2xl font-semibold">{t("Tu acceso Stable está en revisión")}</h1><p className="mt-2 text-sm text-[#071A2D]/52">{t("Patzi debe aprobar tu KYC y habilitar este servicio.")}</p></div></div></>;

  return (
    <>
      <Header title={t("Cuentas receptoras")} subtitle={t("Consulta los datos bancarios antes de enviar tus USD")} />
      <main className="pathline-grid flex-1 bg-[#F5F7F2] p-4 sm:p-6 xl:p-8">
        <div className="mx-auto max-w-5xl">
          <section className="overflow-hidden rounded-[1.8rem] border border-[#071A2D]/7 bg-white p-5 shadow-[0_22px_55px_rgba(7,26,45,.08)] sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-[#071A2D]/8 pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="premium-kicker text-[#087F62]">PATZI USD</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-.025em] sm:text-3xl">{t("Cuentas receptoras")}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#071A2D]/52">{t("Consulta y copia los datos bancarios antes de enviar tus USD.")}</p>
              </div>
              <Link href="/dashboard/stable"><Button className="h-11 bg-[#0AA883] px-5 text-white hover:bg-[#087F62]"><Plus className="mr-2 h-4 w-4" />{t("Registrar depósito")}</Button></Link>
            </div>

            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{t(error)}</div>}

            <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
              {availableAccounts.map((account) => {
                const expanded = activeExpandedId === account.id;
                const lastFour = account.accountNumber.slice(-4);
                const rows = [
                  [t("Beneficiario"), account.holder, "holder"],
                  [t("Banco"), account.bank, "bank"],
                  [t("Número de cuenta"), account.accountNumber, "account"],
                  ...(account.achEnabled ? [["ACH routing", account.achRouting, "ach"]] : []),
                  ...(account.wireEnabled ? [["Wire routing", account.wireRouting, "wire"]] : []),
                  ...(account.swift ? [["SWIFT", account.swift, "swift"]] : []),
                  [t("Tipo de cuenta"), account.accountType, "type"],
                  ...(account.instructions ? [[t("Dirección bancaria"), bankAddress(account.instructions), "address"]] : []),
                ] as string[][];

                return <article key={account.id} className={`overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none ${expanded ? "border-[#0AA883] shadow-[0_18px_38px_rgba(10,168,131,.1)]" : "border-[#071A2D]/10"}`}>
                  <button type="button" onClick={() => setExpandedId(expanded ? "" : account.id)} aria-expanded={expanded} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${expanded ? "bg-[#E7FAF3] text-[#087F62]" : "bg-[#F5F7F2] text-[#071A2D]/55"}`}><Landmark className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><b className="block truncate text-base">{account.holder}</b><span className="mt-1 block truncate text-xs text-[#071A2D]/48">{account.bank} · •••• {lastFour}</span><span className="mt-2 flex gap-1.5">{account.achEnabled && <span className="rounded-md bg-[#E7FAF3] px-2 py-1 text-[9px] font-semibold text-[#087F62]">ACH</span>}{account.wireEnabled && <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-600">WIRE</span>}</span></span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[#087F62] transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
                  </button>

                  {expanded && <div className="border-t border-[#071A2D]/8 bg-[#FCFDFB] px-4 pb-4 sm:px-5 sm:pb-5">
                    <dl>{rows.map(([label, value, key]) => <div key={key} className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_2rem] items-center gap-2 border-b border-[#071A2D]/7 py-3 text-xs"><dt className="text-[#071A2D]/48">{label}</dt><dd className="break-words text-right font-semibold text-[#071A2D]">{value}</dd><button type="button" onClick={() => void copyValue(value, `${account.id}-${key}`)} aria-label={`${t("Copiar")} ${label}`} className="grid h-8 w-8 place-items-center rounded-lg text-[#087F62] transition hover:bg-[#E7FAF3] active:scale-95">{copied === `${account.id}-${key}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>)}</dl>
                    <button type="button" onClick={() => void copyValue(accountCopyText(account), `${account.id}-all`)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071A2D] px-4 text-sm font-semibold text-white transition hover:bg-[#123149] active:scale-[.99]"><Copy className="h-4 w-4" />{copied === `${account.id}-all` ? t("Datos bancarios copiados") : t("Copiar todos los datos bancarios")}</button>
                  </div>}
                </article>;
              })}
            </div>

            {availableAccounts.length === 0 && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><Landmark className="mx-auto h-7 w-7 text-amber-600"/><p className="mt-3 text-sm font-semibold text-amber-800">{t("No hay cuentas receptoras disponibles en este momento.")}</p></div>}

            <div className="mt-6 rounded-2xl bg-[#E7FAF3]/65 p-4 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
              <p className="text-xs leading-5 text-[#087F62]">{t("¿Ya enviaste el dinero? Registra el depósito y carga el comprobante.")}</p>
              <Link href="/dashboard/stable" className="mt-3 inline-flex text-xs font-semibold text-[#071A2D] underline underline-offset-4 sm:mt-0">{t("Ir a depósitos")}</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
