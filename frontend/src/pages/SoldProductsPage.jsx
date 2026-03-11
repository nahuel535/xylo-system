import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";

export default function SoldProductsPage() {
  const [products, setProducts] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const [productsRes, exchangeRes] = await Promise.all([
          api.get("/products/"),
          api.get("/exchange-rates/active"),
        ]);

        const soldProducts = productsRes.data.filter(
          (product) => product.status === "sold"
        );

        setProducts(soldProducts);
        setExchange(exchangeRes.data);
      } catch (error) {
        console.error("Error cargando productos vendidos:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const capacities = useMemo(() => {
    return [...new Set(products.map((p) => p.storage).filter(Boolean))];
  }, [products]);

  const conditions = useMemo(() => {
    return [...new Set(products.map((p) => p.condition_type).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const text = search.toLowerCase();

      const matchesSearch =
        !text ||
        product.model?.toLowerCase().includes(text) ||
        product.imei?.toLowerCase().includes(text) ||
        product.color?.toLowerCase().includes(text) ||
        product.storage?.toLowerCase().includes(text);

      const matchesCapacity =
        !capacityFilter || product.storage === capacityFilter;

      const matchesCondition =
        !conditionFilter || product.condition_type === conditionFilter;

      return matchesSearch && matchesCapacity && matchesCondition;
    });
  }, [products, search, capacityFilter, conditionFilter]);

  return (
    <div>
      <Header
        title="Vendidos"
        subtitle="Historial visual de equipos vendidos"
      />

      <div className="bg-base-card border border-base-border rounded-xl p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar por modelo, IMEI, color o capacidad"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          />

          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Todas las capacidades</option>
            {capacities.map((capacity) => (
              <option key={capacity} value={capacity} className="text-black">
                {capacity}
              </option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Todas las condiciones</option>
            {conditions.map((condition) => (
              <option key={condition} value={condition} className="text-black">
                {condition}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCapacityFilter("");
              setConditionFilter("");
            }}
            className="bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-3"
          >
            Limpiar filtros
          </button>

          <div className="text-sm text-base-muted flex items-center">
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="bg-base-card border border-base-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-base-muted">
            <tr>
              <th className="text-left px-5 py-4">Modelo</th>
              <th className="text-left px-5 py-4">Capacidad</th>
              <th className="text-left px-5 py-4">Color</th>
              <th className="text-left px-5 py-4">IMEI</th>
              <th className="text-left px-5 py-4">Estado</th>
              <th className="text-left px-5 py-4">Costo USD</th>
              <th className="text-left px-5 py-4">Venta USD</th>
              <th className="text-left px-5 py-4">Venta ARS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-5 py-4 text-base-muted">
                  Cargando productos vendidos...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-4 text-base-muted">
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-white/5">
                  <td className="px-5 py-4">
                    <Link
                      to={`/products/${product.id}`}
                      className="text-xylo-300 hover:text-xylo-200 hover:underline"
                    >
                      {product.model}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{product.storage || "-"}</td>
                  <td className="px-5 py-4">{product.color || "-"}</td>
                  <td className="px-5 py-4">{product.imei}</td>
                  <td className="px-5 py-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white">
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">USD {product.purchase_price_usd}</td>
                  <td className="px-5 py-4">USD {product.suggested_sale_price_usd}</td>
                  <td className="px-5 py-4">
                    {exchange
                      ? `ARS ${toArs(product.suggested_sale_price_usd, exchange.sell_rate_ars)}`
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}