import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { useNotifications } from "../context/NotificationContext";
import {
  Plus, Search, Phone, Mail, Instagram, Bell, BellOff, Trash2,
  ChevronRight, X, Users, UserCheck, AlertCircle, Check,
  Clock, CheckCircle2, ChevronDown, ChevronUp, MessageCircle,
  CalendarPlus, Send, Settings2, MailCheck, MailX,
} from "lucide-react";

// Genera URL para agregar al Google Calendar (sin OAuth, abre en navegador)
function gcalUrl(dueDateStr, title, description) {
  const d = dueDateStr.replace(/-/g, "");
  const next = (() => {
    const dt = new Date(dueDateStr + "T00:00:00");
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString().slice(0, 10).replace(/-/g, "");
  })();
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${d}/${next}&details=${encodeURIComponent(description || "")}`;
}

const STATUS_META = {
  lead:     { label: "Lead",     bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-600 dark:text-amber-400",  border: "border-amber-200 dark:border-amber-800"  },
  client:   { label: "Cliente",  bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-600 dark:text-green-400",  border: "border-green-200 dark:border-green-800"  },
  inactive: { label: "Inactivo", bg: "bg-gray-100 dark:bg-gray-900/40",   text: "text-gray-500 dark:text-gray-400",    border: "border-gray-200 dark:border-gray-700"    },
};

const REMINDER_META = {
  followup_1week: { label: "Seguimiento 1 semana", icon: MessageCircle, color: "text-blue-500" },
  promo_3months:  { label: "Promo amigos 3 meses",  icon: Bell,          color: "text-purple-500" },
  custom:         { label: "Recordatorio",          icon: Clock,         color: "text-base-muted" },
};

const SOURCES = ["", "venta", "referido", "instagram", "facebook", "whatsapp", "otro"];
const SOURCE_LABELS = { "": "—", venta: "Venta", referido: "Referido", instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", otro: "Otro" };

const blankForm = { name: "", phone: "", email: "", instagram: "", source: "", status: "lead", tags: "", notes: "", needs_followup: false, followup_date: "" };

const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

function parseTags(str) {
  if (!str) return [];
  return str.split(",").map((t) => t.trim()).filter(Boolean);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function urgencyOf(dueDateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + "T00:00:00");
  const diff = Math.floor((due - today) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "soon";
  return "future";
}

const URGENCY_STYLE = {
  overdue: { border: "border-red-200 dark:border-red-800",   bg: "bg-red-50 dark:bg-red-950/30",    badge: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",   label: "Vencido" },
  today:   { border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400", label: "Hoy" },
  soon:    { border: "border-blue-200 dark:border-blue-800",  bg: "bg-blue-50 dark:bg-blue-950/30",  badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",  label: "Esta semana" },
  future:  { border: "border-base-border",                    bg: "bg-base-card",                     badge: "bg-base-subtle text-base-muted",                                    label: "Próximo" },
};

export default function CRMPage() {
  const { refresh: refreshCount } = useNotifications();

  const [clients, setClients] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remindersOpen, setRemindersOpen] = useState(true);

  // Email / notificaciones
  const [emailStatus, setEmailStatus] = useState(null); // { email_configured, notify_email }
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestResult, setDigestResult] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [followupOnly, setFollowupOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadAll(); loadEmailStatus(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [clientsRes, remindersRes] = await Promise.all([
        api.get("/clients/"),
        api.get("/clients/reminders?status=pending"),
      ]);
      setClients(clientsRes.data);
      setReminders(remindersRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadEmailStatus() {
    try {
      const res = await api.get("/notifications/status");
      setEmailStatus(res.data);
    } catch {}
  }

  async function sendDigest() {
    setSendingDigest(true);
    setDigestResult(null);
    try {
      const res = await api.post("/notifications/send-digest");
      setDigestResult(res.data);
    } catch (e) {
      setDigestResult({ message: "Error al enviar el email.", sent: false });
    } finally {
      setSendingDigest(false);
    }
  }

  function handleChange(ev) {
    const { name, value, type, checked } = ev.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!form.name.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true); setError("");
    try {
      await api.post("/clients/", {
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        instagram: form.instagram || null,
        source: form.source || null,
        status: form.status,
        tags: parseTags(form.tags),
        notes: form.notes || null,
        needs_followup: form.needs_followup,
        followup_date: form.followup_date || null,
      });
      await loadAll();
      setShowModal(false);
      setForm(blankForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Error al guardar. Intentá de nuevo."); }
    finally { setSaving(false); }
  }

  async function toggleFollowup(client) {
    const next = !client.needs_followup;
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, needs_followup: next } : c));
    try { await api.put(`/clients/${client.id}`, { needs_followup: next }); }
    catch { setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, needs_followup: client.needs_followup } : c)); }
  }

  async function deleteClient(id) {
    try {
      await api.delete(`/clients/${id}`);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch {}
    finally { setConfirmDelete(null); }
  }

  async function markReminder(id, status) {
    try {
      await api.put(`/clients/reminders/${id}`, { status });
      setReminders((prev) => prev.filter((r) => r.id !== id));
      refreshCount();
    } catch {}
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (followupOnly && !c.needs_followup) return false;
      if (q &&
        !c.name.toLowerCase().includes(q) &&
        !(c.phone || "").includes(q) &&
        !(c.email || "").toLowerCase().includes(q) &&
        !(c.instagram || "").toLowerCase().includes(q) &&
        !(c.tags || []).some((t) => t.toLowerCase().includes(q))
      ) return false;
      return true;
    });
  }, [clients, search, statusFilter, followupOnly]);

  const stats = useMemo(() => ({
    clients: clients.filter((c) => c.status === "client").length,
    leads: clients.filter((c) => c.status === "lead").length,
    followup: clients.filter((c) => c.needs_followup).length,
  }), [clients]);

  const urgentCount = reminders.filter((r) => {
    const u = urgencyOf(r.due_date);
    return u === "overdue" || u === "today";
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <Header title="CRM" subtitle="Clientes y seguimiento comercial" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowEmailPanel((p) => !p); setDigestResult(null); }}
            title="Configuración de notificaciones"
            className={`p-2.5 rounded-xl border transition ${
              showEmailPanel
                ? "bg-xylo-500/10 border-xylo-500/30 text-xylo-500"
                : "border-base-border text-base-muted hover:bg-base-subtle hover:text-base-text"
            }`}
          >
            <Settings2 size={15} />
          </button>
          <button
            onClick={() => { setForm(blankForm); setError(""); setShowModal(true); }}
            className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            <Plus size={15} /> Agregar cliente
          </button>
        </div>
      </div>

      {/* ── Panel de notificaciones por email ── */}
      {showEmailPanel && (
        <div className="mb-5 bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={15} className="text-xylo-500" />
            <h3 className="text-sm font-semibold text-base-text">Notificaciones por email</h3>
          </div>

          {emailStatus ? (
            emailStatus.email_configured ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <MailCheck size={15} />
                  <span>Email configurado: <strong>{emailStatus.notify_email}</strong></span>
                </div>
                <p className="text-xs text-base-muted">
                  Enviá un resumen ahora con todos los seguimientos pendientes de los próximos 7 días.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={sendDigest}
                    disabled={sendingDigest}
                    className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    <Send size={13} /> {sendingDigest ? "Enviando..." : "Enviar resumen ahora"}
                  </button>
                  {digestResult && (
                    <span className={`text-xs font-medium ${digestResult.sent ? "text-green-500" : "text-amber-500"}`}>
                      {digestResult.message} {digestResult.count !== undefined && `(${digestResult.count} seguimientos)`}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <MailX size={15} />
                  <span>Email no configurado</span>
                </div>
                <p className="text-xs text-base-muted">
                  Agregá estas variables de entorno en Railway para recibir el resumen diario de seguimientos:
                </p>
                <div className="bg-base-subtle border border-base-border rounded-xl px-4 py-3 font-mono text-xs text-base-text space-y-1">
                  <p>SMTP_HOST=smtp.gmail.com</p>
                  <p>SMTP_PORT=587</p>
                  <p>SMTP_USER=tu@gmail.com</p>
                  <p>SMTP_PASS=contraseña_de_aplicación</p>
                  <p>NOTIFY_EMAIL=donde_llega@email.com</p>
                </div>
                <p className="text-xs text-base-muted">
                  Para Gmail usá una <em>contraseña de aplicación</em> (requiere 2FA activado en tu cuenta Google).
                </p>
              </div>
            )
          ) : (
            <p className="text-sm text-base-muted">Cargando configuración...</p>
          )}
        </div>
      )}

      {/* ── Seguimientos pendientes ── */}
      {reminders.length > 0 && (
        <div className="mb-5 bg-base-card border border-base-border rounded-2xl shadow-card overflow-hidden">
          <button
            onClick={() => setRemindersOpen((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-base-subtle/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell size={16} className="text-xylo-500" />
                {urgentCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {urgentCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-base-text">
                Seguimientos pendientes
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-xylo-500/10 text-xylo-500">
                {reminders.length}
              </span>
            </div>
            {remindersOpen ? <ChevronUp size={15} className="text-base-muted" /> : <ChevronDown size={15} className="text-base-muted" />}
          </button>

          {remindersOpen && (
            <div className="border-t border-base-border divide-y divide-base-border">
              {reminders.map((r) => {
                const urgency = urgencyOf(r.due_date);
                const us = URGENCY_STYLE[urgency];
                const meta = REMINDER_META[r.type] || REMINDER_META.custom;
                const Icon = meta.icon;
                return (
                  <div key={r.id} className={`flex items-start gap-4 px-5 py-4 ${us.bg} transition`}>
                    {/* Urgency badge */}
                    <div className="flex-shrink-0 pt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${us.badge}`}>
                        {urgency === "overdue" ? "VENCIDO" : urgency === "today" ? "HOY" : urgency === "soon" ? "ESTA SEMANA" : formatDate(r.due_date)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon size={13} className={meta.color} />
                        <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                        <span className="text-base-muted text-xs">·</span>
                        <Link to={`/crm/${r.client_id}`} className="text-sm font-semibold text-base-text hover:text-xylo-500 transition truncate">
                          {r.client_name}
                        </Link>
                        {(r.client_phone || r.client_instagram) && (
                          <span className="text-xs text-base-muted">
                            {r.client_phone || `@${r.client_instagram}`}
                          </span>
                        )}
                      </div>
                      {r.note && (
                        <p className="text-xs text-base-muted mt-1 leading-relaxed">{r.note}</p>
                      )}
                      {urgency === "future" && (
                        <p className="text-xs text-base-muted mt-0.5">{formatDate(r.due_date)}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={gcalUrl(r.due_date, `${meta.label}: ${r.client_name}`, r.note || "")}
                        target="_blank"
                        rel="noreferrer"
                        title="Agregar a Google Calendar"
                        className="p-1.5 rounded-lg text-base-muted hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-500 transition"
                      >
                        <CalendarPlus size={13} />
                      </a>
                      <button
                        onClick={() => markReminder(r.id, "done")}
                        title="Marcar como hecho"
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition"
                      >
                        <CheckCircle2 size={12} /> Hecho
                      </button>
                      <button
                        onClick={() => markReminder(r.id, "dismissed")}
                        title="Descartar"
                        className="p-1.5 rounded-lg text-base-muted hover:bg-base-subtle hover:text-base-text transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon={<UserCheck size={15} />} label="Clientes" value={stats.clients} accent="green" />
        <StatCard icon={<Users size={15} />} label="Leads" value={stats.leads} accent="amber" />
        <StatCard icon={<AlertCircle size={15} />} label="Seguimiento" value={stats.followup} accent="red" />
      </div>

      {/* Filters */}
      <div className="bg-base-card border border-base-border rounded-2xl p-4 mb-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-base-subtle border border-base-border rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search size={13} className="text-base-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, email, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-base-text outline-none w-full placeholder:text-base-muted/60"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-base-muted hover:text-base-text transition flex-shrink-0">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-base-subtle rounded-xl p-1 border border-base-border">
            {[
              { value: "all", label: "Todos" },
              { value: "lead", label: "Leads" },
              { value: "client", label: "Clientes" },
              { value: "inactive", label: "Inactivos" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  statusFilter === value ? "bg-base-card text-base-text shadow-sm" : "text-base-muted hover:text-base-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFollowupOnly((p) => !p)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition ${
              followupOnly
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "border-base-border text-base-muted hover:border-base-muted"
            }`}
          >
            <Bell size={12} /> Seguimiento
          </button>
        </div>
        <p className="text-xs text-base-muted mt-2">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-base-muted text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-base-border rounded-2xl text-base-muted text-sm">
          {clients.length === 0 ? "Todavía no hay clientes. ¡Agregá el primero!" : "Sin resultados para los filtros aplicados."}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-base-card border border-base-border rounded-2xl overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-base-subtle border-b border-base-border">
                <tr>
                  {["Nombre", "Estado", "Contacto", "Fuente", "Tags", "Último contacto", "Seguimiento", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-base-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const sm = STATUS_META[c.status] || STATUS_META.lead;
                  return (
                    <tr key={c.id} className="border-t border-base-border hover:bg-base-subtle/40 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-base-text">{c.name}</p>
                        {c.notes && <p className="text-xs text-base-muted truncate max-w-[160px]">{c.notes}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${sm.bg} ${sm.text} ${sm.border}`}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-base-muted space-y-0.5">
                        {c.phone && <div className="flex items-center gap-1"><Phone size={10} />{c.phone}</div>}
                        {c.email && <div className="flex items-center gap-1"><Mail size={10} />{c.email}</div>}
                        {c.instagram && <div className="flex items-center gap-1"><Instagram size={10} />@{c.instagram}</div>}
                        {!c.phone && !c.email && !c.instagram && <span>—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-base-muted capitalize">
                        {c.source ? SOURCE_LABELS[c.source] || c.source : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(c.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-xylo-500/10 text-xylo-500">{tag}</span>
                          ))}
                          {(c.tags || []).length > 3 && <span className="text-[10px] text-base-muted">+{c.tags.length - 3}</span>}
                          {!(c.tags || []).length && <span className="text-xs text-base-muted">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-base-muted whitespace-nowrap">{formatDate(c.last_contact_date)}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleFollowup(c)}
                          className={`p-1.5 rounded-lg transition ${
                            c.needs_followup
                              ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
                              : "text-base-muted hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          }`}
                        >
                          {c.needs_followup ? <Bell size={14} /> : <BellOff size={14} />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link to={`/crm/${c.id}`} className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted hover:text-base-text transition">
                            <ChevronRight size={14} />
                          </Link>
                          {confirmDelete === c.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deleteClient(c.id)} className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">Eliminar</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-[11px] px-2 py-1 rounded-lg border border-base-border text-base-muted hover:bg-base-subtle transition">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition">
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
          <div className="md:hidden space-y-3">
            {filtered.map((c) => {
              const sm = STATUS_META[c.status] || STATUS_META.lead;
              return (
                <div key={c.id} className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-base-text text-sm truncate">{c.name}</p>
                      {c.notes && <p className="text-xs text-base-muted mt-0.5 truncate">{c.notes}</p>}
                    </div>
                    <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${sm.bg} ${sm.text} ${sm.border}`}>
                      {sm.label}
                    </span>
                  </div>
                  <div className="text-xs text-base-muted space-y-1 mb-3">
                    {c.phone && <div className="flex items-center gap-1.5"><Phone size={10} />{c.phone}</div>}
                    {c.email && <div className="flex items-center gap-1.5"><Mail size={10} />{c.email}</div>}
                    {c.instagram && <div className="flex items-center gap-1.5"><Instagram size={10} />@{c.instagram}</div>}
                    {c.last_contact_date && <p className="text-[11px]">Último contacto: {formatDate(c.last_contact_date)}</p>}
                  </div>
                  {(c.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-xylo-500/10 text-xylo-500">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-base-border">
                    <Link to={`/crm/${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-xylo-500/10 text-xylo-500 hover:bg-xylo-500/20 transition">
                      Ver detalle <ChevronRight size={12} />
                    </Link>
                    <button onClick={() => toggleFollowup(c)} className={`p-2 rounded-xl border transition ${c.needs_followup ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "border-base-border text-base-muted hover:text-amber-500"}`}>
                      {c.needs_followup ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>
                    {confirmDelete === c.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteClient(c.id)} className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-500 text-white">Sí</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs px-3 py-2 rounded-xl border border-base-border text-base-muted">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(c.id)} className="p-2 rounded-xl border border-base-border text-base-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add client modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-base-text">Agregar cliente / lead</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted transition"><X size={14} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Nombre <span className="text-red-400">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Teléfono</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+54 9 11 1234-5678" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="email@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Instagram</label>
                  <div className="flex items-center border border-base-border bg-base-subtle rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-xylo-500/20 focus-within:border-xylo-500">
                    <span className="pl-3 text-sm text-base-muted">@</span>
                    <input name="instagram" value={form.instagram} onChange={handleChange} className="flex-1 bg-transparent px-2 py-2.5 text-base-text text-sm outline-none" placeholder="usuario" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Fuente</label>
                  <select name="source" value={form.source} onChange={handleChange} className={inputClass}>
                    {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Estado</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                    <option value="lead">Lead</option>
                    <option value="client">Cliente</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Tags <span className="opacity-40">separados por coma</span></label>
                  <input name="tags" value={form.tags} onChange={handleChange} className={inputClass} placeholder="iphone15, presupuesto bajo..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Notas <span className="opacity-40">opcional</span></label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition resize-none" placeholder="Observaciones sobre el cliente..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="needs_followup" checked={form.needs_followup} onChange={handleChange} className="w-4 h-4 accent-xylo-500" />
                <span className="text-sm text-base-text">Marcar para seguimiento</span>
              </label>
              {form.needs_followup && (
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Fecha de seguimiento</label>
                  <input name="followup_date" type="date" value={form.followup_date} onChange={handleChange} className={inputClass} />
                </div>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-base-border text-base-muted rounded-xl py-2.5 text-sm hover:bg-base-subtle transition">Cancelar</button>
                <button type="submit" disabled={saving} className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${saved ? "bg-green-500 text-white" : "bg-xylo-500 hover:bg-xylo-600 text-white"}`}>
                  {saved ? <><Check size={14} /> Guardado</> : saving ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  const accents = {
    green: { bg: "bg-green-500/10", text: "text-green-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
    red:   { bg: "bg-red-400/10",   text: "text-red-400"   },
  };
  const { bg, text } = accents[accent] || accents.green;
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
      <div className={`inline-flex p-2 rounded-xl ${bg} ${text} mb-2`}>{icon}</div>
      <p className="text-xl font-bold text-base-text">{value}</p>
      <p className="text-xs text-base-muted">{label}</p>
    </div>
  );
}
