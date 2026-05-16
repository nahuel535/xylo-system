import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { Smartphone, Cable, Pencil, Trash2, X } from "lucide-react";

export default function SalesPage() {
  const navigate = useNavigate();

  const [iphoneSales, setIphoneSales] = useState([]);
  const [accSales, setAccSales] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "iphone" | "accessory"

  // Edit/delete state for accessory sales
  const [editingAcc, setEditingAcc] = useState(null); // { id, unit_price, notes, name, qty }
  const [savingAcc, setSavingAcc] = useState(false);
  const [accEditError, setAccEditError] = useState("");
  const [confirmDeleteAcc, setConfirmDeleteAcc] = useState(null); // id

  useEffect(() => {
    async function loadData() {
      try {
        const [salesRes, accRes, productsRes, usersRes] = await Promise.all([
          api.get("/sales/"),
          api.get("/accessories/sales/all"),
          api.get("/products/"),
          api.get("/users/"),
        ]);
        setIphoneSales(salesRes.data);
        setAccSales(accRes.data);
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

  const unified = useMemo(() => {
    const iphones = iphoneSales.map((s) => ({
      _key: `i-${s.id}`,
      type: "iphone",
      id: s.id,
      date: s.sale_date,
      name: productsMap[s.product_id]?.model || `iPhone #${s.product_id}`,
      sub: productsMap[s.product_id]?.imei || "",
      client: s.client_name || "-",
      seller: usersMap[s.seller_id]?.name || `#${s.seller_id}`,
      price: Number(s.sale_price_usd),
      profit: Number(s.gross_profit_usd),
      qty: null,
      payments: s.payments?.length || 0,
      clickable: true,
      unit_price: null,
      notes_raw: null,
    }));

    const accs = accSales.map((s) => ({
      _key: `a-${s.id}`,
      type: "accessory",
      id: s.id,
      date: s.sold_at,
      name: s.accessory_name,
      sub: s.accessory_category,
      client: s.notes || "-",
      seller: "-",
      price: s.sale_price_usd * s.quantity_sold,
      profit: s.gross_profit_usd,
      qty: s.quantity_sold,
      payments: null,
      clickable: false,
      unit_price: s.sale_price_usd,
      notes_raw: s.notes || "",
    }));

    return [...iphones, ...accs].sort((a, b) => {
      const da = a.date ? new Date(a.date) : new Date(0);
      const db2 = b.date ? new Date(b.date) : new Date(0);
      return db2 - da;
    });
  }, [iphoneSales, accSales, productsMap, usersMap]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return unified.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (sellerFilter && row.seller !== usersMap[sellerFilter]?.name) return false;
      if (q && !row.name.toLowerCase().includes(q) && !row.client.toLowerCase().includes(q) && !row.seller.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [unified, typeFilter, sellerFilter, search, usersMap]);

  async function saveEditAcc() {
    setSavingAcc(true);
    setAccEditError("");
    try {
      const unitPrice = Number(editingAcc.unit_price);
      await api.put(`/accessories/sales/${editingAcc.id}`, {
        sale_price_usd: unitPrice,
        notes: editingAcc.notes || null,
      });
      setAccSales((prev) =>
        prev.map((s) =>
          s.id === editingAcc.id
            ? {
                ...s,
                sale_price_usd: unitPrice,
                gross_profit_usd: (unitPrice - s.purchase_price_usd) * s.quantity_sold,
                notes: editingAcc.notes || null,
              }
            : s
        )
      );
      setEditingAcc(null);
    } catch {
      setAccEditError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSavingAcc(false);
    }
  }

  async function deleteAcc(id) {
    try {
      await api.delete(`/accessories/sales/${id}`);
      setAccSales((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* ignore */
    } finally {
      setConfirmDeleteAcc(null);
    }
  }

  const inputClass = "bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";
  const modalInputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

  return (
    <div>
      <Header title="Ventas" subtitle="Historial de operaciones realizadas" />

      {/* Filtros */}
      <div className="bg-base-card border border-base-border rounded-2xl p-5 mb-5 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, cliente o vendedor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass + " w-full"}
          />
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className={inputClass + " w-full"}
          >
            <option value="">Todos los vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>{seller.name}</option>
            ))}
          </select>
          <div className="flex gap-1 bg-base-subtle rounded-xl p-1 border border-base-border">
            {[
              { value: "all", label: "Todos" },
              { value: "iphone", label: "iPhones", Icon: Smartphone },
              { value: "accessory", label: "Accesorios", Icon: Cable },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition ${
                  typeFilter === value ? "bg-base-card text-base-text shadow-sm" : "text-base-muted hover:text-base-text"
                }`}
              >
                {Icon && <Icon size={12} />}{label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setSearch(""); setSellerFilter(""); setTypeFilter("all"); }}
            className="bg-base-subtle hover:bg-base-border transition rounded-xl px-4 py-2 text-sm text-base-muted"
          >
            Limpiar filtros
          </button>
          <span className="text-sm text-base-muted">
            {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-base-card border border-base-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-base-subtle border-b border-base-border">
            <tr>
              {["Tipo", "Fecha", "Producto / Accesorio", "Cliente / Nota", "Vendedor", "Venta", "Ganancia", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3.5 text-xs font-medium text-base-muted uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="px-5 py-6 text-base-muted text-sm">Cargando ventas...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-6 text-base-muted text-sm">No hay ventas que coincidan.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row._key}
                  onClick={row.clickable ? () => navigate(`/sales/${row.id}`) : undefined}
                  className={`border-t border-base-border transition ${
                    row.clickable ? "cursor-pointer hover:bg-base-subtle/50" : "hover:bg-base-subtle/20"
                  }`}
                >
                  <td className="px-4 py-3.5">
                    {row.type === "iphone" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        <Smartphone size={10} /> iPhone
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
                        <Cable size={10} /> Accesorio
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-base-muted text-xs whitespace-nowrap">{formatDate(row.date)}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-base-text">
                      {row.name}
                      {row.qty != null && <span className="ml-1 text-base-muted font-normal text-xs">×{row.qty}</span>}
                    </p>
                    {row.sub && <p className="text-xs text-base-muted font-mono">{row.sub}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-base-text text-sm">{row.client}</td>
                  <td className="px-4 py-3.5 text-base-text text-sm">{row.seller}</td>
                  <td className="px-4 py-3.5 font-medium text-base-text">USD {row.price.toFixed(2)}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xylo-500 font-medium">USD {Number(row.profit).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    {row.type === "accessory" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setAccEditError("");
                            setEditingAcc({ id: row.id, unit_price: String(row.unit_price), notes: row.notes_raw, name: row.name, qty: row.qty });
                          }}
                          className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted hover:text-base-text transition"
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmDeleteAcc === row.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteAcc(row.id)}
                              className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                            >
                              Eliminar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteAcc(null)}
                              className="text-[11px] px-2 py-1 rounded-lg border border-base-border text-base-muted hover:bg-base-subtle transition"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteAcc(row.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
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
          <p className="text-base-muted text-sm">Cargando ventas...</p>
        ) : filtered.length === 0 ? (
          <p className="text-base-muted text-sm">No hay ventas que coincidan.</p>
        ) : (
          filtered.map((row) => (
            <div
              key={row._key}
              onClick={row.clickable ? () => navigate(`/sales/${row.id}`) : undefined}
              className={`bg-base-card border border-base-border rounded-2xl p-4 shadow-card transition ${
                row.clickable ? "cursor-pointer hover:border-xylo-500/40" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {row.type === "iphone" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                        <Smartphone size={9} /> iPhone
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full">
                        <Cable size={9} /> Accesorio
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-base-text text-sm">
                    {row.name}{row.qty != null && <span className="text-base-muted font-normal"> ×{row.qty}</span>}
                  </p>
                  <p className="text-xs text-base-muted">{row.client} {row.seller !== "-" ? `· ${row.seller}` : ""}</p>
                </div>
                <span className="text-xylo-500 font-semibold text-sm">USD {row.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-muted">{formatDate(row.date)}</span>
                <span className="text-xs text-green-500 font-medium">+USD {Number(row.profit).toFixed(2)}</span>
              </div>
              {row.type === "accessory" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-base-border" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setAccEditError("");
                      setEditingAcc({ id: row.id, unit_price: String(row.unit_price), notes: row.notes_raw, name: row.name, qty: row.qty });
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-base-border text-base-muted hover:text-base-text hover:bg-base-subtle transition"
                  >
                    <Pencil size={11} /> Editar
                  </button>
                  {confirmDeleteAcc === row.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteAcc(row.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">
                        Eliminar
                      </button>
                      <button onClick={() => setConfirmDeleteAcc(null)} className="text-xs px-3 py-1.5 rounded-lg border border-base-border text-base-muted hover:bg-base-subtle transition">
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteAcc(row.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-base-border text-base-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      <Trash2 size={11} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de edición de accesorio */}
      {editingAcc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingAcc(null)}
        >
          <div
            className="bg-base-card border border-base-border rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-base-text">Editar venta de accesorio</h3>
              <button onClick={() => setEditingAcc(null)} className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted transition">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-base-muted mb-5">
              {editingAcc.name}{editingAcc.qty > 1 ? ` × ${editingAcc.qty}` : ""}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Precio por unidad USD</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingAcc.unit_price}
                  onChange={(e) => setEditingAcc((p) => ({ ...p, unit_price: e.target.value }))}
                  className={modalInputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">
                  Notas <span className="opacity-40">opcional</span>
                </label>
                <input
                  type="text"
                  value={editingAcc.notes}
                  onChange={(e) => setEditingAcc((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Observaciones de la venta"
                  className={modalInputClass}
                />
              </div>
              {accEditError && <p className="text-xs text-red-500">{accEditError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingAcc(null)}
                  className="flex-1 border border-base-border text-base-muted rounded-xl py-2.5 text-sm hover:bg-base-subtle transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveEditAcc}
                  disabled={savingAcc}
                  className="flex-1 bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {savingAcc ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
