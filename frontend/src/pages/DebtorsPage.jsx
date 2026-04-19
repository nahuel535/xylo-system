import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { UserX, Plus, X, Check, Pencil, Trash2, Phone, Mail, MapPin, DollarSign, Calendar, ChevronDown, ChevronUp } from "lucide-react";

const initialForm = {
  name: "", phone: "", email: "", address: "",
  amount_usd: "", due_date: "", description: "", paid: false,
};

const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // debtor id being edited
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showPaid, setShowPaid] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/debtors/");
      setDebtors(res.data);
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

  function openEdit(d) {
    setEditing(d.id);
    setForm({
      name: d.name || "",
      phone: d.phone || "",
      email: d.email || "",
      address: d.address || "",
      amount_usd: d.amount_usd || "",
      due_date: d.due_date || "",
      description: d.description || "",
      paid: d.paid || false,
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount_usd: Number(form.amount_usd || 0),
        due_date: form.due_date || null,
      };
      if (editing) {
        await api.put(`/debtors/${editing}`, payload);
      } else {
        await api.post("/debtors/", payload);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(id) {
    try {
      await api.patch(`/debtors/${id}/toggle-paid`);
      load();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este deudor?")) return;
    try {
      await api.delete(`/debtors/${id}`);
      load();
    } catch (e) { console.error(e); }
  }

  const pending = debtors.filter((d) => !d.paid);
  const paid = debtors.filter((d) => d.paid);
  const totalPending = pending.reduce((s, d) => s + Number(d.amount_usd), 0);

  function isOverdue(d) {
    if (!d.due_date || d.paid) return false;
    return new Date(d.due_date) < new Date();
  }

  return (
    <div>
      <Header title="Deudores" subtitle="Control de deudas pendientes" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
          <p className="text-xs text-base-muted mb-1">Deudas pendientes</p>
          <p className="text-2xl font-bold text-base-text">{pending.length}</p>
        </div>
        <div className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
          <p className="text-xs text-base-muted mb-1">Total adeudado</p>
          <p className="text-2xl font-bold text-red-500">USD {totalPending.toLocaleString("es-AR", { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card col-span-2 md:col-span-1">
          <p className="text-xs text-base-muted mb-1">Cobradas</p>
          <p className="text-2xl font-bold text-green-500">{paid.length}</p>
        </div>
      </div>

      {/* Header actions */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-base-muted">{pending.length} deuda{pending.length !== 1 ? "s" : ""} activa{pending.length !== 1 ? "s" : ""}</p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition shadow-sm"
        >
          <Plus size={15} />
          Nuevo deudor
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-base-card border border-base-border rounded-2xl p-5 mb-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-base-text">
              {editing ? "Editar deudor" : "Agregar deudor"}
            </p>
            <button onClick={closeForm} className="p-1.5 rounded-lg text-base-muted hover:bg-base-subtle transition">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-base-muted mb-1.5">Nombre *</p>
                <input required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre completo" className={inputClass} />
              </div>
              <div>
                <p className="text-xs text-base-muted mb-1.5">Teléfono</p>
                <input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+54 9 11 1234-5678" className={inputClass} />
              </div>
              <div>
                <p className="text-xs text-base-muted mb-1.5">Email</p>
                <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@ejemplo.com" className={inputClass} />
              </div>
              <div>
                <p className="text-xs text-base-muted mb-1.5">Dirección</p>
                <input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Calle, número, ciudad" className={inputClass} />
              </div>
              <div>
                <p className="text-xs text-base-muted mb-1.5">Monto adeudado (USD) *</p>
                <input required type="number" min="0" step="0.01" value={form.amount_usd}
                  onChange={(e) => setForm(p => ({ ...p, amount_usd: e.target.value }))}
                  placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <p className="text-xs text-base-muted mb-1.5">Fecha de vencimiento</p>
                <input type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className={inputClass} />
              </div>
              <div className="sm:col-span-2 xl:col-span-3">
                <p className="text-xs text-base-muted mb-1.5">Descripción / Motivo</p>
                <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Detalle de la deuda, producto, acuerdo, etc."
                  rows={2} className={`${inputClass} min-h-[70px] resize-none`} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" disabled={saving}
                className="bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar deudor"}
              </button>
              <button type="button" onClick={closeForm}
                className="bg-base-subtle hover:bg-base-border text-base-muted rounded-xl px-5 py-2.5 text-sm transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista pendientes */}
      {loading ? (
        <p className="text-base-muted text-sm">Cargando deudores...</p>
      ) : pending.length === 0 ? (
        <div className="bg-base-card border border-base-border rounded-2xl p-10 text-center shadow-card">
          <UserX size={32} className="mx-auto text-base-muted mb-3 opacity-40" />
          <p className="text-base-muted text-sm">No hay deudas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {pending.map((d) => (
            <DebtorCard
              key={d.id}
              debtor={d}
              overdue={isOverdue(d)}
              expanded={expandedId === d.id}
              onToggleExpand={() => setExpandedId(expandedId === d.id ? null : d.id)}
              onEdit={() => openEdit(d)}
              onDelete={() => handleDelete(d.id)}
              onTogglePaid={() => togglePaid(d.id)}
            />
          ))}
        </div>
      )}

      {/* Lista pagadas (colapsable) */}
      {paid.length > 0 && (
        <div>
          <button
            onClick={() => setShowPaid(v => !v)}
            className="flex items-center gap-2 text-sm text-base-muted hover:text-base-text transition mb-3"
          >
            {showPaid ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            Ver deudas cobradas ({paid.length})
          </button>
          {showPaid && (
            <div className="space-y-3 opacity-60">
              {paid.map((d) => (
                <DebtorCard
                  key={d.id}
                  debtor={d}
                  overdue={false}
                  expanded={expandedId === d.id}
                  onToggleExpand={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  onEdit={() => openEdit(d)}
                  onDelete={() => handleDelete(d.id)}
                  onTogglePaid={() => togglePaid(d.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DebtorCard({ debtor: d, overdue, expanded, onToggleExpand, onEdit, onDelete, onTogglePaid }) {
  return (
    <div className={`bg-base-card border rounded-2xl shadow-card overflow-hidden transition-all ${
      overdue ? "border-red-200" : d.paid ? "border-green-200" : "border-base-border"
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          d.paid ? "bg-green-400" : overdue ? "bg-red-400 animate-pulse" : "bg-yellow-400"
        }`} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-base-text text-sm">{d.name}</p>
            {overdue && (
              <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Vencida</span>
            )}
            {d.paid && (
              <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Cobrada</span>
            )}
          </div>
          {d.description && (
            <p className="text-xs text-base-muted truncate mt-0.5">{d.description}</p>
          )}
        </div>

        {/* Amount */}
        <p className={`text-base font-bold flex-shrink-0 ${d.paid ? "text-green-500" : "text-red-500"}`}>
          USD {Number(d.amount_usd).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </p>

        {/* Expand toggle */}
        <button onClick={onToggleExpand} className="p-1.5 rounded-lg text-base-muted hover:bg-base-subtle transition flex-shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-base-border px-4 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {d.phone && (
              <a href={`tel:${d.phone}`} className="flex items-center gap-2 text-sm text-base-text hover:text-xylo-500 transition">
                <Phone size={13} className="text-base-muted flex-shrink-0" />
                {d.phone}
              </a>
            )}
            {d.email && (
              <a href={`mailto:${d.email}`} className="flex items-center gap-2 text-sm text-base-text hover:text-xylo-500 transition truncate">
                <Mail size={13} className="text-base-muted flex-shrink-0" />
                <span className="truncate">{d.email}</span>
              </a>
            )}
            {d.address && (
              <div className="flex items-center gap-2 text-sm text-base-text sm:col-span-2">
                <MapPin size={13} className="text-base-muted flex-shrink-0" />
                {d.address}
              </div>
            )}
            {d.due_date && (
              <div className="flex items-center gap-2 text-sm text-base-text">
                <Calendar size={13} className="text-base-muted flex-shrink-0" />
                Vence: {new Date(d.due_date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onTogglePaid}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                d.paid
                  ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              <Check size={13} />
              {d.paid ? "Marcar pendiente" : "Marcar cobrada"}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 bg-base-subtle hover:bg-base-border text-base-muted rounded-xl px-3 py-2 text-xs font-medium transition"
            >
              <Pencil size={13} />
              Editar
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl px-3 py-2 text-xs font-medium transition ml-auto"
            >
              <Trash2 size={13} />
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
