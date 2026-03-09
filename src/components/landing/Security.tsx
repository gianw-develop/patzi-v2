import { ShieldCheck, Lock, UserCheck, Eye, Server, Clock } from "lucide-react";

const ITEMS = [
  {
    icon: Lock,
    color: "bg-blue-50 text-blue-700",
    title: "Cifrado SSL/TLS 256 bits",
    desc: "Toda la comunicación entre tu dispositivo y nuestros servidores está cifrada con el mismo estándar que usan los bancos.",
  },
  {
    icon: UserCheck,
    color: "bg-emerald-50 text-emerald-700",
    title: "Verificación KYC",
    desc: "Verificamos la identidad de cada usuario para proteger tu dinero y cumplir con la normativa europea contra el fraude.",
  },
  {
    icon: Eye,
    color: "bg-violet-50 text-violet-700",
    title: "Monitoreo 24/7",
    desc: "Nuestro sistema detecta automáticamente actividades sospechosas y bloquea transacciones fraudulentas en tiempo real.",
  },
  {
    icon: Server,
    color: "bg-orange-50 text-orange-700",
    title: "Fondos segregados",
    desc: "Tu dinero se mantiene separado de los fondos operativos de la empresa, protegido en cuentas bancarias reguladas.",
  },
  {
    icon: Clock,
    color: "bg-rose-50 text-rose-700",
    title: "Tasa garantizada 30 minutos",
    desc: "La tasa de cambio que ves al iniciar tu transferencia se congela durante 30 minutos para que no tengas sorpresas.",
  },
  {
    icon: ShieldCheck,
    color: "bg-cyan-50 text-cyan-700",
    title: "Sin datos almacenados en riesgo",
    desc: "No guardamos datos de tarjetas de crédito ni información bancaria sensible en nuestros servidores.",
  },
];

export default function Security() {
  return (
    <section id="seguridad" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Tu seguridad, primero</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2 mb-4">Protegemos tu dinero en cada paso</h2>
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
            Usamos los mismos estándares de seguridad que los principales bancos europeos para que puedas enviar con total tranquilidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ITEMS.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
