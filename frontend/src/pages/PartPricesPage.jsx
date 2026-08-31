import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
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

  const grouped = useMemo(() => {
    const map = {};
    for (const price of prices) {
      if (!map[price.category]) map[price.category] = [];
      map[price.category].push(price);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [prices]);

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
        {canEdit && (
          <button
            onClick={openCreate}
            className="mt-1 flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          >
            <Plus size={15} /> <span className="hidden sm:inline">Agregar precio</span>
          </button>
        )}
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
          <Tags size={16} /> Todavía no hay precios cargados.
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([category, items]) => (
            <section key={category} className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
              <h3 className="text-sm font-semibold text-base-text mb-3">{category}</h3>
              <div className="space-y-2">
                {items.map((price) => (
                  <div key={price.id} className="flex items-center justify-between gap-3 bg-base-subtle border border-base-border rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-base-text truncate">{price.label}</p>
                      {price.notes && <p className="text-xs text-base-muted truncate">{price.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-xylo-500">USD {Number(price.price_usd).toFixed(2)}</span>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(price)} className="p-1.5 rounded-lg hover:bg-base-card text-base-muted">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => remove(price)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-950/30">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
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
