import Link from "next/link";
import { Zap, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-white">Patzi</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5">
              La forma más rápida y económica de enviar dinero a Latinoamérica.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:soporte@patzi.net" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" /> soporte@patzi.net
              </a>
              <a href="tel:+34900000000" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" /> +34 900 000 000
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</Link></li>
              <li><Link href="#paises" className="hover:text-white transition-colors">Países</Link></li>
              <li><Link href="#tasas" className="hover:text-white transition-colors">Tasas de cambio</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Billetera EUR/USD</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Sobre nosotros</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Empleos</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Prensa</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Términos y condiciones</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Política de privacidad</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Política de cookies</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cumplimiento AML</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2026 Patzi Financial S.L. · patzi.net · Todos los derechos reservados.</p>
            <p className="text-xs text-slate-500">
              Patzi está regulado bajo la normativa europea de servicios de pago (PSD2). Número de registro: PATZI-2026-001
            </p>
          </div>
          <div className="flex justify-center border-t border-slate-800/60 pt-4">
            <p className="text-xs text-slate-600">
              Creado por{" "}
              <a
                href="https://gianweb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-300 transition-colors font-medium"
              >
                GianWeb
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
