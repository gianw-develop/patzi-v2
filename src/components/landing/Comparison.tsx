import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

const ROWS = [
  { feature: "Comisión por envío", patzi: "GRATIS", bank: "€15 – €35", wu: "€5 – €20" },
  { feature: "Tasa de cambio", patzi: "Tasa de mercado", bank: "Margen del 3–5%", wu: "Margen del 2–4%" },
  { feature: "Velocidad de entrega", patzi: "30 min – 2 h", bank: "1 – 5 días hábiles", wu: "10 min – 1 día" },
  { feature: "Sin cuenta bancaria destino", patzi: true, bank: false, wu: true },
  { feature: "App móvil sin instalación", patzi: true, bank: null, wu: false },
  { feature: "Transparencia de tasas", patzi: true, bank: false, wu: false },
  { feature: "Sin comisiones ocultas", patzi: true, bank: false, wu: null },
];

function Cell({ value }: { value: string | boolean | null }) {
  if (typeof value === "string") {
    if (value === "GRATIS") {
      return <span className="text-sm font-bold text-emerald-600 uppercase tracking-wide">{value}</span>;
    }
    return <span className="text-sm font-medium text-slate-700">{value}</span>;
  }
  if (value === true) return <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />;
  if (value === false) return <XCircle className="w-5 h-5 text-red-400 mx-auto" />;
  return <MinusCircle className="w-5 h-5 text-slate-300 mx-auto" />;
}

export default function Comparison() {
  return (
    <section id="comparativa" className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Comparativa</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2 mb-4">Patzi vs la competencia</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Compara y decide. Los números hablan por sí solos.
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[580px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
              <div className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Característica</div>
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-1.5 bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  ⚡ Patzi
                </div>
              </div>
              <div className="p-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Banco</div>
              <div className="p-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Western Union</div>
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 items-center border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
              >
                <div className="p-4 text-sm text-slate-600 font-medium">{row.feature}</div>
                <div className="p-4 text-center">
                  <Cell value={row.patzi} />
                </div>
                <div className="p-4 text-center">
                  <Cell value={row.bank} />
                </div>
                <div className="p-4 text-center">
                  <Cell value={row.wu} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          * Datos aproximados basados en tarifas públicas. Pueden variar según importe y destino.
        </p>
      </div>
    </section>
  );
}
