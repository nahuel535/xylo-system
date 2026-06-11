import { useState, useEffect, useCallback } from "react";
import { Plus, X, Trash2, Check, FileText, ChevronDown, ChevronRight } from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";

const STATUS_META = {
  draft:    { label: "Borrador",  cls: "bg-base-subtle text-base-muted" },
  sent:     { label: "Enviado",   cls: "bg-blue-50 text-blue-600" },
  accepted: { label: "Aceptado",  cls: "bg-green-50 text-green-600" },
  rejected: { label: "Rechazado", cls: "bg-red-50 text-red-500" },
  expired:  { label: "Expirado",  cls: "bg-orange-50 text-orange-500" },
};

const EMPTY_ITEM = { description: "", quantity: 1, unit_price_usd: "", subtotal_usd: 0 };

function calcItems(items) {
  return items.map((it) => ({
    ...it,
    subtotal_usd: (parseFloat(it.unit_price_usd) || 0) * (parseInt(it.quantity) || 1),
  }));
}

function QuoteModal({ quote, onClose, onSave }) {
  const isNew = !quote?.id;
  const today = new Date().toISOString().split("T")[0];
  const defaultExpiry = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    client_name: quote?.client_name ?? "",
    client_phone: quote?.client_phone ?? "",
    items: quote?.items?.length ? quote.items : [{ ...EMPTY_ITEM }],
    discount_usd: quote?.discount_usd ?? 0,
    status: quote?.status ?? "draft",
    valid_until: quote?.valid_until ?? defaultExpiry,
    notes: quote?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const items = calcItems(form.items);
  const subtotal = items.reduce((s, i) => s + i.subtotal_usd, 0);
  const total = Math.max(subtotal - (parseFloat(form.discount_usd) || 0), 0);

  function setItem(idx, field, val) {
    setForm((p) => {
      const next = [...p.items];
      next[idx] = { ...next[idx], [field]: val };
      return { ...p, items: next };
    });
  }

  function addItem() {
    setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));
  }

  function removeItem(idx) {
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.client_name.trim()) { setError("El nombre del cliente es obligatorio"); return; }
    if (!form.items.length) { setError("Agregá al menos un ítem"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        items: calcItems(form.items).map((i) => ({
          description: i.description,
          quantity: parseInt(i.quantity) || 1,
          unit_price_usd: parseFloat(i.unit_price_usd) || 0,
          subtotal_usd: i.subtotal_usd,
        })),
        discount_usd: parseFloat(form.discount_usd) || 0,
      };
      if (isNew) await api.post("/quotes", payload);
      else await api.patch(`/quotes/${quote.id}`, payload);
      onSave();
    } catch {
      setError("Error al guardar el presupuesto");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full bg-base-subtle border border-base-border rounded-xl px-3 py-2 text-sm text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";
  const lbl = "block text-xs font-semibold text-base-muted mb-1.5 uppercase tracking-wide";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-base-card border border-base-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-base-border sticky top-0 bg-base-card z-10">
          <h2 className="text-base font-bold text-base-text">{isNew ? "Nuevo presupuesto" : "Editar presupuesto"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-base-subtle text-base-muted hover:bg-base-border transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Cliente *</label>
              <input className={inp} value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} placeholder="Nombre del cliente" autoFocus />
            </div>
            <div>
              <label className={lbl}>Teléfono</label>
              <input className={inp} value={form.client_phone} onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))} placeholder="+54 9 ..." />
            </div>
          </div>

          {/* Ítems */}
          <div>
            <label className={lbl}>Ítems</label>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_100px_80px_32px] gap-2 items-center">
                  <input className={inp} value={item.description} onChange={(e) => setItem(idx, "description", e.target.value)} placeholder="Descripción" />
                  <input className={inp} type="number" min="1" value={item.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} placeholder="Cant." />
                  <input className={inp} type="number" min="0" step="0.01" value={item.unit_price_usd} onChange={(e) => setItem(idx, "unit_price_usd", e.target.value)} placeholder="USD" />
                  <span className="text-sm text-right text-base-muted">
                    ${((parseFloat(item.unit_price_usd) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                  </span>
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500 flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-sm text-xylo-500 hover:text-xylo-600 font-medium">
              <Plus size={14} /> Agregar ítem
            </button>
          </div>

          {/* Totales + descuento */}
          <div className="bg-base-subtle rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-base-muted">
              <span>Subtotal</span>
              <span>USD {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-base-muted">Descuento</span>
              <div className="flex items-center gap-1">
                <span className="text-base-muted text-xs">USD</span>
                <input
                  type="number" min="0" step="0.01"
                  value={form.discount_usd}
                  onChange={(e) => setForm((p) => ({ ...p, discount_usd: e.target.value }))}
                  className="w-24 bg-base-card border border-base-border rounded-lg px-2 py-1 text-sm text-base-text outline-none text-right"
                />
              </div>
            </div>
            <div className="flex justify-between font-bold text-base-text border-t border-base-border pt-2">
              <span>Total</span>
              <span className="text-xylo-500">USD {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Estado, validez, notas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Estado</label>
              <select className={inp} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Válido hasta</label>
              <input type="date" className={inp} value={form.valid_until} onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={lbl}>Notas</label>
            <textarea className={inp + " resize-none"} rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Condiciones, observaciones..." />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition">
            {saving ? "Guardando..." : (isNew ? "Crear presupuesto" : "Guardar cambios")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter !== "all" ? `/quotes?status=${filter}` : "/quotes";
      const res = await api.get(url);
      setQuotes(res.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    try { await api.delete(`/quotes/${id}`); load(); } catch {}
    setConfirmDelete(null);
  }

  async function updateStatus(id, status) {
    try { await api.patch(`/quotes/${id}`, { status }); load(); } catch {}
  }

  function fmt(val) {
    return Number(val || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtDate(val) {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("es-AR");
  }

  return (
    <div>
      <Header title="Presupuestos" subtitle="Cotizaciones para clientes" />

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* Filtros de estado */}
        <div className="flex gap-2 flex-wrap">
          {[["all", "Todos"], ...Object.entries(STATUS_META).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filter === k ? "bg-xylo-500 text-white" : "bg-base-card border border-base-border text-base-muted hover:bg-base-subtle"}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition shadow-sm">
          <Plus size={15} /> Nuevo presupuesto
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-base-muted py-6">Cargando...</p>
        ) : quotes.length === 0 ? (
          <div className="bg-base-card border border-base-border rounded-2xl p-12 text-center">
            <FileText size={32} className="text-base-muted mx-auto mb-3" />
            <p className="text-sm text-base-muted">No hay presupuestos{filter !== "all" ? ` con estado "${STATUS_META[filter]?.label}"` : ""}.</p>
          </div>
        ) : quotes.map((q) => {
          const meta = STATUS_META[q.status] || STATUS_META.draft;
          const isOpen = expanded === q.id;

          return (
            <div key={q.id} className="bg-base-card border border-base-border rounded-2xl overflow-hidden">
              {/* Header de la tarjeta */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-base-subtle/40 transition"
                onClick={() => setExpanded(isOpen ? null : q.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-base-muted font-mono">#{q.id}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                    {q.valid_until && new Date(q.valid_until) < new Date() && q.status !== "accepted" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Vencido</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-base-text truncate">{q.client_name}</p>
                  {q.client_phone && <p className="text-xs text-base-muted">{q.client_phone}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-xylo-500">USD {fmt(q.total_usd)}</p>
                  <p className="text-xs text-base-muted">{fmtDate(q.created_at)}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={(e) => { e.stopPropagation(); setModal(q); }}
                    className="p-1.5 rounded-lg bg-base-subtle text-base-muted hover:text-base-text transition">
                    <FileText size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(q.id); }}
                    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                  {isOpen ? <ChevronDown size={16} className="text-base-muted" /> : <ChevronRight size={16} className="text-base-muted" />}
                </div>
              </div>

              {/* Detalle expandible */}
              {isOpen && (
                <div className="border-t border-base-border px-5 pb-5 pt-3">
                  {/* Ítems */}
                  <p className="text-xs font-semibold text-base-muted uppercase tracking-wide mb-2">Ítems</p>
                  <div className="space-y-1 mb-4">
                    {(q.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-base-text">{item.description} <span className="text-base-muted">× {item.quantity}</span></span>
                        <span className="text-base-muted">USD {fmt(item.subtotal_usd)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totales */}
                  <div className="bg-base-subtle rounded-xl p-3 text-sm space-y-1 mb-4">
                    {Number(q.discount_usd) > 0 && (
                      <div className="flex justify-between text-base-muted">
                        <span>Subtotal</span><span>USD {fmt(q.subtotal_usd)}</span>
                      </div>
                    )}
                    {Number(q.discount_usd) > 0 && (
                      <div className="flex justify-between text-base-muted">
                        <span>Descuento</span><span>− USD {fmt(q.discount_usd)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base-text">
                      <span>Total</span><span className="text-xylo-500">USD {fmt(q.total_usd)}</span>
                    </div>
                  </div>

                  {/* Notas */}
                  {q.notes && (
                    <p className="text-xs text-base-muted italic mb-4">{q.notes}</p>
                  )}

                  {/* Cambiar estado rápido */}
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-base-muted self-center">Cambiar estado:</p>
                    {Object.entries(STATUS_META).filter(([k]) => k !== q.status).map(([k, v]) => (
                      <button key={k} onClick={() => updateStatus(q.id, k)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${v.cls}`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal !== null && (
        <QuoteModal quote={modal} onClose={() => setModal(null)} onSave={() => { load(); setModal(null); }} />
      )}

      {/* Confirm delete */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-base-card border border-base-border rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Trash2 size={28} className="text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-base-text mb-2">¿Eliminar presupuesto?</h3>
            <p className="text-sm text-base-muted mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-base-subtle text-base-muted rounded-xl py-2.5 text-sm font-medium">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
