import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import Header from "../components/Header";
import {
  Pencil, Trash2, X, Check, Plus, ShoppingBag, PackagePlus,
  ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";

const inputClass =
  "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

const blankForm = {
  name: "",
  category: "",
  brand: "",
  quantity: "",
  purchase_price_usd: "",
  sale_price_usd: "",
  supplier: "",
  notes: "",
};

function stockColor(qty) {
  if (qty === 0) return { bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400" };
  if (qty <= 5) return { bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-600 dark:text-yellow-400" };
  return { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" };
}

function fmt(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Modal state: { type: "sell" | "restock", accessory }
  const [modal, setModal] = useState(null);
  const [modalQty, setModalQty] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Sales history expand
  const [expandedSales, setExpandedSales] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/accessories/");
      setAccessories(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function startEdit(acc) {
    setEditing(acc.id);
    setForm({
      name: acc.name,
      category: acc.category,
      brand: acc.brand || "",
      quantity: "",
      purchase_price_usd: acc.purchase_price_usd,
      sale_price_usd: acc.sale_price_usd,
      supplier: acc.supplier || "",
      notes: acc.notes || "",
    });
    setError("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm(blankForm);
    setError("");
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.category.trim()) { setError("La categoría es obligatoria."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        brand: form.brand.trim() || null,
        quantity: editing ? undefined : Number(form.quantity) || 0,
        purchase_price_usd: Number(form.purchase_price_usd) || 0,
        sale_price_usd: Number(form.sale_price_usd) || 0,
        supplier: form.supplier.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        delete payload.quantity;
        await api.put(`/accessories/${editing}`, payload);
      } else {
        await api.post("/accessories/", payload);
      }
      await load();
      cancelEdit();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Error al guardar. Intentá de nuevo."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    try {
      await api.delete(`/accessories/${id}`);
      setAccessories((p) => p.filter((a) => a.id !== id));
      if (editing === id) cancelEdit();
    } catch {}
    finally { setConfirmDelete(null); }
  }

  function openModal(type, acc) {
    setModal({ type, acc });
    setModalQty("");
    setModalPrice(type === "sell" ? acc.sale_price_usd : acc.purchase_price_usd);
    setModalNote("");
    setModalError("");
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    const qty = Number(modalQty);
    if (!qty || qty <= 0) { setModalError("Ingresá una cantidad válida."); return; }
    setModalSaving(true); setModalError("");
    try {
      if (modal.type === "sell") {
        await api.post(`/accessories/${modal.acc.id}/sell`, {
          quantity: qty,
          sale_price_usd: modalPrice ? Number(modalPrice) : undefined,
          notes: modalNote.trim() || null,
        });
      } else {
        await api.post(`/accessories/${modal.acc.id}/stock`, {
          quantity: qty,
          purchase_price_usd: modalPrice ? Number(modalPrice) : undefined,
        });
      }
      await load();
      setModal(null);
    } catch (err) {
      setModalError(err?.response?.data?.detail || "Error al procesar.");
    } finally { setModalSaving(false); }
  }

  async function toggleSales(acc) {
    if (expandedSales === acc.id) { setExpandedSales(null); return; }
    setExpandedSales(acc.id);
    setLoadingSales(true);
    try {
      const res = await api.get(`/accessories/${acc.id}/sales`);
      setSalesHistory(res.data);
    } catch {}
    finally { setLoadingSales(false); }
  }

  const totals = useMemo(() => {
    const stockValue = accessories.reduce((s, a) => s + a.quantity * Number(a.purchase_price_usd), 0);
    return { count: accessories.length, stockValue };
  }, [accessories]);

  if (loading) return <p className="text-base-muted">Cargando...</p>;

  return (
    <div>
      <Header title="Accesorios" subtitle="Stock y ventas de accesorios" />

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: Form ───────────────────────────────── */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-base-card border border-base-border rounded-2xl p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-base-text mb-4">
              {editing ? "Editar accesorio" : "Nuevo accesorio"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: Cargador Original 20W"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">
                  Categoría <span className="text-red-400">*</span>
                </label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  list="cats-list"
                  placeholder="Cargador, Cable, Funda..."
                  className={inputClass}
                />
                <datalist id="cats-list">
                  {["Cargador", "Cable", "Funda", "Protector de pantalla", "Auricular", "Adaptador"].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Marca</label>
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="Apple, Samsung..."
                    className={inputClass}
                  />
                </div>
                {!editing && (
                  <div>
                    <label className="block text-xs font-medium text-base-muted mb-1.5">Cantidad inicial</label>
                    <input
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Costo USD</label>
                  <input
                    name="purchase_price_usd"
                    value={form.purchase_price_usd}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Venta USD</label>
                  <input
                    name="sale_price_usd"
                    value={form.sale_price_usd}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Proveedor</label>
                <input
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Notas</label>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                {editing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-shrink-0 border border-base-border text-base-muted rounded-xl px-3 py-2.5 text-sm hover:bg-base-subtle transition"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                    saved
                      ? "bg-green-500 text-white"
                      : "bg-xylo-500 hover:bg-xylo-600 text-white"
                  }`}
                >
                  {saved ? (
                    <><Check size={15} /> Guardado</>
                  ) : saving ? "Guardando..." : editing ? "Guardar cambios" : (
                    <><Plus size={15} /> Agregar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT: List ──────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <div className="bg-base-card border border-base-border rounded-2xl p-4">
              <p className="text-xs text-base-muted mb-1">Productos</p>
              <p className="text-2xl font-bold text-base-text">{totals.count}</p>
            </div>
            <div className="bg-base-card border border-base-border rounded-2xl p-4">
              <p className="text-xs text-base-muted mb-1">Valor en stock</p>
              <p className="text-2xl font-bold text-base-text">USD {fmt(totals.stockValue)}</p>
            </div>
          </div>

          {/* List */}
          {accessories.length === 0 ? (
            <div className="text-center py-16 text-base-muted text-sm border border-dashed border-base-border rounded-2xl">
              No hay accesorios cargados aún.
            </div>
          ) : (
            <div className="space-y-3">
              {accessories.map((acc) => {
                const sc = stockColor(acc.quantity);
                const margin = acc.sale_price_usd > 0 && acc.purchase_price_usd > 0
                  ? ((Number(acc.sale_price_usd) - Number(acc.purchase_price_usd)) / Number(acc.purchase_price_usd) * 100).toFixed(0)
                  : null;
                const isExpanded = expandedSales === acc.id;

                return (
                  <div
                    key={acc.id}
                    className={`bg-base-card border rounded-2xl overflow-hidden transition ${
                      editing === acc.id ? "border-xylo-500/50" : "border-base-border"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-base-text text-sm">{acc.name}</p>
                            {acc.brand && (
                              <span className="text-[11px] text-base-muted bg-base-subtle border border-base-border rounded-full px-2 py-0.5">
                                {acc.brand}
                              </span>
                            )}
                            <span className="text-[11px] text-base-muted bg-base-subtle border border-base-border rounded-full px-2 py-0.5">
                              {acc.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {/* Stock badge */}
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                              {acc.quantity === 0 && <AlertCircle size={11} />}
                              {acc.quantity} en stock
                            </span>
                            <span className="text-xs text-base-muted">
                              Costo: <span className="font-semibold text-base-text">USD {fmt(acc.purchase_price_usd)}</span>
                            </span>
                            <span className="text-xs text-base-muted">
                              Venta: <span className="font-semibold text-base-text">USD {fmt(acc.sale_price_usd)}</span>
                            </span>
                            {margin && (
                              <span className="text-xs font-semibold text-emerald-500">+{margin}%</span>
                            )}
                          </div>
                          {acc.supplier && (
                            <p className="text-xs text-base-muted mt-1">Proveedor: {acc.supplier}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openModal("sell", acc)}
                            disabled={acc.quantity === 0}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-3 py-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShoppingBag size={13} />
                            <span className="hidden sm:inline">Vender</span>
                          </button>
                          <button
                            onClick={() => openModal("restock", acc)}
                            className="flex items-center gap-1.5 text-xs font-semibold border border-base-border text-base-muted hover:text-base-text hover:bg-base-subtle rounded-xl px-3 py-2 transition"
                          >
                            <PackagePlus size={13} />
                            <span className="hidden sm:inline">Reponer</span>
                          </button>
                          <button
                            onClick={() => editing === acc.id ? cancelEdit() : startEdit(acc)}
                            className={`p-2 rounded-xl transition ${editing === acc.id ? "bg-xylo-500/20 text-xylo-500" : "hover:bg-base-subtle text-base-muted hover:text-base-text"}`}
                          >
                            <Pencil size={13} />
                          </button>
                          {confirmDelete === acc.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(acc.id)}
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                              >
                                Eliminar
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-[11px] px-2 py-1 rounded-lg border border-base-border text-base-muted hover:bg-base-subtle transition"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDelete(acc.id)}
                              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Toggle sales history */}
                      <button
                        onClick={() => toggleSales(acc)}
                        className="mt-3 flex items-center gap-1 text-xs text-base-muted hover:text-base-text transition"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        Historial de ventas
                      </button>
                    </div>

                    {/* Sales history */}
                    {isExpanded && (
                      <div className="border-t border-base-border bg-base-subtle px-4 py-3">
                        {loadingSales ? (
                          <p className="text-xs text-base-muted">Cargando...</p>
                        ) : salesHistory.length === 0 ? (
                          <p className="text-xs text-base-muted">Sin ventas registradas.</p>
                        ) : (
                          <div className="space-y-2">
                            {salesHistory.map((s) => (
                              <div key={s.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="text-base-muted">
                                    {new Date(s.sold_at).toLocaleDateString("es-AR")}
                                  </span>
                                  <span className="font-semibold text-base-text">
                                    x{s.quantity_sold} u.
                                  </span>
                                  <span className="text-base-muted">
                                    @ USD {fmt(s.sale_price_usd)}
                                  </span>
                                  {s.notes && (
                                    <span className="text-base-muted italic truncate max-w-[140px]">{s.notes}</span>
                                  )}
                                </div>
                                <span className="font-semibold text-emerald-500 flex-shrink-0">
                                  +USD {fmt(s.gross_profit_usd)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Vender / Reponer ─────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-sm bg-base-card border border-base-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-semibold text-base-text">
                  {modal.type === "sell" ? "Registrar venta" : "Reponer stock"}
                </p>
                <p className="text-xs text-base-muted mt-0.5">{modal.acc.name}</p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">
                  Cantidad <span className="text-red-400">*</span>
                  {modal.type === "sell" && (
                    <span className="ml-2 opacity-60">(stock disponible: {modal.acc.quantity})</span>
                  )}
                </label>
                <input
                  autoFocus
                  type="number"
                  min="1"
                  max={modal.type === "sell" ? modal.acc.quantity : undefined}
                  value={modalQty}
                  onChange={(e) => setModalQty(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">
                  {modal.type === "sell" ? "Precio de venta USD" : "Costo USD"}
                  <span className="ml-1 opacity-60">por unidad</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(e.target.value)}
                  placeholder={modal.type === "sell" ? fmt(modal.acc.sale_price_usd) : fmt(modal.acc.purchase_price_usd)}
                  className={inputClass}
                />
              </div>

              {modal.type === "sell" && (
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Nota</label>
                  <input
                    type="text"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="Opcional"
                    className={inputClass}
                  />
                </div>
              )}

              {modalQty && Number(modalPrice) > 0 && modal.type === "sell" && (
                <div className="bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-sm">
                  <div className="flex justify-between text-base-muted">
                    <span>Total venta</span>
                    <span className="font-semibold text-base-text">
                      USD {fmt(Number(modalQty) * Number(modalPrice))}
                    </span>
                  </div>
                  <div className="flex justify-between text-base-muted mt-1">
                    <span>Ganancia estimada</span>
                    <span className="font-semibold text-emerald-500">
                      USD {fmt(Number(modalQty) * (Number(modalPrice) - Number(modal.acc.purchase_price_usd)))}
                    </span>
                  </div>
                </div>
              )}

              {modalError && <p className="text-xs text-red-500">{modalError}</p>}

              <button
                type="submit"
                disabled={modalSaving}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold bg-xylo-500 hover:bg-xylo-600 text-white transition disabled:opacity-60"
              >
                {modalSaving
                  ? "Procesando..."
                  : modal.type === "sell"
                  ? "Confirmar venta"
                  : "Agregar stock"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
