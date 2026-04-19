import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { ShoppingBag } from "lucide-react";

const inputClass =
  "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

export default function SoldProductsPage() {
  const [products, setProducts] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, exchangeRes] = await Promise.all([
          api.get("/products/"),
          api.get("/exchange-rates/active"),
        ]);
        setProducts(productsRes.data.filter((p) => p.status === "sold"));
        setExchange(exchangeRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const capacities = useMemo(
    () => [...new Set(products.map((p) => p.storage).filter(Boolean))],
    [products]
  );
  const conditions = useMemo(
    () => [...new Set(products.map((p) => p.condition_type).filter(Boolean))],
    [products]
  );

  const filtered = useMemo(() => {
    const text = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !text ||
        p.model?.toLowerCase().includes(text) ||
        p.imei?.toLowerCase().includes(text) ||
        p.color?.toLowerCase().includes(text) ||
        p.storage?.toLowerCase().includes(text);
      return (
        matchSearch &&
        (!capacityFilter || p.storage === capacityFilter) &&
        (!conditionFilter || p.condition_type === conditionFilter)
      );
    });
  }, [products, search, capacityFilter, conditionFilter]);

  function clearFilters() {
    setSearch("");
    setCapacityFilter("");
    setConditionFilter("");
  }

  return (
    <div>
      <Header title="Vendidos" subtitle="Historial de equipos vendidos" />

      {/* Filters */}
      <div className="bg-base-card border border-base-border rounded-2xl p-4 mb-5 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Buscar modelo, IMEI, color…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">Todas las capacidades</option>
            {capacities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">Todas las condiciones</option>
            {conditions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-base-muted">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
          {(search || capacityFilter || conditionFilter) && (
            <button
              onClick={clearFilters}
              className="text-xs text-xylo-500 hover:text-xylo-600 transition font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-base-card border border-base-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-border">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">Modelo</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">Capacidad</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">Color</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">IMEI</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">Estado</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">Costo USD</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">Venta USD</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">Venta ARS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-5 py-6 text-base-muted text-sm">Cargando…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-6 text-base-muted text-sm">No hay resultados.</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-base-border hover:bg-base-subtle transition">
                  <td className="px-5 py-3.5">
                    <Link to={`/products/${p.id}`} className="text-xylo-500 hover:underline font-medium">
                      {p.model}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-base-text">{p.storage || "-"}</td>
                  <td className="px-5 py-3.5 text-base-text">{p.color || "-"}</td>
                  <td className="px-5 py-3.5 text-base-muted font-mono text-xs">{p.imei}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium bg-green-50 text-green-600 px-2.5 py-1 rounded-full">
                      Vendido
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-base-text">USD {p.purchase_price_usd}</td>
                  <td className="px-5 py-3.5 font-semibold text-base-text">USD {p.suggested_sale_price_usd}</td>
                  <td className="px-5 py-3.5 text-base-muted">
                    {exchange ? `ARS ${toArs(p.suggested_sale_price_usd, exchange.sell_rate_ars)}` : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        {loading ? (
          <p className="text-base-muted text-sm">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-base-card border border-base-border rounded-2xl p-10 text-center shadow-card">
            <ShoppingBag size={32} className="mx-auto text-base-muted mb-3 opacity-40" />
            <p className="text-base-muted text-sm">No hay resultados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="block bg-base-card border border-base-border rounded-2xl p-4 shadow-card no-underline"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-base-text text-sm truncate">{p.model}</p>
                    <p className="text-xs text-base-muted mt-0.5">
                      {[p.storage, p.color, p.condition_type].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex-shrink-0">
                    Vendido
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-base-subtle rounded-xl px-3 py-2">
                    <p className="text-[10px] text-base-muted mb-0.5">Costo</p>
                    <p className="text-sm font-medium text-base-text">USD {p.purchase_price_usd}</p>
                  </div>
                  <div className="bg-base-subtle rounded-xl px-3 py-2">
                    <p className="text-[10px] text-base-muted mb-0.5">Venta</p>
                    <p className="text-sm font-semibold text-xylo-500">USD {p.suggested_sale_price_usd}</p>
                  </div>
                </div>

                {exchange && (
                  <p className="text-xs text-base-muted">
                    ARS {toArs(p.suggested_sale_price_usd, exchange.sell_rate_ars)}
                  </p>
                )}

                {p.imei && (
                  <p className="text-[10px] text-base-muted font-mono mt-1 truncate">
                    IMEI: {p.imei}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}
