import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";

export default function SalesPage() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [salesRes, productsRes, usersRes] = await Promise.all([
          api.get("/sales/"),
          api.get("/products/"),
          api.get("/users/"),
        ]);
        setSales(salesRes.data);
        const productDictionary = {};
        productsRes.data.forEach((p) => { productDictionary[p.id] = p; });
        setProductsMap(productDictionary);
        const userDictionary = {};
        usersRes.data.forEach((u) => { userDictionary[u.id] = u; });
        setUsersMap(userDictionary);
      } catch (error) {
        console.error("Error cargando ventas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sellers = useMemo(() => Object.values(usersMap), [usersMap]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const product = productsMap[sale.product_id];
      const seller = usersMap[sale.seller_id];
      const text = search.toLowerCase();
      const matchesSearch =
        !text ||
        product?.model?.toLowerCase().includes(text) ||
        product?.imei?.toLowerCase().includes(text) ||
        sale.client_name?.toLowerCase().includes(text) ||
        seller?.name?.toLowerCase().includes(text);
      return matchesSearch && (!sellerFilter || String(sale.seller_id) === sellerFilter);
    });
  }, [sales, productsMap, usersMap, search, sellerFilter]);

  const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

  return (
    <div>
      <Header title="Ventas" subtitle="Historial de operaciones realizadas" />

      {/* Filtros */}
      <div className="bg-base-card border border-base-border rounded-2xl p-5 mb-5 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Buscar por modelo, IMEI, cliente o vendedor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos los vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>{seller.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setSearch(""); setSellerFilter(""); }}
            className="bg-base-subtle hover:bg-base-border transition rounded-xl px-4 py-2 text-sm text-base-muted"
          >
            Limpiar filtros
          </button>
          <span className="text-sm text-base-muted">
            {filteredSales.length} venta{filteredSales.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-base-card border border-base-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-base-subtle border-b border-base-border">
            <tr>
              {["Fecha", "Producto", "Cliente", "Vendedor", "Venta", "Ganancia", "Pagos"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-base-muted uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-5 py-6 text-base-muted text-sm">Cargando ventas...</td></tr>
            ) : filteredSales.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-6 text-base-muted text-sm">No hay ventas que coincidan.</td></tr>
            ) : (
              filteredSales.map((sale) => {
                const product = productsMap[sale.product_id];
                const seller = usersMap[sale.seller_id];
                return (
                  <tr
                    key={sale.id}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                    className="border-t border-base-border cursor-pointer hover:bg-base-subtle/50 transition"
                  >
                    <td className="px-5 py-3.5 text-base-muted text-xs">{formatDate(sale.sale_date)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-base-text">{product?.model || `#${sale.product_id}`}</p>
                      <p className="text-xs text-base-muted font-mono">{product?.imei || "-"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-base-text">{sale.client_name || "-"}</td>
                    <td className="px-5 py-3.5 text-base-text">{seller?.name || `#${sale.seller_id}`}</td>
                    <td className="px-5 py-3.5 font-medium text-base-text">USD {sale.sale_price_usd}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xylo-500 font-medium">USD {sale.gross_profit_usd}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-base-subtle text-base-muted text-xs px-2 py-1 rounded-full">
                        {sale.payments?.length || 0}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-base-muted text-sm">Cargando ventas...</p>
        ) : filteredSales.length === 0 ? (
          <p className="text-base-muted text-sm">No hay ventas que coincidan.</p>
        ) : (
          filteredSales.map((sale) => {
            const product = productsMap[sale.product_id];
            const seller = usersMap[sale.seller_id];
            return (
              <div
                key={sale.id}
                onClick={() => navigate(`/sales/${sale.id}`)}
                className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card cursor-pointer hover:border-xylo-500/40 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-base-text">{product?.model || `#${sale.product_id}`}</p>
                    <p className="text-xs text-base-muted">{sale.client_name || "Sin cliente"} · {seller?.name}</p>
                  </div>
                  <span className="text-xylo-500 font-semibold text-sm">USD {sale.sale_price_usd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-base-muted">{formatDate(sale.sale_date)}</span>
                  <span className="text-xs text-green-500 font-medium">+USD {sale.gross_profit_usd}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}