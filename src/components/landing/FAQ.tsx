"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "¿Cuánto tarda en llegar el dinero?",
    a: "La mayoría de las transferencias llegan en 30 minutos. En casos excepcionales puede tardar hasta 2 horas. El tiempo depende del método de entrega y el banco receptor en destino.",
  },
  {
    q: "¿Es seguro enviar dinero con Patzi?",
    a: "Sí. Usamos cifrado SSL/TLS de 256 bits, verificación de identidad KYC y fondos segregados en cuentas bancarias reguladas. Tu dinero está protegido en todo momento.",
  },
  {
    q: "¿Qué documentos necesito para registrarme?",
    a: "Solo necesitas un correo electrónico para empezar. Para transferencias mayores o para desbloquear todos los límites, solicitamos una foto de tu documento de identidad (DNI, pasaporte o NIE).",
  },
  {
    q: "¿Cuáles son los límites de envío?",
    a: "Sin verificación puedes enviar hasta €500 al mes. Con verificación KYC el límite sube a €10,000 mensuales. Para necesidades empresariales, contáctanos para límites personalizados.",
  },
  {
    q: "¿A qué países puedo enviar dinero?",
    a: "Actualmente operamos corredores hacia Perú (PEN) y Venezuela (VES), tanto desde EUR como desde USD. Estamos trabajando para añadir más países próximamente.",
  },
  {
    q: "¿Cómo instalo la app en mi móvil?",
    a: "Patzi es una aplicación web progresiva (PWA). En iPhone: abre patzi.net en Safari, toca compartir y selecciona 'Añadir a pantalla de inicio'. En Android: abre Chrome, toca los tres puntos y selecciona 'Añadir a pantalla de inicio'.",
  },
  {
    q: "¿Qué pasa si algo sale mal con mi transferencia?",
    a: "En el improbable caso de un error, tu dinero está completamente protegido. Nuestro equipo de soporte resuelve cualquier incidencia en menos de 24 horas y garantizamos el reembolso completo si la transferencia no se completa.",
  },
  {
    q: "¿Puedo cancelar una transferencia?",
    a: "Puedes cancelar una transferencia mientras esté en estado 'Pendiente'. Una vez procesada, no es posible cancelarla. Si tienes dudas, contáctanos antes de confirmar el envío.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Preguntas frecuentes</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2 mb-4">Todo lo que necesitas saber</h2>
          <p className="text-base sm:text-lg text-slate-500">
            ¿Tienes dudas? Aquí respondemos las preguntas más comunes.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-slate-800 text-sm sm:text-base">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
