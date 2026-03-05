import { UserPlus, Calculator, Send, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Crea tu cuenta",
    description: "Regístrate gratis en minutos con tu email. Verifica tu identidad subiendo tu documento de identidad.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Calculator,
    step: "02",
    title: "Calcula tu envío",
    description: "Ingresa el monto, elige divisa de origen y destino. Ve exactamente cuánto recibe tu beneficiario.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Send,
    step: "03",
    title: "Realiza el pago",
    description: "Paga desde tu billetera Patzi (EUR/USD) o desde tu banco. Tu dinero sale al instante.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "El receptor recibe",
    description: "Tu beneficiario recibe el dinero en su cuenta bancaria, efectivo o billetera móvil.",
    color: "bg-orange-100 text-orange-700",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Proceso simple</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-4">
            ¿Cómo funciona Patzi?
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            En 4 pasos simples tienes tu dinero viajando al mundo. Sin filas, sin papeleos, sin esperas innecesarias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-1.5rem)] h-px border-t-2 border-dashed border-slate-200 z-0" />
              )}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mb-5 shadow-sm`}>
                  <step.icon className="w-9 h-9" />
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-widest mb-2">{step.step}</span>
                <h3 className="text-lg font-bold text-slate-800 mb-3">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
