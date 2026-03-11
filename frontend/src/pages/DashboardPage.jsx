import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryRes, exchangeRes] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/exchange-rates/active"),
        ]);

        setSummary(summaryRes.data);
        setExchange(exchangeRes.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="text-base-muted">Cargando dashboard...</p>;
  }

  if (!summary) {
    return <p className="text-base-muted">No se pudo cargar el dashboard.</p>;
  }

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Resumen general del negocio"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard
          label="Productos en stock"
          value={summary.total_products_in_stock}
        />
        <StatCard
          label="Valor del stock"
          value={`USD ${summary.total_stock_value_usd}`}
        />
        <StatCard
          label="Ventas totales"
          value={summary.total_sales_count}
        />
        <StatCard
          label="Ganancia bruta"
          value={`USD ${summary.total_gross_profit_usd}`}
        />
      </div>

      {exchange && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            label="Dólar compra Córdoba"
            value={`ARS ${formatNumber(exchange.buy_rate_ars)}`}
          />
          <StatCard
            label="Dólar venta Córdoba"
            value={`ARS ${formatNumber(exchange.sell_rate_ars)}`}
          />
          <StatCard
            label="Modo cotización"
            value={exchange.mode === "manual" ? "Manual" : "Automático"}
          />
        </div>
      )}
    </div>
  );
}

function formatNumber(value) {
  return Number(value).toLocaleString("es-AR");
}