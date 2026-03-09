import { Smartphone, Monitor, Globe, Download, Bell, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

const STEPS_IOS = [
  "Abre patzi.net en Safari",
  "Toca el botón Compartir (cuadrado con flecha)",
  "Selecciona \"Añadir a pantalla de inicio\"",
];

const STEPS_ANDROID = [
  "Abre patzi.net en Chrome",
  "Toca los tres puntos del menú",
  "Selecciona \"Añadir a pantalla de inicio\"",
];

export default function Corridors() {
  return (
    <section id="paises" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Aplicación web progresiva</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-4">
            Disponible en todos tus dispositivos
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Patzi funciona como una app nativa en tu móvil, tablet o computadora — sin pasar por App Store ni Google Play.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-blue-900" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">iOS y Android</h3>
            <p className="text-sm text-slate-500">
              Instálala en tu teléfono con un solo toque. Se abre como cualquier otra app, sin ocupar espacio de almacenamiento.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Computadora y tablet</h3>
            <p className="text-sm text-slate-500">
              Accede desde Chrome, Safari o Firefox en cualquier dispositivo. Sin descargas, sin actualizaciones manuales.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Siempre actualizada</h3>
            <p className="text-sm text-slate-500">
              Cada vez que abres Patzi tienes la versión más reciente automáticamente. Sin visitar ninguna tienda de apps.
            </p>
          </div>
        </div>

        {/* Installation steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Instalar en iPhone / iPad</h3>
            </div>
            <ol className="space-y-3">
              {STEPS_IOS.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm text-slate-600">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.341c-.86.495-1.96.495-2.82 0L12 13.82l-2.703 1.521c-.86.495-1.96.495-2.82 0L3 13.341V17c0 1.657 4.029 3 9 3s9-1.343 9-3v-3.659l-3.477 1.999zM3 7.341c0-1.657 4.029-3 9-3s9 1.343 9 3v3.659l-3.477-1.999c-.86-.495-1.96-.495-2.82 0L12 10.521 9.297 8.999c-.86-.495-1.96-.495-2.82 0L3 11v-3.659z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Instalar en Android</h3>
            </div>
            <ol className="space-y-3">
              {STEPS_ANDROID.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm text-slate-600">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Bottom banner */}
        <div className="bg-blue-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Empieza ahora mismo</h3>
              <p className="text-blue-300 text-sm mt-0.5">Abre patzi.net en tu móvil y agrégala a tu pantalla de inicio en segundos.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-300"><CheckCircle className="w-4 h-4" /> Sin App Store</span>
            <span className="flex items-center gap-1.5 text-emerald-300"><Shield className="w-4 h-4" /> Conexión segura</span>
            <span className="flex items-center gap-1.5 text-emerald-300"><Download className="w-4 h-4" /> Instalación en 1 tap</span>
          </div>
        </div>

      </div>
    </section>
  );
}
