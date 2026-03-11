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
        productsRes.data.forEach((product) => {
          productDictionary[product.id] = product;
        });
        setProductsMap(productDictionary);

        const userDictionary = {};
        usersRes.data.forEach((user) => {
          userDictionary[user.id] = user;
        });
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

      const matchesSeller =
        !sellerFilter || String(sale.seller_id) === sellerFilter;

      return matchesSearch && matchesSeller;
    });
  }, [sales, productsMap, usersMap, search, sellerFilter]);

  return (
    <div>
      <Header
        title="Ventas"
        subtitle="Historial de operaciones realizadas"
      />

      <div className="bg-base-card border border-base-border rounded-xl p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Buscar por modelo, IMEI, cliente o vendedor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          />

          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          >
            <option value="">Todos los vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id} className="text-black">
                {seller.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSellerFilter("");
            }}
            className="bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-3"
          >
            Limpiar filtros
          </button>

          <div className="text-sm text-base-muted flex items-center">
            {filteredSales.length} venta{filteredSales.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="bg-base-card border border-base-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-base-muted">
            <tr>
              <th className="text-left px-5 py-4">Fecha</th>
              <th className="text-left px-5 py-4">Producto</th>
              <th className="text-left px-5 py-4">Cliente</th>
              <th className="text-left px-5 py-4">Vendedor</th>
              <th className="text-left px-5 py-4">Venta</th>
              <th className="text-left px-5 py-4">Ganancia</th>
              <th className="text-left px-5 py-4">Pagos</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-4 text-base-muted">
                  Cargando ventas...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-4 text-base-muted">
                  No hay ventas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => {
                const product = productsMap[sale.product_id];
                const seller = usersMap[sale.seller_id];

                return (
                  <tr
                    key={sale.id}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                    className="border-t border-white/5 cursor-pointer hover:bg-white/5"
                  >
                    <td className="px-5 py-4">{formatDate(sale.sale_date)}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">{product?.model || `#${sale.product_id}`}</p>
                        <p className="text-xs text-base-muted">{product?.imei || "-"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">{sale.client_name || "-"}</td>
                    <td className="px-5 py-4">{seller?.name || `#${sale.seller_id}`}</td>
                    <td className="px-5 py-4">USD {sale.sale_price_usd}</td>
                    <td className="px-5 py-4 text-xylo-300">USD {sale.gross_profit_usd}</td>
                    <td className="px-5 py-4">{sale.payments?.length || 0}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}