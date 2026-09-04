import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tags, Trash2, X, Search, CheckSquare, Square, ListFilter } from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const inputClass =
  "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

const emptyForm = { category: "", label: "", price_usd: "", notes: "" };

export default function PartPricesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "technician";

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api.get("/part-prices");
      setPrices(res.data);
    } catch {
      setError("No se pudo cargar la lista de precios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => [...new Set(prices.map((p) => p.category))].sort(), [prices]);

  const filteredPrices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return prices.filter((price) => {
      const matchesCategory = !categoryFilter || price.category === categoryFilter;
      const matchesSearch = !term || [price.label, price.category, price.notes]
        .some((field) => String(field || "").toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [prices, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map = {};
    for (const price of filteredPrices) {
      if (!map[price.category]) map[price.category] = [];
      map[price.category].push(price);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPrices]);

  const selectedItems = useMemo(
    () => prices.filter((price) => selectedIds.has(price.id)),
    [prices, selectedIds]
  );
  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, price) => sum + Number(price.price_usd || 0), 0),
    [selectedItems]
  );

  function toggleSelected(id) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectionMode() {
    setSelectionMode((current) => {
      if (current) setSelectedIds(new Set());
      return !current;
    });
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(price) {
    setForm({
      category: price.category,
      label: price.label,
      price_usd: price.price_usd,
      notes: price.notes || "",
    });
    setEditingId(price.id);
    setShowForm(true);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.category.trim() || !form.label.trim() || form.price_usd === "") return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        category: form.category.trim(),
        label: form.label.trim(),
        price_usd: Number(form.price_usd),
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        await api.patch(`/part-prices/${editingId}`, payload);
      } else {
        await api.post("/part-prices", payload);
      }
      setShowForm(false);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "No se pudo guardar el precio.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(price) {
    if (!window.confirm(`¿Eliminar "${price.label}" de ${price.category}?`)) return;
    try {
      await api.delete(`/part-prices/${price.id}`);
      await load();
    } catch {
      setError("No se pudo eliminar el precio.");
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <Header title="Precios de piezas" subtitle="Referencia rápida para cotizar reparaciones" />
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={toggleSelectionMode}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              selectionMode ? "bg-xylo-500 text-white hover:bg-xylo-600" : "border border-base-border text-base-muted hover:bg-base-subtle"
            }`}
          >
            <CheckSquare size={15} /> <span className="hidden sm:inline">{selectionMode ? "Salir de selección" : "Seleccionar"}</span>
          </button>
          {canEdit && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
            >
              <Plus size={15} /> <span className="hidden sm:inline">Agregar precio</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mt-5 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por pieza, modelo o nota..."
            className="w-full bg-base-subtle border border-base-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
          />
        </div>
        <div className="relative">
          <ListFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-base-subtle border border-base-border rounded-xl pl-8 pr-8 py-2.5 text-sm text-base-text outline-none focus:border-xylo-500 appearance-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-base-muted">Cargando precios...</p>
      ) : grouped.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-base-subtle border border-base-border px-4 py-6 text-sm text-base-muted justify-center">
          <Tags size={16} /> {prices.length === 0 ? "Todavía no hay precios cargados." : "Ningún precio coincide con el filtro."}
        </div>
      ) : (
        <div className="space-y-5 pb-20">
          {grouped.map(([category, items]) => (
            <section key={category} className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
              <h3 className="text-sm font-semibold text-base-text mb-3">{category}</h3>
              <div className="space-y-2">
                {items.map((price) => {
                  const isSelected = selectedIds.has(price.id);
                  return (
                    <div
                      key={price.id}
                      onClick={() => selectionMode && toggleSelected(price.id)}
                      className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 transition ${
                        selectionMode ? "cursor-pointer" : ""
                      } ${isSelected ? "bg-xylo-500/10 border-xylo-500/40" : "bg-base-subtle border-base-border"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {selectionMode && (
                          isSelected
                            ? <CheckSquare size={17} className="text-xylo-500 flex-shrink-0" />
                            : <Square size={17} className="text-base-muted flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-base-text truncate">{price.label}</p>
                          {price.notes && <p className="text-xs text-base-muted truncate">{price.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-xylo-500">USD {Number(price.price_usd).toFixed(2)}</span>
                        {canEdit && !selectionMode && (
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openEdit(price); }} className="p-1.5 rounded-lg hover:bg-base-card text-base-muted">
                              <Pencil size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); remove(price); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-950/30">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectionMode && selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-base-card border-t border-base-border px-5 py-3.5 flex items-center justify-between gap-3 shadow-2xl">
          <p className="text-sm text-base-text">
            <span className="font-semibold">{selectedItems.length}</span> pieza{selectedItems.length !== 1 ? "s" : ""} seleccionada{selectedItems.length !== 1 ? "s" : ""}
          </p>
          <p className="text-sm font-bold text-xylo-500">Total: USD {selectedTotal.toFixed(2)}</p>
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? "Editar precio" : "Nuevo precio"} onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Categoría">
              <input required list="category-suggestions" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Batería, Pantalla, Pin de carga..." className={inputClass} />
              <datalist id="category-suggestions">
                {[...new Set(prices.map((p) => p.category))].map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Detalle / modelo">
              <input required value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="iPhone 13" className={inputClass} />
            </Field>
            <Field label="Precio (USD)">
              <input required type="number" min="0" step="0.01" value={form.price_usd} onChange={(e) => setForm((p) => ({ ...p, price_usd: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Notas">
              <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Opcional" className={inputClass} />
            </Field>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-base-border text-base-muted rounded-xl py-2.5 text-sm hover:bg-base-subtle">Cancelar</button>
              <button disabled={saving} className="flex-1 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-base-text">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted"><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block text-xs font-medium text-base-muted">{label}<div className="mt-1.5">{children}</div></label>;
}
