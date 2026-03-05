import Calculator from "./Calculator";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="text-white">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
            <Star className="w-3 h-3 mr-1 fill-emerald-400" /> Más de 12,000 clientes satisfechos
          </Badge>

          <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Envía dinero a{" "}
            <span className="text-emerald-400">Perú y Venezuela</span>{" "}
            al mejor precio
          </h1>

          <p className="text-xl text-blue-200 mb-8 leading-relaxed">
            Transferencias internacionales rápidas, seguras y con las tasas más competitivas del mercado. Sin complicaciones, desde tu móvil o computadora.
          </p>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Regulado y certificado</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-xs">✓</span>
              </div>
              <span>Tasas garantizadas</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-xs">✓</span>
              </div>
              <span>Sin cargos ocultos</span>
            </div>
          </div>

          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-white">€0.99</p>
              <p className="text-sm text-blue-300">desde por envío</p>
            </div>
            <div className="border-l border-white/20 pl-8">
              <p className="text-3xl font-bold text-white">{"< 5 min"}</p>
              <p className="text-sm text-blue-300">tiempo de envío Express</p>
            </div>
            <div className="border-l border-white/20 pl-8">
              <p className="text-3xl font-bold text-white">170+</p>
              <p className="text-sm text-blue-300">países destino</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Calculator />
        </div>
      </div>
    </section>
  );
}
