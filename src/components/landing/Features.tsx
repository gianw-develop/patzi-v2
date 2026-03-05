import { ShieldCheck, Zap, Wallet, Bell, Clock, Globe } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "100% Seguro",
    description: "Encriptación bancaria de extremo a extremo. Tu dinero y datos personales siempre protegidos.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Zap,
    title: "Express en minutos",
    description: "Con la opción Express, tu dinero llega en menos de 5 minutos a cualquier banco en Perú o Venezuela.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Wallet,
    title: "Billetera EUR & USD",
    description: "Recarga tu billetera Patzi en EUR o USD y envía desde ahí cuando quieras, sin esperar transferencias.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Bell,
    title: "Notificaciones en tiempo real",
    description: "Recibe actualizaciones del estado de tu transferencia por email y en la app. Tú y el receptor informados.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Clock,
    title: "Economy: ahorra en tarifa",
    description: "Si no tienes prisa, elige Economy. Tu envío llega en 1-3 días hábiles con tarifa reducida.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: Globe,
    title: "Múltiples métodos de entrega",
    description: "Banco, efectivo en agencias o pago móvil (Pago Móvil para Venezuela). Elige lo más cómodo.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

export default function Features() {
  return (
    <section id="seguridad" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Por qué Patzi</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-4">
            Todo lo que necesitas, en un solo lugar
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Diseñado para que tus envíos sean lo más fácil y económico posible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
