import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, ClipboardList, Plus, Smartphone, User as UserIcon,
  Wrench, X,
} from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const inputClass =
  "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

export const TICKET_STATUS = {
  recibido: { label: "Recibido", className: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  diagnostico: { label: "Diagnóstico", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  reparacion: { label: "Reparación", className: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  listo: { label: "Listo para entregar", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  entregado: { label: "Entregado", className: "bg-base-subtle text-base-muted" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
};

const STATUS_ORDER = ["recibido", "diagnostico", "reparacion", "listo", "entregado", "cancelado"];

const emptyForm = {
  client_name: "",
  client_phone: "",
  device_brand: "",
  device_model: "",
  device_imei: "",
  issue_description: "",
  estimated_cost_usd: "",
  notes: "",
};

export default function ServiceTicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get("/service-tickets", { params });
      setTickets(res.data);
    } catch {
      setError("No se pudieron cargar los tickets.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const active = tickets.filter((t) => !["entregado", "cancelado"].includes(t.status));
    return {
      recibido: tickets.filter((t) => t.status === "recibido").length,
      diagnostico: tickets.filter((t) => t.status === "diagnostico").length,
      reparacion: tickets.filter((t) => t.status === "reparacion").length,
      listo: tickets.filter((t) => t.status === "listo").length,
      activos: active.length,
    };
  }, [tickets]);

  async function createTicket(e) {
    e.preventDefault();
    if (!form.client_name.trim() || !form.issue_description.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/service-tickets", {
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim() || null,
        device_brand: form.device_brand.trim() || null,
        device_model: form.device_model.trim() || null,
        device_imei: form.device_imei.trim() || null,
        issue_description: form.issue_description.trim(),
        estimated_cost_usd: form.estimated_cost_usd ? Number(form.estimated_cost_usd) : null,
        notes: form.notes.trim() || null,
      });
      setForm(emptyForm);
      setShowCreate(false);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "No se pudo crear el ticket.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <Header title="Servicio Técnico" subtitle="Recepción, diagnóstico y reparación de equipos" />
        <button
          onClick={() => { setError(""); setShowCreate(true); }}
          className="mt-1 flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
        >
          <Plus size={15} /> <span className="hidden sm:inline">Nuevo ticket</span>
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Recibidos" value={counts.recibido} tone="text-blue-500 bg-blue-50 dark:bg-blue-950/30" />
        <SummaryCard label="En diagnóstico" value={counts.diagnostico} tone="text-amber-500 bg-amber-50 dark:bg-amber-950/30" />
        <SummaryCard label="En reparación" value={counts.reparacion} tone="text-violet-500 bg-violet-50 dark:bg-violet-950/30" />
        <SummaryCard label="Listos para entregar" value={counts.listo} tone="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" />
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        <FilterPill label="Todos" active={!statusFilter} onClick={() => setStatusFilter("")} />
        {STATUS_ORDER.map((status) => (
          <FilterPill
            key={status}
            label={TICKET_STATUS[status].label}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-base-muted">Cargando tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-base-subtle border border-base-border px-4 py-6 text-sm text-base-muted justify-center">
          <ClipboardList size={16} /> No hay tickets para mostrar.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = TICKET_STATUS[ticket.status] || TICKET_STATUS.recibido;
            const deviceLabel = [ticket.device_brand, ticket.device_model].filter(Boolean).join(" ") || "Equipo sin especificar";
            return (
              <button
                key={ticket.id}
                onClick={() => navigate(`/servicio-tecnico/${ticket.id}`)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-base-card border border-base-border text-left hover:border-xylo-500/40 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-base-subtle flex items-center justify-center flex-shrink-0">
                  <Smartphone size={17} className="text-base-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-base-text truncate">{ticket.client_name}</p>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="text-xs text-base-muted truncate">{deviceLabel}</p>
                  <p className="text-xs text-base-muted mt-1 line-clamp-1">{ticket.issue_description}</p>
                </div>
                {ticket.assigned_technician_name && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-base-muted flex-shrink-0">
                    <UserIcon size={12} /> {ticket.assigned_technician_name}
                  </span>
                )}
                <ChevronRight size={16} className="text-base-muted flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="Nuevo ticket de servicio técnico" onClose={() => setShowCreate(false)}>
          <form onSubmit={createTicket} className="space-y-4">
            <Field label="Cliente">
              <input required value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} placeholder="Nombre del cliente" className={inputClass} />
            </Field>
            <Field label="Teléfono">
              <input value={form.client_phone} onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))} placeholder="Opcional" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca">
                <input value={form.device_brand} onChange={(e) => setForm((p) => ({ ...p, device_brand: e.target.value }))} placeholder="Apple" className={inputClass} />
              </Field>
              <Field label="Modelo">
                <input value={form.device_model} onChange={(e) => setForm((p) => ({ ...p, device_model: e.target.value }))} placeholder="iPhone 13" className={inputClass} />
              </Field>
            </div>
            <Field label="IMEI / N° de serie">
              <input value={form.device_imei} onChange={(e) => setForm((p) => ({ ...p, device_imei: e.target.value }))} placeholder="Opcional" className={inputClass} />
            </Field>
            <Field label="Problema informado">
              <textarea required rows={3} value={form.issue_description} onChange={(e) => setForm((p) => ({ ...p, issue_description: e.target.value }))} placeholder="Qué le pasa al equipo..." className={inputClass} />
            </Field>
            <Field label="Presupuesto estimado (USD)">
              <input type="number" min="0" step="0.01" value={form.estimated_cost_usd} onChange={(e) => setForm((p) => ({ ...p, estimated_cost_usd: e.target.value }))} placeholder="Opcional" className={inputClass} />
            </Field>
            <Field label="Notas">
              <textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Opcional" className={inputClass} />
            </Field>
            <SubmitButtons saving={saving} onCancel={() => setShowCreate(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
        <Wrench size={16} />
      </div>
      <p className="text-2xl font-semibold text-base-text">{value}</p>
      <p className="text-xs text-base-muted mt-0.5">{label}</p>
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 text-xs font-semibold rounded-full px-3.5 py-1.5 transition ${
        active ? "bg-xylo-500 text-white" : "bg-base-subtle text-base-muted hover:text-base-text"
      }`}
    >
      {label}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

function SubmitButtons({ saving, onCancel }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onCancel} className="flex-1 border border-base-border text-base-muted rounded-xl py-2.5 text-sm hover:bg-base-subtle">Cancelar</button>
      <button disabled={saving} className="flex-1 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
