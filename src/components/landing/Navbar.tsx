"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-blue-900">Patzi</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#como-funciona" className="text-sm text-slate-600 hover:text-blue-900 transition-colors">
              Cómo funciona
            </Link>
            <Link href="#paises" className="text-sm text-slate-600 hover:text-blue-900 transition-colors">
              Países
            </Link>
            <Link href="#tasas" className="text-sm text-slate-600 hover:text-blue-900 transition-colors">
              Tasas de cambio
            </Link>
            <Link href="#seguridad" className="text-sm text-slate-600 hover:text-blue-900 transition-colors">
              Seguridad
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild className="text-slate-700">
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
            <Button asChild className="bg-blue-900 hover:bg-blue-800 text-white">
              <Link href="/auth/register">Crear cuenta</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 mt-1">
            <div className="flex flex-col gap-2 pt-3">
              <Link href="#como-funciona" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileOpen(false)}>
                Cómo funciona
              </Link>
              <Link href="#paises" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileOpen(false)}>
                Países
              </Link>
              <Link href="#tasas" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileOpen(false)}>
                Tasas de cambio
              </Link>
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
                <Button asChild className="w-full bg-blue-900 hover:bg-blue-800 text-white">
                  <Link href="/auth/register">Crear cuenta gratis</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
