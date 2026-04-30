import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { Pencil, Trash2, X, Megaphone, Building2, Users, Video, TrendingDown, Check, Plus, Tag, Zap, Layers, Star, ShoppingBag } from "lucide-react";

const BASE_CATEGORIES = ["Ads", "Oficina", "Vendedores y revendedores", "Edicion"];
const CATEGORIES = BASE_CATEGORIES;

const CAT_META = {
  "Ads":                       { icon: Megaphone,    color: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/30",  text: "text-orange-600 dark:text-orange-400",  border: "border-orange-200 dark:border-orange-800" },
  "Oficina":                   { icon: Building2,    color: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/30",  text: "text-indigo-600 dark:text-indigo-400",  border: "border-indigo-200 dark:border-indigo-800" },
  "Vendedores y revendedores": { icon: Users,        color: "#0ea5e9", bg: "bg-sky-50 dark:bg-sky-950/30",        text: "text-sky-600 dark:text-sky-400",         border: "border-sky-200 dark:border-sky-800"       },
  "Edicion":                   { icon: Video,        color: "#8b5cf6", bg: "bg-violet-50 dark:bg-violet-950/30",  text: "text-violet-600 dark:text-violet-400",  border: "border-violet-200 dark:border-violet-800" },
};

const CUSTOM_STYLES = [
  { icon: Tag,         color: "#ec4899", bg: "bg-pink-50 dark:bg-pink-950/30",    text: "text-pink-600 dark:text-pink-400",    border: "border-pink-200 dark:border-pink-800"    },
  { icon: Zap,         color: "#eab308", bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
  { icon: ShoppingBag, color: "#14b8a6", bg: "bg-teal-50 dark:bg-teal-950/30",    text: "text-teal-600 dark:text-teal-400",    border: "border-teal-200 dark:border-teal-800"    },
  { icon: Layers,      color: "#f43f5e", bg: "bg-rose-50 dark:bg-rose-950/30",    text: "text-rose-600 dark:text-rose-400",    border: "border-rose-200 dark:border-rose-800"    },
  { icon: Star,        color: "#a855f7", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
];

function getCatMeta(cat, customCats) {
  if (CAT_META[cat]) return CAT_META[cat];
  const idx = customCats.indexOf(cat);
  return CUSTOM_STYLES[idx % CUSTOM_STYLES.length] || CUSTOM_STYLES[0];
}

const today = () => new Date().toISOString().slice(0, 10);

const blankForm = (firstCat) => ({ category: firstCat || BASE_CATEGORIES[0], description: "", amount_ars: "", amount_usd: "", date: today(), currency: "ARS" });

const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

function fmt(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export default function GastosPage() {
  const [expenses, setExpenses]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(blankForm);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // id to confirm
  const [filterCat, setFilterCat]   = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!confirmDelete) return;
    const close = () => setConfirmDelete(null);
    document.addEventListener("click", close, { capture: true, once: true });
    return () => document.removeEventListener("click", close, { capture: true });
  }, [confirmDelete]);

  async function load() {
    try {
      const res = await api.get("/expenses/");
      setExpenses(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function startEdit(e) {
    setEditing(e.id);
    const primaryUsd = (!e.amount_ars || Number(e.amount_ars) === 0) && e.amount_usd;
    setForm({ category: e.category, description: e.description || "", amount_ars: e.amount_ars || "", amount_usd: e.amount_usd || "", date: e.date, currency: primaryUsd ? "USD" : "ARS" });
    setError("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm(blankForm);
    setError("");
  }

  function handleChange(ev) {
    setForm((p) => ({ ...p, [ev.target.name]: ev.target.value }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (form.currency === "ARS" && (!form.amount_ars || Number(form.amount_ars) <= 0)) { setError("Ingresá el monto en ARS."); return; }
    if (form.currency === "USD" && (!form.amount_usd || Number(form.amount_usd) <= 0)) { setError("Ingresá el monto en USD."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        category: form.category, description: form.description || null,
        amount_ars: Number(form.amount_ars),
        amount_usd: form.amount_usd ? Number(form.amount_usd) : null,
        date: form.date,
      };
      if (editing) { await api.put(`/expenses/${editing}`, payload); }
      else         { await api.post("/expenses/", payload); }
      await load();
      setEditing(null);
      setForm(blankForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Error al guardar. Intentá de nuevo."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((p) => p.filter((e) => e.id !== id));
      if (editing === id) cancelEdit();
    } catch {}
    finally { setConfirmDelete(null); }
  }

  const filtered = useMemo(() => expenses.filter((e) => {
    const matchCat   = !filterCat   || e.category === filterCat;
    const matchMonth = !filterMonth || e.date.startsWith(filterMonth);
    return matchCat && matchMonth;
  }), [expenses, filterCat, filterMonth]);

  const totals = useMemo(() => {
    const t = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    filtered.forEach((e) => { t[e.category] = (t[e.category] || 0) + Number(e.amount_ars); });
    return t;
  }, [filtered]);

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  const totalsUsd = useMemo(() => {
    const t = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    filtered.forEach((e) => { if (e.amount_usd) t[e.category] = (t[e.category] || 0) + Number(e.amount_usd); });
    return t;
  }, [filtered]);

  const grandTotalUsd = Object.values(totalsUsd).reduce((a, b) => a + b, 0);

  if (loading) return <p className="text-base-muted">Cargando...</p>;

  return (
    <div>
      <Header title="Gastos" subtitle="Registrá y seguí tus egresos" />

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: Form panel ─────────────────────────────── */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-base-card border border-base-border rounded-2xl p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-base-text mb-4">
              {editing ? "Editar gasto" : "Agregar gasto"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category selector — visual buttons */}
              <div>
                <label className="block text-xs font-medium text-base-muted mb-2">Categoría</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const meta = CAT_META[cat];
                    const Icon = meta.icon;
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, category: cat }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition text-left ${
                          active
                            ? `${meta.bg} ${meta.text} ${meta.border} border`
                            : "border-base-border text-base-muted hover:border-base-muted bg-base-subtle"
                        }`}
                      >
                        <Icon size={13} />
                        <span className="truncate">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">
                  Descripción <span className="opacity-40">opcional</span>
                </label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Ej: Pauta Instagram, Alquiler mayo..."
                  className={inputClass}
                />
              </div>

              {/* Currency toggle */}
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Moneda principal</label>
                <div className="flex gap-1 bg-base-subtle rounded-xl p-1 border border-base-border">
                  {["ARS", "USD"].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, currency: cur }))}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition ${
                        form.currency === cur
                          ? "bg-base-card text-base-text shadow-sm"
                          : "text-base-muted hover:text-base-text"
                      }`}
                    >
                      {cur === "ARS" ? "$ ARS" : "USD $"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">
                    {form.currency === "ARS" ? "Monto ARS" : "Monto USD"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    name={form.currency === "ARS" ? "amount_ars" : "amount_usd"}
                    value={form.currency === "ARS" ? form.amount_ars : form.amount_usd}
                    onChange={handleChange}
                    type="number" min="0" step={form.currency === "ARS" ? "1" : "0.01"}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">
                    {form.currency === "ARS" ? "USD" : "ARS"} <span className="opacity-40">opcional</span>
                  </label>
                  <input
                    name={form.currency === "ARS" ? "amount_usd" : "amount_ars"}
                    value={form.currency === "ARS" ? form.amount_usd : form.amount_ars}
                    onChange={handleChange}
                    type="number" min="0" step={form.currency === "ARS" ? "0.01" : "1"}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Fecha</label>
                <input name="date" value={form.date} onChange={handleChange} type="date" className={inputClass} required />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              {/* Actions */}
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
                  ) : saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Summary + list ────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {CATEGORIES.map((cat) => {
              const meta = CAT_META[cat];
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(filterCat === cat ? "" : cat)}
                  className={`rounded-2xl p-3.5 text-left border transition ${
                    filterCat === cat
                      ? "border-xylo-500 bg-xylo-500/10"
                      : "border-base-border bg-base-card hover:border-xylo-500/30"
                  }`}
                >
                  <div className={`inline-flex p-1.5 rounded-lg mb-2 ${meta.bg}`}>
                    <Icon size={14} className={meta.text} />
                  </div>
                  <p className="text-[11px] text-base-muted font-medium truncate leading-tight">{cat}</p>
                  <p className="text-base font-bold text-base-text mt-0.5">$ {fmt(totals[cat])}</p>
                  {totalsUsd[cat] > 0 && <p className="text-[10px] text-base-muted">USD {fmt(totalsUsd[cat])}</p>}
                </button>
              );
            })}
          </div>

          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-2 bg-base-card border border-base-border rounded-xl px-3 py-2">
              <TrendingDown size={13} className="text-red-400" />
              <span className="text-xs text-base-muted">Total:</span>
              <span className="text-xs font-bold text-base-text">$ {fmt(grandTotal)}</span>
              {grandTotalUsd > 0 && (
                <span className="text-xs font-bold text-base-muted border-l border-base-border pl-2">USD {fmt(grandTotalUsd)}</span>
              )}
            </div>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-base-subtle border border-base-border rounded-xl px-3 py-2 text-sm text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
            >
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
                className="flex items-center gap-1.5 text-xs border border-base-border text-base-muted hover:text-base-text rounded-xl px-3 py-2 transition"
              >
                <X size={11} /> {filterCat}
              </button>
            )}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-base-muted text-sm border border-dashed border-base-border rounded-2xl">
              Sin gastos para este período.
            </div>
          ) : (
            <div className="bg-base-card border border-base-border rounded-2xl overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-base-border">
                      {["Fecha", "Categoría", "Descripción", "ARS", "USD", ""].map((h) => (
                        <th key={h} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-base-muted ${h === "ARS" || h === "USD" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => {
                      const meta = CAT_META[e.category] || CAT_META["Ads"];
                      const Icon = meta.icon;
                      const isEditing = editing === e.id;
                      return (
                        <tr
                          key={e.id}
                          className={`border-b border-base-border last:border-0 transition ${isEditing ? "bg-xylo-500/5" : "hover:bg-base-subtle"}`}
                        >
                          <td className="px-5 py-3.5 text-base-muted whitespace-nowrap text-xs">{e.date}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                              <Icon size={11} />{e.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-base-text max-w-[180px] truncate">
                            {e.description || <span className="text-base-muted">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-base-text">$ {fmt(e.amount_ars)}</td>
                          <td className="px-5 py-3.5 text-right text-base-muted text-xs">{e.amount_usd ? `USD ${fmt(e.amount_usd)}` : "—"}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => isEditing ? cancelEdit() : startEdit(e)} className={`p-1.5 rounded-lg transition ${isEditing ? "bg-xylo-500/20 text-xylo-500" : "hover:bg-base-subtle text-base-muted hover:text-base-text"}`}>
                                <Pencil size={13} />
                              </button>
                              {confirmDelete === e.id ? (
                                <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                                  <button onClick={() => handleDelete(e.id)} className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">
                                    Eliminar
                                  </button>
                                  <button onClick={() => setConfirmDelete(null)} className="text-[11px] px-2 py-1 rounded-lg border border-base-border text-base-muted hover:bg-base-subtle transition">
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition">
                                  <Trash2 size={13} />
                                </button>
                              )}
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
                    <div key={e.id} className={`flex items-start gap-3 p-4 ${editing === e.id ? "bg-xylo-500/5" : ""}`}>
                      <div className={`p-2 rounded-xl flex-shrink-0 ${meta.bg}`}>
                        <Icon size={14} className={meta.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-base-text truncate">{e.category}</p>
                            {e.description && <p className="text-xs text-base-muted mt-0.5 truncate">{e.description}</p>}
                            <p className="text-[11px] text-base-muted mt-0.5">{e.date}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-base-text">$ {fmt(e.amount_ars)}</p>
                            {e.amount_usd && <p className="text-[11px] text-base-muted">USD {fmt(e.amount_usd)}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => editing === e.id ? cancelEdit() : startEdit(e)} className={`p-1.5 rounded-lg transition ${editing === e.id ? "bg-xylo-500/20 text-xylo-500" : "hover:bg-base-subtle text-base-muted"}`}>
                          <Pencil size={13} />
                        </button>
                        {confirmDelete === e.id ? (
                          <div className="flex flex-col gap-1">
                            <button onClick={() => handleDelete(e.id)} className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-red-500 text-white">
                              Sí
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="text-[10px] px-2 py-1 rounded-lg border border-base-border text-base-muted">
                              No
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
