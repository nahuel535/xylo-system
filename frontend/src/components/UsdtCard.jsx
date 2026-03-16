import { useCriptoYa } from "../hooks/useCriptoYa";
import { Bitcoin, TrendingUp, TrendingDown } from "lucide-react";

export default function UsdtCard() {
  const { data, loading, error } = useCriptoYa();

  if (loading) return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-base-subtle rounded w-32 mb-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-base-subtle rounded-xl" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5">
      <p className="text-sm text-red-500">No se pudo obtener cotización USDT.</p>
    </div>
  );

  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center">
          <Bitcoin size={15} className="text-yellow-600" />
        </div>
        <p className="text-sm font-semibold text-base-text">USDT / ARS</p>
        <span className="ml-auto text-xs text-base-muted bg-base-subtle px-2.5 py-1 rounded-full font-medium">
          Prom. {Math.round(data.avg).toLocaleString("es-AR")}
        </span>
      </div>

      <div className="space-y-1">
        {data.exchanges.map((exchange, i) => (
          <div
            key={exchange.name}
            className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${
              i % 2 === 0 ? "bg-base-subtle" : ""
            }`}
          >
            <span className="text-sm font-medium text-base-text">{exchange.name}</span>
            <div className="flex gap-5 text-sm">
              <div className="text-right">
                <p className="text-xs text-base-muted mb-0.5">Compra</p>
                <p className="text-xylo-500 font-semibold flex items-center gap-1">
                  <TrendingUp size={11} />
                  {exchange.bid.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-muted mb-0.5">Venta</p>
                <p className="text-red-500 font-semibold flex items-center gap-1">
                  <TrendingDown size={11} />
                  {exchange.ask.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}