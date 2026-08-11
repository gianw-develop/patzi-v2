"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const payload = JSON.stringify({
      message: error.message,
      digest: error.digest,
      path: window.location.href,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/client-errors", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/client-errors", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    }
  }, [error]);

  return (
    <html lang="es" translate="no">
      <body className="notranslate m-0 grid min-h-screen place-items-center bg-[#F2F6F3] px-5 text-[#071A2D]">
        <main className="w-full max-w-md rounded-[2rem] border border-[#071A2D]/10 bg-white p-8 text-center shadow-[0_30px_70px_rgba(7,26,45,.14)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E7FAF3] text-2xl">P</div>
          <h1 className="mt-5 text-2xl font-semibold">Vamos a recuperar tu acceso</h1>
          <p className="mt-3 text-sm leading-6 text-[#071A2D]/60">Tu cuenta está segura. Recarga Patzi para continuar con la confirmación.</p>
          <button onClick={reset} className="mt-6 h-12 w-full rounded-xl bg-[#071A2D] text-sm font-semibold text-white">Reintentar</button>
          <a href="/auth/login" className="mt-4 block text-sm font-semibold text-[#087F62]">Ir a iniciar sesión</a>
        </main>
      </body>
    </html>
  );
}
