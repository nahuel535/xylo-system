import { useCriptoYa } from "../hooks/useCriptoYa";
import { Bitcoin } from "lucide-react";

export default function UsdtCard() {
  const { data, loading, error } = useCriptoYa();

  if (loading) return (
    <div className="bg-base-card border border-base-border rounded-xl p-5 animate-pulse">
      <p className="text-sm text-base-muted">Cargando USDT...</p>
    </div>
  );

  if (error) return (
    <div className="bg-base-card border border-base-border rounded-xl p-5">
      <p className="text-sm text-red-400">No se pudo obtener cotización USDT.</p>
    </div>
  );

  return (
    <div className="bg-base-card border border-base-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bitcoin size={16} className="text-yellow-400" />
        <p className="text-sm font-medium">USDT / ARS</p>
        <span className="ml-auto text-xs text-base-muted bg-white/5 px-2 py-0.5 rounded-full">
          Promedio ARS {Math.round(data.avg).toLocaleString("es-AR")}
        </span>
      </div>

      <div className="space-y-2">
        {data.exchanges.map((exchange) => (
          <div key={exchange.name} className="flex items-center justify-between py-2 border-t border-white/5 first:border-0">
            <span className="text-sm font-medium">{exchange.name}</span>
            <div className="flex gap-4 text-sm">
              <div className="text-right">
                <p className="text-xs text-base-muted">Compra</p>
                <p className="text-green-400 font-medium">
                  {exchange.bid.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-muted">Venta</p>
                <p className="text-red-400 font-medium">
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