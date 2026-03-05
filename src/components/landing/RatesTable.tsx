import { EXCHANGE_RATES, CURRENCY_INFO } from "@/lib/exchange-rates";
import { TrendingUp } from "lucide-react";

export default function RatesTable() {
  const rates = Object.values(EXCHANGE_RATES);

  return (
    <section id="tasas" className="py-24 bg-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Transparencia total</span>
          <h2 className="text-4xl font-bold text-white mt-2 mb-4">
            Tasas de cambio en tiempo real
          </h2>
          <p className="text-lg text-blue-300 max-w-2xl mx-auto">
            Sin sorpresas. Ves exactamente la tasa antes de confirmar cualquier envío.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-4 bg-white/5 px-6 py-3 text-xs font-semibold text-blue-300 uppercase tracking-wider">
            <span>Par de divisas</span>
            <span className="text-center">Tasa</span>
            <span className="text-center">Tarifa fija</span>
            <span className="text-center">Spread</span>
          </div>
          {rates.map((rate, i) => {
            const fromInfo = CURRENCY_INFO[rate.from_currency];
            const toInfo = CURRENCY_INFO[rate.to_currency];
            return (
              <div
                key={rate.id}
                className={`grid grid-cols-4 px-6 py-4 items-center ${i % 2 === 0 ? "bg-white/3" : ""} hover:bg-white/8 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{fromInfo.flag}</span>
                  <span className="text-white/40 text-sm">→</span>
                  <span className="text-xl">{toInfo.flag}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {rate.from_currency} → {rate.to_currency}
                    </p>
                    <p className="text-blue-400 text-xs">
                      {fromInfo.country} → {toInfo.country}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-emerald-400 font-bold">
                    {fromInfo.symbol}1 = {toInfo.symbol}{rate.rate.toFixed(4)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">
                    {fromInfo.symbol}{rate.fee_fixed.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-1 text-orange-300 text-sm">
                    <TrendingUp className="w-3 h-3" />
                    {rate.markup_percent}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">
          * Tasas actualizadas periódicamente. La tasa exacta se confirma al momento del envío y se garantiza por 30 minutos.
        </p>
      </div>
    </section>
  );
}
