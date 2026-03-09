import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "María G.",
    country: "España → Perú",
    initials: "MG",
    color: "bg-blue-600",
    stars: 5,
    text: "Llevo 2 años enviando dinero a mi familia en Lima y Patzi es de lejos la opción más rápida y económica. El dinero llega el mismo día.",
  },
  {
    name: "Carlos R.",
    country: "España → Venezuela",
    initials: "CR",
    color: "bg-emerald-600",
    stars: 5,
    text: "Increíble plataforma. La tasa que ofrecen es mucho mejor que en el banco y mi familia en Caracas lo recibe en minutos. 100% recomendado.",
  },
  {
    name: "Alejandra M.",
    country: "Francia → Perú",
    initials: "AM",
    color: "bg-violet-600",
    stars: 5,
    text: "Sencilla, rápida y sin comisiones escondidas. Ya he hecho más de 20 transferencias y siempre ha sido una experiencia perfecta.",
  },
  {
    name: "José P.",
    country: "Alemania → Venezuela",
    initials: "JP",
    color: "bg-orange-500",
    stars: 5,
    text: "La app funciona perfectamente en el móvil. Me la instalé en iPhone en menos de un minuto y ahora envío dinero desde cualquier lugar.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Opiniones reales</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2 mb-4">Lo que dicen nuestros usuarios</h2>
          <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
            Miles de personas ya confían en Patzi para enviar dinero a sus familias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 flex-1 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.country}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
