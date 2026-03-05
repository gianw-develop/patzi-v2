import { CORRIDORS, CURRENCY_INFO, EXCHANGE_RATES } from "@/lib/exchange-rates";
import { Badge } from "@/components/ui/badge";
import { Zap, Banknote, Smartphone, Building2 } from "lucide-react";

const DELIVERY_ICONS = {
  bank: Building2,
  cash: Banknote,
  mobile_money: Smartphone,
  home_delivery: Banknote,
};

const DELIVERY_LABELS = {
  bank: "Banco",
  cash: "Efectivo",
  mobile_money: "Móvil",
  home_delivery: "Domicilio",
};

export default function Corridors() {
  return (
    <section id="paises" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Corredores disponibles</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-4">
            ¿A dónde puedes enviar?
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Envía EUR y USD directamente a Perú y Venezuela con múltiples opciones de entrega.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORRIDORS.map((corridor) => {
            const rateKey = `${corridor.from}-${corridor.to}`;
            const rate = EXCHANGE_RATES[rateKey];
            const fromInfo = CURRENCY_INFO[corridor.from];
            const toInfo = CURRENCY_INFO[corridor.to];

            return (
              <div
                key={rateKey}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <span className="text-3xl">{fromInfo.flag}</span>
                      <span className="text-xl mx-1.5 text-slate-400">→</span>
                      <span className="text-3xl">{toInfo.flag}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {corridor.from} → {corridor.to}
                      </p>
                      <p className="text-xs text-slate-500">{corridor.country_name}</p>
                    </div>
                  </div>
                  {corridor.express_available && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                      <Zap className="w-3 h-3 mr-1" /> Express
                    </Badge>
                  )}
                </div>

                {rate && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Tasa de cambio</p>
                    <p className="text-lg font-bold text-blue-900">
                      1 {corridor.from} = {rate.rate.toFixed(4)} {corridor.to}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tarifa desde {fromInfo.symbol}{rate.fee_fixed.toFixed(2)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Métodos de entrega</p>
                  <div className="flex flex-wrap gap-2">
                    {corridor.delivery_methods.map((method) => {
                      const Icon = DELIVERY_ICONS[method];
                      return (
                        <span
                          key={method}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          <Icon className="w-3 h-3" />
                          {DELIVERY_LABELS[method]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
