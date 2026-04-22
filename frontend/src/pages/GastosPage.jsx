import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { Plus, Pencil, Trash2, X, Megaphone, Building2, Users, Video, TrendingDown } from "lucide-react";

const CATEGORIES = ["Ads", "Oficina", "Vendedores y revendedores", "Edicion"];

const CAT_META = {
  "Ads":                      { icon: Megaphone,  color: "#f97316", bg: "bg-orange-50  dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400" },
  "Oficina":                  { icon: Building2,  color: "#6366f1", bg: "bg-indigo-50  dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400" },
  "Vendedores y revendedores":{ icon: Users,      color: "#0ea5e9", bg: "bg-sky-50     dark:bg-sky-950/30",    text: "text-sky-600   dark:text-sky-400"    },
  "Edicion":                  { icon: Video,      color: "#8b5cf6", bg: "bg-violet-50  dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400" },
};

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  category: CATEGORIES[0],
  description: "",
  amount_ars: "",
  amount_usd: "",
  date: today(),
};

const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

function fmt(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export default function GastosPage() {
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(initialForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/expenses/");
      setExpenses(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(e) {
    setEditing(e.id);
    setForm({
      category:    e.category,
      description: e.description || "",
      amount_ars:  e.amount_ars  || "",
      amount_usd:  e.amount_usd  || "",
      date:        e.date,
    });
    setError("");
    setShowForm(true);
  }

  function handleChange(ev) {
    setForm((p) => ({ ...p, [ev.target.name]: ev.target.value }));
  }

  async function handleSave(ev) {
    ev.preventDefault();
    if (!form.amount_ars || Number(form.amount_ars) <= 0) {
      setError("Ingresá el monto en ARS.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        category:    form.category,
        description: form.description || null,
        amount_ars:  Number(form.amount_ars),
        amount_usd:  form.amount_usd ? Number(form.amount_usd) : null,
        date:        form.date,
      };
      if (editing) {
        await api.put(`/expenses/${editing}`, payload);
      } else {
        await api.post("/expenses/", payload);
      }
      await load();
      setShowForm(false);
    } catch (e) {
      setError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((p) => p.filter((e) => e.id !== id));
    } catch {}
  }

  // Filter & group
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat   = !filterCat   || e.category === filterCat;
      const matchMonth = !filterMonth || e.date.startsWith(filterMonth);
      return matchCat && matchMonth;
    });
  }, [expenses, filterCat, filterMonth]);

  const totals = useMemo(() => {
    const t = {};
    CATEGORIES.forEach((c) => { t[c] = 0; });
    filtered.forEach((e) => { t[e.category] = (t[e.category] || 0) + Number(e.amount_ars); });
    return t;
  }, [filtered]);

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  if (loading) return <p className="text-base-muted">Cargando...</p>;

  return (
    <div>
      <Header
        title="Gastos"
        subtitle="Seguimiento de egresos por categoría"
        action={
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
          >
            <Plus size={16} />
            Nuevo gasto
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {CATEGORIES.map((cat) => {
          const meta = CAT_META[cat];
          const Icon = meta.icon;
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? "" : cat)}
              className={`rounded-2xl p-4 text-left border transition ${
                filterCat === cat
                  ? "border-xylo-500 bg-xylo-500/10"
                  : "border-base-border bg-base-card hover:border-xylo-500/40"
              }`}
            >
              <div className={`inline-flex p-2 rounded-xl mb-2 ${meta.bg}`}>
                <Icon size={16} className={meta.text} />
              </div>
              <p className="text-xs text-base-muted font-medium truncate">{cat}</p>
              <p className="text-lg font-bold text-base-text mt-0.5">
                $ {fmt(totals[cat])}
              </p>
            </button>
          );
        })}
      </div>

      {/* Grand total + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-base-card border border-base-border rounded-xl px-4 py-2.5">
          <TrendingDown size={15} className="text-red-400" />
          <span className="text-sm text-base-muted">Total:</span>
          <span className="text-sm font-bold text-base-text">$ {fmt(grandTotal)}</span>
        </div>

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className={inputClass + " max-w-[160px]"}
        >
          {/* Last 12 months */}
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleString("es-AR", { month: "long", year: "numeric" });
            return <option key={val} value={val}>{label}</option>;
          })}
          <option value="">Todos</option>
        </select>

        {filterCat && (
          <button
            onClick={() => setFilterCat("")}
            className="flex items-center gap-1.5 text-xs text-base-muted hover:text-base-text border border-base-border rounded-xl px-3 py-2 transition"
          >
            <X size={12} /> {filterCat}
          </button>
        )}
      </div>

      {/* Expenses list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-base-muted text-sm">
          Sin gastos registrados para este período.
        </div>
      ) : (
        <div className="bg-base-card border border-base-border rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-border">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-base-muted">Fecha</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-base-muted">Categoría</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-base-muted">Descripción</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-base-muted">Monto ARS</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-base-muted">USD</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const meta = CAT_META[e.category] || CAT_META["Ads"];
                  const Icon = meta.icon;
                  return (
                    <tr key={e.id} className="border-b border-base-border last:border-0 hover:bg-base-subtle transition">
                      <td className="px-5 py-3.5 text-base-muted whitespace-nowrap">{e.date}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                          <Icon size={11} />
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-base-text max-w-xs truncate">{e.description || <span className="text-base-muted">—</span>}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-base-text">$ {fmt(e.amount_ars)}</td>
                      <td className="px-5 py-3.5 text-right text-base-muted text-xs">{e.amount_usd ? `USD ${fmt(e.amount_usd)}` : "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted hover:text-base-text transition">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-base-border">
            {filtered.map((e) => {
              const meta = CAT_META[e.category] || CAT_META["Ads"];
              const Icon = meta.icon;
              return (
                <div key={e.id} className="flex items-start gap-3 p-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${meta.bg}`}>
                    <Icon size={15} className={meta.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-base-text truncate">{e.category}</p>
                        {e.description && <p className="text-xs text-base-muted mt-0.5 truncate">{e.description}</p>}
                        <p className="text-[11px] text-base-muted mt-1">{e.date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-base-text">$ {fmt(e.amount_ars)}</p>
                        {e.amount_usd && <p className="text-[11px] text-base-muted">USD {fmt(e.amount_usd)}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form slide-in */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md bg-base-card border border-base-border rounded-t-3xl md:rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-base-text">
                {editing ? "Editar gasto" : "Nuevo gasto"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-xl hover:bg-base-subtle text-base-muted transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Categoría</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Descripción <span className="opacity-50">(opcional)</span></label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Ej: Pauta Facebook, Alquiler mes de mayo..." className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Monto ARS <span className="text-red-400">*</span></label>
                  <input name="amount_ars" value={form.amount_ars} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">USD <span className="opacity-50">(opcional)</span></label>
                  <input name="amount_usd" value={form.amount_usd} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Fecha</label>
                <input name="date" value={form.date} onChange={handleChange} type="date" className={inputClass} required />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-base-border text-base-muted rounded-xl py-2.5 text-sm font-medium hover:bg-base-subtle transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold transition">
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
