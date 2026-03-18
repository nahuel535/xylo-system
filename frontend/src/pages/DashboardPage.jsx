import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import UsdtCard from "../components/UsdtCard";
import {
  Package, TrendingUp, DollarSign, BarChart2,
  ShoppingBag, Calendar, Clock, CreditCard
} from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [topModels, setTopModels] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryRes, exchangeRes, topModelsRes, paymentRes] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/exchange-rates/active"),
          api.get("/dashboard/top-models"),
          api.get("/dashboard/payment-methods"),
        ]);
        setSummary(summaryRes.data);
        setExchange(exchangeRes.data);
        setTopModels(topModelsRes.data);
        setPaymentMethods(paymentRes.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <p className="text-base-muted">Cargando dashboard...</p>;
  if (!summary) return <p className="text-base-muted">No se pudo cargar el dashboard.</p>;

  const maxSales = topModels[0]?.sales_count || 1;
  const maxPayment = paymentMethods[0]?.total_usd || 1;

  const methodLabels = {
    cash_usd: "Efectivo USD",
    cash_ars: "Efectivo ARS",
    transfer: "Transferencia",
    card: "Tarjeta",
    crypto: "Crypto",
  };

  const methodColors = {
    cash_usd: "bg-green-500",
    cash_ars: "bg-blue-500",
    transfer: "bg-purple-500",
    card: "bg-yellow-500",
    crypto: "bg-orange-500",
  };

  return (
    <div>
      <Header title="Dashboard" subtitle="Resumen general del negocio" />

      {/* Stats principales */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Package size={18} />}
          label="En stock"
          value={summary.total_products_in_stock}
          sub={`USD ${fmt(summary.total_stock_value_usd)} en inventario`}
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<ShoppingBag size={18} />}
          label="Ventas totales"
          value={summary.total_sales_count}
          sub={`USD ${fmt(summary.total_sales_value_usd)} facturado`}
          color="text-xylo-500"
          bg="bg-xylo-50"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Ganancia bruta"
          value={`USD ${fmt(summary.total_gross_profit_usd)}`}
          sub="Acumulada total"
          color="text-green-500"
          bg="bg-green-50"
        />
        <StatCard
          icon={<DollarSign size={18} />}
          label="Dólar venta"
          value={exchange ? `ARS ${formatNumber(exchange.sell_rate_ars)}` : "-"}
          sub={exchange ? `Compra: ARS ${formatNumber(exchange.buy_rate_ars)}` : ""}
          color="text-yellow-500"
          bg="bg-yellow-50"
        />
      </div>

      {/* Stats de hoy y mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-base-subtle rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-base-muted" />
            </div>
            <p className="text-sm font-medium text-base-text">Hoy</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-semibold text-base-text">{summary.sales_today_count}</p>
              <p className="text-sm text-base-muted">ventas</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-base-text">USD {fmt(summary.sales_today_value_usd)}</p>
              <p className="text-sm text-base-muted">facturado</p>
            </div>
          </div>
        </div>

        <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-base-subtle rounded-lg flex items-center justify-center">
              <Calendar size={14} className="text-base-muted" />
            </div>
            <p className="text-sm font-medium text-base-text">Este mes</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-semibold text-base-text">{summary.sales_this_month_count}</p>
              <p className="text-sm text-base-muted">ventas</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-base-text">USD {fmt(summary.sales_this_month_value_usd)}</p>
              <p className="text-sm text-base-muted">facturado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modelos más vendidos + Métodos de pago */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 bg-base-subtle rounded-lg flex items-center justify-center">
              <BarChart2 size={14} className="text-base-muted" />
            </div>
            <p className="text-sm font-medium text-base-text">Modelos más vendidos</p>
          </div>
          {topModels.length === 0 ? (
            <p className="text-sm text-base-muted">Sin datos aún.</p>
          ) : (
            <div className="space-y-3">
              {topModels.slice(0, 6).map((model) => (
                <div key={model.model}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-base-text">{model.model}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-base-muted">USD {fmt(model.total_sales_usd)}</span>
                      <span className="text-xs font-medium text-xylo-500">{model.sales_count} vendidos</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-base-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-xylo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(model.sales_count / maxSales) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 bg-base-subtle rounded-lg flex items-center justify-center">
              <CreditCard size={14} className="text-base-muted" />
            </div>
            <p className="text-sm font-medium text-base-text">Métodos de pago</p>
          </div>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-base-muted">Sin datos aún.</p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.method}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-base-text">{methodLabels[method.method] || method.method}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-base-muted">{method.count} pagos</span>
                      <span className="text-xs font-medium text-green-500">USD {fmt(method.total_usd)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-base-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${methodColors[method.method] || "bg-base-border"}`}
                      style={{ width: `${(method.total_usd / maxPayment) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* USDT */}
      <UsdtCard />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, bg }) {
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <div className={`inline-flex p-2 rounded-xl ${bg} ${color} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-base-text mb-1">{value}</p>
      <p className="text-sm text-base-muted">{label}</p>
      {sub && <p className="text-xs text-base-muted mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

function fmt(value) {
  return Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function formatNumber(value) {
  return Number(value).toLocaleString("es-AR");
}