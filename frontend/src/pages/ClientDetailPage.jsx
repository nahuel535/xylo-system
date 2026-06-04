import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ChevronLeft, Phone, Mail, Instagram, Bell, BellOff,
  Pencil, Check, X, Trash2, Plus,
  PhoneCall, MessageCircle, Users2, FileText, AtSign,
} from "lucide-react";

const STATUS_META = {
  lead:     { label: "Lead",     bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-600 dark:text-amber-400",  border: "border-amber-200 dark:border-amber-800" },
  client:   { label: "Cliente",  bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-600 dark:text-green-400",  border: "border-green-200 dark:border-green-800" },
  inactive: { label: "Inactivo", bg: "bg-gray-100 dark:bg-gray-900/40",   text: "text-gray-500 dark:text-gray-400",    border: "border-gray-200 dark:border-gray-700"  },
};

const SOURCES = ["", "venta", "referido", "instagram", "facebook", "whatsapp", "otro"];
const SOURCE_LABELS = { "": "—", venta: "Venta", referido: "Referido", instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", otro: "Otro" };

const INTERACTION_TYPES = [
  { value: "llamada",    label: "Llamada",    icon: PhoneCall    },
  { value: "whatsapp",   label: "WhatsApp",   icon: MessageCircle },
  { value: "presencial", label: "Presencial", icon: Users2       },
  { value: "email",      label: "Email",      icon: AtSign       },
  { value: "nota",       label: "Nota",       icon: FileText     },
];

const INT_COLORS = {
  llamada:    { bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-500"   },
  whatsapp:   { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-500"  },
  presencial: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-500" },
  email:      { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-500" },
  nota:       { bg: "bg-gray-100 dark:bg-gray-900/40",  text: "text-gray-500"   },
};

const today = () => new Date().toISOString().slice(0, 10);

const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

function parseTags(str) {
  return str.split(",").map((t) => t.trim()).filter(Boolean);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Interaction form
  const [intForm, setIntForm] = useState({ type: "nota", content: "", date: today() });
  const [savingInt, setSavingInt] = useState(false);
  const [confirmDeleteInt, setConfirmDeleteInt] = useState(null);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/clients/${id}`);
      setClient(res.data);
    } catch { navigate("/crm"); }
    finally { setLoading(false); }
  }

  function startEdit() {
    setEditForm({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      instagram: client.instagram || "",
      source: client.source || "",
      status: client.status,
      tags: (client.tags || []).join(", "),
      notes: client.notes || "",
      needs_followup: client.needs_followup,
      followup_date: client.followup_date || "",
    });
    setEditError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditForm(null);
    setEditError("");
  }

  function handleEditChange(ev) {
    const { name, value, type, checked } = ev.target;
    setEditForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function saveEdit() {
    if (!editForm.name.trim()) { setEditError("El nombre es requerido."); return; }
    setSavingEdit(true); setEditError("");
    try {
      const res = await api.put(`/clients/${id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone || null,
        email: editForm.email || null,
        instagram: editForm.instagram || null,
        source: editForm.source || null,
        status: editForm.status,
        tags: parseTags(editForm.tags),
        notes: editForm.notes || null,
        needs_followup: editForm.needs_followup,
        followup_date: editForm.followup_date || null,
      });
      setClient(res.data);
      setEditing(false);
      setEditForm(null);
    } catch { setEditError("Error al guardar."); }
    finally { setSavingEdit(false); }
  }

  async function toggleFollowup() {
    const next = !client.needs_followup;
    setClient((p) => ({ ...p, needs_followup: next }));
    try {
      const res = await api.put(`/clients/${id}`, { needs_followup: next });
      setClient(res.data);
    } catch { setClient((p) => ({ ...p, needs_followup: client.needs_followup })); }
  }

  async function addInteraction(ev) {
    ev.preventDefault();
    if (!intForm.content.trim() && intForm.type !== "nota") return;
    setSavingInt(true);
    try {
      const res = await api.post(`/clients/${id}/interactions`, {
        type: intForm.type,
        content: intForm.content || null,
        date: intForm.date,
      });
      setClient((p) => ({
        ...p,
        interactions: [res.data, ...p.interactions],
        last_contact_date: intForm.date > (p.last_contact_date || "") ? intForm.date : p.last_contact_date,
      }));
      setIntForm((p) => ({ ...p, content: "", date: today() }));
    } catch {}
    finally { setSavingInt(false); }
  }

  async function deleteInteraction(intId) {
    try {
      await api.delete(`/clients/${id}/interactions/${intId}`);
      setClient((p) => ({
        ...p,
        interactions: p.interactions.filter((i) => i.id !== intId),
      }));
    } catch {}
    finally { setConfirmDeleteInt(null); }
  }

  if (loading) return <p className="text-base-muted">Cargando...</p>;
  if (!client) return null;

  const sm = STATUS_META[client.status] || STATUS_META.lead;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("/crm")}
            className="p-2 rounded-xl hover:bg-base-subtle text-base-muted hover:text-base-text transition mt-0.5"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-base-text">{client.name}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sm.bg} ${sm.text} ${sm.border}`}>
                {sm.label}
              </span>
              {client.needs_followup && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <Bell size={11} /> Seguimiento
                </span>
              )}
            </div>
            <p className="text-xs text-base-muted mt-1">
              Creado el {formatDate(client.created_at?.slice(0, 10))}
              {client.source && ` · Fuente: ${SOURCE_LABELS[client.source] || client.source}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFollowup}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition ${
              client.needs_followup
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "border-base-border text-base-muted hover:border-amber-300 hover:text-amber-500"
            }`}
          >
            {client.needs_followup ? <BellOff size={13} /> : <Bell size={13} />}
            <span className="hidden sm:inline">{client.needs_followup ? "Quitar seguimiento" : "Marcar seguimiento"}</span>
          </button>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-base-border text-base-muted hover:bg-base-subtle hover:text-base-text transition"
            >
              <Pencil size={13} />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT: Client info ── */}
        <div className="xl:col-span-1 space-y-4">

          {editing ? (
            <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
              <h3 className="text-sm font-semibold text-base-text mb-4">Editar información</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Nombre <span className="text-red-400">*</span></label>
                  <input name="name" value={editForm.name} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Teléfono</label>
                  <input name="phone" value={editForm.phone} onChange={handleEditChange} className={inputClass} placeholder="+54 9 11..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Email</label>
                  <input name="email" type="email" value={editForm.email} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Instagram</label>
                  <div className="flex items-center border border-base-border bg-base-subtle rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-xylo-500/20 focus-within:border-xylo-500">
                    <span className="pl-3 text-sm text-base-muted">@</span>
                    <input name="instagram" value={editForm.instagram} onChange={handleEditChange} className="flex-1 bg-transparent px-2 py-2.5 text-base-text text-sm outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-base-muted mb-1.5">Estado</label>
                    <select name="status" value={editForm.status} onChange={handleEditChange} className={inputClass}>
                      <option value="lead">Lead</option>
                      <option value="client">Cliente</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-base-muted mb-1.5">Fuente</label>
                    <select name="source" value={editForm.source} onChange={handleEditChange} className={inputClass}>
                      {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Tags <span className="opacity-40">separados por coma</span></label>
                  <input name="tags" value={editForm.tags} onChange={handleEditChange} className={inputClass} placeholder="tag1, tag2..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Notas</label>
                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="needs_followup" checked={editForm.needs_followup} onChange={handleEditChange} className="w-4 h-4 accent-xylo-500" />
                  <span className="text-sm text-base-text">Necesita seguimiento</span>
                </label>
                {editForm.needs_followup && (
                  <div>
                    <label className="block text-xs font-medium text-base-muted mb-1.5">Fecha de seguimiento</label>
                    <input name="followup_date" type="date" value={editForm.followup_date} onChange={handleEditChange} className={inputClass} />
                  </div>
                )}
                {editError && <p className="text-xs text-red-500">{editError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={cancelEdit} className="flex-1 border border-base-border text-base-muted rounded-xl py-2.5 text-sm hover:bg-base-subtle transition">
                    Cancelar
                  </button>
                  <button type="button" onClick={saveEdit} disabled={savingEdit} className="flex-1 bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                    {savingEdit ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
              <h3 className="text-sm font-semibold text-base-text mb-4">Información de contacto</h3>
              <div className="space-y-3">
                {client.phone && (
                  <InfoRow icon={<Phone size={14} />} label="Teléfono">
                    <a href={`tel:${client.phone}`} className="text-xylo-500 hover:underline">{client.phone}</a>
                  </InfoRow>
                )}
                {client.email && (
                  <InfoRow icon={<Mail size={14} />} label="Email">
                    <a href={`mailto:${client.email}`} className="text-xylo-500 hover:underline">{client.email}</a>
                  </InfoRow>
                )}
                {client.instagram && (
                  <InfoRow icon={<Instagram size={14} />} label="Instagram">
                    <a href={`https://instagram.com/${client.instagram}`} target="_blank" rel="noreferrer" className="text-xylo-500 hover:underline">
                      @{client.instagram}
                    </a>
                  </InfoRow>
                )}
                {!client.phone && !client.email && !client.instagram && (
                  <p className="text-sm text-base-muted">Sin datos de contacto.</p>
                )}
              </div>

              {(client.tags || []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-base-border">
                  <p className="text-xs font-medium text-base-muted uppercase tracking-wide mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.tags.map((tag) => (
                      <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-xylo-500/10 text-xylo-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {client.notes && (
                <div className="mt-4 pt-4 border-t border-base-border">
                  <p className="text-xs font-medium text-base-muted uppercase tracking-wide mb-2">Notas</p>
                  <p className="text-sm text-base-text whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}

              {client.followup_date && (
                <div className="mt-4 pt-4 border-t border-base-border">
                  <p className="text-xs font-medium text-base-muted uppercase tracking-wide mb-1">Fecha de seguimiento</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{formatDate(client.followup_date)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Interactions ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Add interaction form */}
          <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
            <h3 className="text-sm font-semibold text-base-text mb-4">Registrar interacción</h3>
            <form onSubmit={addInteraction} className="space-y-3">
              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {INTERACTION_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIntForm((p) => ({ ...p, type: value }))}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                      intForm.type === value
                        ? `${INT_COLORS[value].bg} ${INT_COLORS[value].text} border-current`
                        : "border-base-border text-base-muted hover:border-base-muted"
                    }`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <textarea
                    value={intForm.content}
                    onChange={(e) => setIntForm((p) => ({ ...p, content: e.target.value }))}
                    rows={2}
                    placeholder="Descripción de la interacción..."
                    className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition resize-none"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    type="date"
                    value={intForm.date}
                    onChange={(e) => setIntForm((p) => ({ ...p, date: e.target.value }))}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={savingInt}
                    className="flex items-center justify-center gap-2 bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    <Plus size={14} /> {savingInt ? "Guardando..." : "Registrar"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Interaction timeline */}
          <div className="bg-base-card border border-base-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-base-border">
              <h3 className="text-sm font-semibold text-base-text">
                Historial de interacciones
                <span className="ml-2 text-xs font-normal text-base-muted">({client.interactions.length})</span>
              </h3>
            </div>

            {client.interactions.length === 0 ? (
              <div className="text-center py-10 text-base-muted text-sm">
                Todavía no hay interacciones registradas.
              </div>
            ) : (
              <div className="divide-y divide-base-border">
                {client.interactions.map((interaction) => {
                  const meta = INTERACTION_TYPES.find((t) => t.value === interaction.type) || INTERACTION_TYPES[4];
                  const Icon = meta.icon;
                  const colors = INT_COLORS[interaction.type] || INT_COLORS.nota;
                  return (
                    <div key={interaction.id} className="flex items-start gap-3 px-5 py-4 hover:bg-base-subtle/40 transition">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${colors.bg}`}>
                        <Icon size={14} className={colors.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold capitalize ${colors.text}`}>{meta.label}</span>
                          <span className="text-[11px] text-base-muted flex-shrink-0">{formatDate(interaction.date)}</span>
                        </div>
                        {interaction.content && (
                          <p className="text-sm text-base-text mt-1 whitespace-pre-wrap">{interaction.content}</p>
                        )}
                      </div>
                      {confirmDeleteInt === interaction.id ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => deleteInteraction(interaction.id)} className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">
                            Eliminar
                          </button>
                          <button onClick={() => setConfirmDeleteInt(null)} className="text-[11px] px-2 py-1 rounded-lg border border-base-border text-base-muted hover:bg-base-subtle transition">
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteInt(interaction.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-base-muted hover:text-red-500 transition flex-shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-lg bg-base-subtle text-base-muted flex-shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-base-muted uppercase tracking-wide font-medium">{label}</p>
        <div className="text-sm text-base-text mt-0.5">{children}</div>
      </div>
    </div>
  );
}
