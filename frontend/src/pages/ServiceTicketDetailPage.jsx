import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, Phone, Save, ShieldCheck, Smartphone, User as UserIcon,
} from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { TICKET_STATUS } from "./ServiceTicketsPage";

const inputClass =
  "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

const STATUS_FLOW = ["recibido", "diagnostico", "reparacion", "listo", "entregado", "cancelado"];

export default function ServiceTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const requests = [api.get(`/service-tickets/${id}`)];
      if (isAdmin) requests.push(api.get("/users/"));
      const [ticketRes, usersRes] = await Promise.all(requests);
      setTicket(ticketRes.data);
      setForm({
        status: ticketRes.data.status,
        diagnosis: ticketRes.data.diagnosis || "",
        assigned_technician_id: ticketRes.data.assigned_technician_id || "",
        estimated_cost_usd: ticketRes.data.estimated_cost_usd ?? "",
        final_cost_usd: ticketRes.data.final_cost_usd ?? "",
        parts_used: ticketRes.data.parts_used || "",
        warranty_days: ticketRes.data.warranty_days ?? "",
        notes: ticketRes.data.notes || "",
      });
      if (usersRes) {
        setTechnicians(usersRes.data.filter((u) => u.role === "technician" && u.is_active));
      }
    } catch {
      setError("No se pudo cargar el ticket.");
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await api.patch(`/service-tickets/${id}`, {
        status: form.status,
        diagnosis: form.diagnosis.trim() || null,
        assigned_technician_id: form.assigned_technician_id ? Number(form.assigned_technician_id) : null,
        estimated_cost_usd: form.estimated_cost_usd !== "" ? Number(form.estimated_cost_usd) : null,
        final_cost_usd: form.final_cost_usd !== "" ? Number(form.final_cost_usd) : null,
        parts_used: form.parts_used.trim() || null,
        warranty_days: form.warranty_days !== "" ? Number(form.warranty_days) : null,
        notes: form.notes.trim() || null,
      });
      setTicket(res.data);
      setMessage("Ticket actualizado.");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "No se pudo actualizar el ticket.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-base-muted">Cargando ticket...</p>;
  if (!ticket || !form) return <p className="text-sm text-red-500">{error || "Ticket no encontrado."}</p>;

  const status = TICKET_STATUS[ticket.status] || TICKET_STATUS.recibido;
  const deviceLabel = [ticket.device_brand, ticket.device_model].filter(Boolean).join(" ") || "Equipo sin especificar";

  return (
    <div>
      <button onClick={() => navigate("/servicio-tecnico")} className="flex items-center gap-1.5 text-sm text-base-muted hover:text-base-text mb-4">
        <ArrowLeft size={15} /> Volver a tickets
      </button>

      <div className="flex items-start justify-between gap-4 mb-5">
        <Header title={`Ticket #${ticket.id}`} subtitle={deviceLabel} />
        <span className={`text-xs font-semibold rounded-full px-3 py-1 ${status.className}`}>{status.label}</span>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
          {message}
        </div>
      )}

      <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow icon={UserIcon} label="Cliente" value={ticket.client_name} />
          <InfoRow icon={Phone} label="Teléfono" value={ticket.client_phone || "—"} />
          <InfoRow icon={Smartphone} label="Equipo" value={deviceLabel} />
          <InfoRow icon={Smartphone} label="IMEI / N° de serie" value={ticket.device_imei || "—"} />
          <InfoRow icon={Calendar} label="Recibido" value={formatDate(ticket.received_at)} />
          {ticket.warranty_expires_at && (
            <InfoRow icon={ShieldCheck} label="Garantía hasta" value={formatDateOnly(ticket.warranty_expires_at)} />
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-base-border">
          <p className="text-xs font-medium text-base-muted mb-1">Problema informado</p>
          <p className="text-sm text-base-text">{ticket.issue_description}</p>
        </div>
      </div>

      <form onSubmit={save} className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Estado">
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
              {STATUS_FLOW.map((value) => (
                <option key={value} value={value}>{TICKET_STATUS[value].label}</option>
              ))}
            </select>
          </Field>
          {isAdmin && (
            <Field label="Técnico asignado">
              <select value={form.assigned_technician_id} onChange={(e) => setForm((p) => ({ ...p, assigned_technician_id: e.target.value }))} className={inputClass}>
                <option value="">Sin asignar</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <Field label="Diagnóstico">
          <textarea rows={3} value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} placeholder="Qué se detectó en la revisión..." className={inputClass} />
        </Field>

        <Field label="Piezas / repuestos usados">
          <textarea rows={2} value={form.parts_used} onChange={(e) => setForm((p) => ({ ...p, parts_used: e.target.value }))} placeholder="Ej: Pantalla iPhone 13, batería..." className={inputClass} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Presupuesto estimado (USD)">
            <input type="number" min="0" step="0.01" value={form.estimated_cost_usd} onChange={(e) => setForm((p) => ({ ...p, estimated_cost_usd: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Costo final (USD)">
            <input type="number" min="0" step="0.01" value={form.final_cost_usd} onChange={(e) => setForm((p) => ({ ...p, final_cost_usd: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Garantía (días)">
            <input type="number" min="0" step="1" value={form.warranty_days} onChange={(e) => setForm((p) => ({ ...p, warranty_days: e.target.value }))} placeholder="Ej: 30" className={inputClass} />
          </Field>
        </div>

        <Field label="Notas internas">
          <textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputClass} />
        </Field>

        <button disabled={saving} className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
          <Save size={15} /> {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="text-base-muted mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-base-muted">{label}</p>
        <p className="text-sm text-base-text truncate">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block text-xs font-medium text-base-muted">{label}<div className="mt-1.5">{children}</div></label>;
}

function formatDate(value) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDateOnly(value) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}
