import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    async function loadProducts() {
      try {
        const [productsRes, exchangeRes] = await Promise.all([
          api.get("/products/"),
          api.get("/exchange-rates/active"),
        ]);
        setProducts(productsRes.data.filter((p) => p.status === "in_stock"));
        setExchange(exchangeRes.data);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const models = useMemo(() => [...new Set(products.map((p) => p.model).filter(Boolean))], [products]);
  const capacities = useMemo(() => [...new Set(products.map((p) => p.storage).filter(Boolean))], [products]);
  const colors = useMemo(() => [...new Set(products.map((p) => p.color).filter(Boolean))], [products]);
  const conditions = useMemo(() => [...new Set(products.map((p) => p.condition_type).filter(Boolean))], [products]);

  const activeFilters = [search, modelFilter, capacityFilter, colorFilter, conditionFilter, minPrice, maxPrice].filter(Boolean).length;

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setSearch("");
    setModelFilter("");
    setCapacityFilter("");
    setColorFilter("");
    setConditionFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSortField(null);
  }

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const text = search.toLowerCase();
      const matchesSearch =
        !text ||
        p.model?.toLowerCase().includes(text) ||
        p.imei?.toLowerCase().includes(text) ||
        p.color?.toLowerCase().includes(text) ||
        p.storage?.toLowerCase().includes(text);

      return (
        matchesSearch &&
        (!modelFilter || p.model === modelFilter) &&
        (!capacityFilter || p.storage === capacityFilter) &&
        (!colorFilter || p.color === colorFilter) &&
        (!conditionFilter || p.condition_type === conditionFilter) &&
        (!minPrice || Number(p.suggested_sale_price_usd) >= Number(minPrice)) &&
        (!maxPrice || Number(p.suggested_sale_price_usd) <= Number(maxPrice))
      );
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField] ?? "";
        const bVal = b[sortField] ?? "";
        const cmp = typeof aVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [products, search, modelFilter, capacityFilter, colorFilter, conditionFilter, minPrice, maxPrice, sortField, sortDir]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={14} className="inline ml-1 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp size={14} className="inline ml-1 text-xylo-400" />
      : <ChevronDown size={14} className="inline ml-1 text-xylo-400" />;
  };

  const ThSortable = ({ field, children }) => (
    <th
      className="text-left px-5 py-4 cursor-pointer select-none hover:text-white transition"
      onClick={() => handleSort(field)}
    >
      {children}<SortIcon field={field} />
    </th>
  );

  return (
    <div>
      <Header title="Stock" subtitle="Listado de equipos disponibles" />

      {/* Filtros */}
      <div className="bg-base-card border border-base-border rounded-xl p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por modelo, IMEI, color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none sm:col-span-2 xl:col-span-1"
          />

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Todos los modelos</option>
            {models.map((m) => <option key={m} value={m} className="text-black">{m}</option>)}
          </select>

          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Todas las capacidades</option>
            {capacities.map((c) => <option key={c} value={c} className="text-black">{c}</option>)}
          </select>

          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Todos los colores</option>
            {colors.map((c) => <option key={c} value={c} className="text-black">{c}</option>)}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Todas las condiciones</option>
            {conditions.map((c) => <option key={c} value={c} className="text-black">{c}</option>)}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Precio min USD"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
            />
            <input
              type="number"
              placeholder="Precio max USD"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={clearFilters}
            className="bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-2 text-sm"
          >
            Limpiar filtros {activeFilters > 0 && <span className="ml-1 bg-xylo-500 text-white text-xs px-1.5 py-0.5 rounded-full">{activeFilters}</span>}
          </button>
          <span className="text-sm text-base-muted">
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-base-card border border-base-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-base-muted">
            <tr>
              <ThSortable field="model">Modelo</ThSortable>
              <ThSortable field="storage">Capacidad</ThSortable>
              <ThSortable field="color">Color</ThSortable>
              <th className="text-left px-5 py-4">IMEI</th>
              <ThSortable field="battery_health">Batería</ThSortable>
              <ThSortable field="cosmetic_condition">Estado estético</ThSortable>
              <ThSortable field="condition_type">Condición</ThSortable>
              <ThSortable field="purchase_price_usd">Costo USD</ThSortable>
              <ThSortable field="suggested_sale_price_usd">Venta USD</ThSortable>
              <th className="text-left px-5 py-4">Venta ARS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="px-5 py-4 text-base-muted">Cargando productos...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="10" className="px-5 py-4 text-base-muted">No hay productos que coincidan.</td></tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-5 py-4">
                    <Link to={`/products/${product.id}`} className="text-xylo-300 hover:underline">
                      {product.model}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{product.storage}</td>
                  <td className="px-5 py-4">{product.color}</td>
                  <td className="px-5 py-4 font-mono text-xs">{product.imei}</td>
                  <td className="px-5 py-4">
                    {product.battery_health ? (
                      <span className={`text-xs font-medium ${product.battery_health >= 85 ? "text-green-400" : product.battery_health >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                        {product.battery_health}%
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-4 text-xs">{product.cosmetic_condition || "-"}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-xylo-500/20 text-xylo-300">
                      {product.condition_type || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4">USD {product.purchase_price_usd}</td>
                  <td className="px-5 py-4">USD {product.suggested_sale_price_usd}</td>
                  <td className="px-5 py-4">
                    {exchange ? `ARS ${toArs(product.suggested_sale_price_usd, exchange.sell_rate_ars)}` : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-base-muted text-sm">Cargando productos...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-base-muted text-sm">No hay productos que coincidan.</p>
        ) : (
          filteredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="block bg-base-card border border-base-border rounded-xl p-4 hover:border-xylo-500/50 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-xylo-300">{product.model}</p>
                  <p className="text-xs text-base-muted">{product.storage} · {product.color}</p>
                </div>
                {product.battery_health && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.battery_health >= 85 ? "bg-green-500/20 text-green-400" : product.battery_health >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                    🔋 {product.battery_health}%
                  </span>
                )}
              </div>
              <p className="text-xs text-base-muted font-mono mb-3">{product.imei}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">USD {product.suggested_sale_price_usd}</span>
                {exchange && (
                  <span className="text-xs text-base-muted">
                    ARS {toArs(product.suggested_sale_price_usd, exchange.sell_rate_ars)}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}