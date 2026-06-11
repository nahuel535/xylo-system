import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Clock, User,
  CheckCircle2, XCircle, AlertCircle, Circle, Trash2, Edit2, X,
} from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_META = {
  pending:   { label: "Pendiente",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  Icon: AlertCircle },
  confirmed: { label: "Confirmado", color: "#10b981", bg: "rgba(16,185,129,0.12)", Icon: CheckCircle2 },
  completed: { label: "Realizado",  color: "#6366f1", bg: "rgba(99,102,241,0.12)", Icon: CheckCircle2 },
  cancelled: { label: "Cancelado",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",  Icon: XCircle },
};

const TIMES = Array.from({ length: 28 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function toLocalISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ─── Modal formulario ────────────────────────────────────────────────────────

function AppointmentModal({ appt, defaultDate, clients, onClose, onSave }) {
  const { dark } = useTheme();
  const [form, setForm] = useState({
    title: appt?.title ?? "",
    client_id: appt?.client_id ?? "",
    description: appt?.description ?? "",
    date: appt?.date ?? defaultDate,
    start_time: appt?.start_time ?? "09:00",
    end_time: appt?.end_time ?? "10:00",
    status: appt?.status ?? "pending",
    notes: appt?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const bg = dark ? "#1c1c1e" : "#ffffff";
  const surfBg = dark ? "rgba(255,255,255,0.06)" : "#f6f6f4";
  const borderColor = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const textColor = dark ? "#f5f5f5" : "#0a0a0a";
  const mutedColor = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    if (!form.date) { setError("La fecha es obligatoria"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        client_id: form.client_id ? Number(form.client_id) : null,
        end_time: form.end_time || null,
        description: form.description || null,
        notes: form.notes || null,
      };
      if (appt?.id) {
        await api.patch(`/appointments/${appt.id}`, payload);
      } else {
        await api.post("/appointments", payload);
      }
      onSave();
    } catch {
      setError("Error al guardar el turno");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1px solid ${borderColor}`, background: surfBg,
    color: textColor, fontSize: 14, outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: mutedColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", padding: 16,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: bg, borderRadius: 20, width: "100%", maxWidth: 460,
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px", borderBottom: `1px solid ${borderColor}`,
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textColor }}>
            {appt?.id ? "Editar turno" : "Nuevo turno"}
          </h2>
          <button onClick={onClose} style={{
            background: surfBg, border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: mutedColor,
          }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Título */}
          <div>
            <label style={labelStyle}>Título *</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ej: Consulta iPhone 14"
              autoFocus
            />
          </div>

          {/* Fecha y hora */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input type="date" style={inputStyle} value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Desde</label>
              <select style={inputStyle} value={form.start_time} onChange={(e) => set("start_time", e.target.value)}>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Hasta</label>
              <select style={inputStyle} value={form.end_time} onChange={(e) => set("end_time", e.target.value)}>
                <option value="">—</option>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label style={labelStyle}>Cliente (opcional)</label>
            <select style={inputStyle} value={form.client_id} onChange={(e) => set("client_id", e.target.value)}>
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>Descripción</label>
            <input style={inputStyle} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Motivo del turno..." />
          </div>

          {/* Estado */}
          <div>
            <label style={labelStyle}>Estado</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(STATUS_META).map(([key, { label, color, bg: sBg }]) => (
                <button
                  key={key} type="button"
                  onClick={() => set("status", key)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: `2px solid ${form.status === key ? color : "transparent"}`,
                    background: form.status === key ? sBg : surfBg,
                    color: form.status === key ? color : mutedColor,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label style={labelStyle}>Notas internas</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 68 }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Observaciones, recordatorios..."
            />
          </div>

          {error && (
            <p style={{ margin: 0, color: "#ef4444", fontSize: 13 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              opacity: saving ? 0.7 : 1, transition: "opacity 0.15s",
            }}
          >
            {saving ? "Guardando..." : (appt?.id ? "Guardar cambios" : "Crear turno")}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Tarjeta de turno ─────────────────────────────────────────────────────────

function ApptCard({ appt, onEdit, onDelete, onStatusChange, dark }) {
  const meta = STATUS_META[appt.status] || STATUS_META.pending;
  const surfBg = dark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textColor = dark ? "#f5f5f5" : "#0a0a0a";
  const mutedColor = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

  const nextStatus = { pending: "confirmed", confirmed: "completed", completed: "pending", cancelled: "pending" };

  return (
    <div style={{
      background: surfBg, borderRadius: 14,
      border: `1px solid ${borderColor}`,
      padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 8,
      borderLeft: `3px solid ${meta.color}`,
    }}>
      {/* Row 1: hora + título + acciones */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          minWidth: 44, paddingTop: 2,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, lineHeight: 1 }}>
            {appt.start_time}
          </span>
          {appt.end_time && (
            <span style={{ fontSize: 11, color: mutedColor, lineHeight: 1, marginTop: 2 }}>
              {appt.end_time}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: textColor, lineHeight: 1.3 }}>
            {appt.title}
          </p>
          {appt.description && (
            <p style={{ margin: "3px 0 0", fontSize: 12, color: mutedColor, lineHeight: 1.4 }}>
              {appt.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(appt)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: mutedColor,
          }}>
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(appt.id)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: dark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ef4444",
          }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Row 2: cliente + estado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {appt.client ? (
            <>
              <User size={12} style={{ color: mutedColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: mutedColor }}>{appt.client.name}</span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: mutedColor }}>Sin cliente</span>
          )}
        </div>
        <button
          onClick={() => onStatusChange(appt.id, nextStatus[appt.status] || "pending")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20, border: "none", cursor: "pointer",
            background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 600,
            transition: "opacity 0.15s",
          }}
        >
          <meta.Icon size={11} />
          {meta.label}
        </button>
      </div>

      {appt.notes && (
        <p style={{
          margin: 0, fontSize: 11, color: mutedColor, fontStyle: "italic",
          borderTop: `1px solid ${borderColor}`, paddingTop: 6,
        }}>
          {appt.notes}
        </p>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { dark } = useTheme();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(toLocalISO(today));
  const [monthAppts, setMonthAppts] = useState([]);
  const [dayAppts, setDayAppts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [modal, setModal] = useState(null); // null | { appt?: Appointment }
  const [confirmDelete, setConfirmDelete] = useState(null);

  const bg = dark ? "#111113" : "#f2f2f7";
  const cardBg = dark ? "#1c1c1e" : "#ffffff";
  const borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textColor = dark ? "#f5f5f5" : "#0a0a0a";
  const mutedColor = dark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)";
  const surfBg = dark ? "rgba(255,255,255,0.05)" : "#f6f6f4";

  // Cargar turnos del mes
  const loadMonth = useCallback(async (y, m) => {
    try {
      const res = await api.get(`/appointments?month=${m + 1}&year=${y}`);
      setMonthAppts(res.data);
    } catch {}
  }, []);

  // Cargar turnos del día seleccionado
  const loadDay = useCallback(async (dateStr) => {
    setLoadingDay(true);
    try {
      const res = await api.get(`/appointments?date=${dateStr}`);
      setDayAppts(res.data);
    } catch {
      setDayAppts([]);
    } finally {
      setLoadingDay(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(currentYear, currentMonth);
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
  }, [currentYear, currentMonth, loadMonth]);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  function refresh() {
    loadMonth(currentYear, currentMonth);
    loadDay(selectedDate);
    setModal(null);
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11); }
    else setCurrentMonth((m) => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0); }
    else setCurrentMonth((m) => m + 1);
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/appointments/${id}`);
      refresh();
    } catch {}
    setConfirmDelete(null);
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await api.patch(`/appointments/${id}`, { status: newStatus });
      refresh();
    } catch {}
  }

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // map dateStr -> count and max-status for dot color
  const apptsByDate = {};
  for (const a of monthAppts) {
    if (!apptsByDate[a.date]) apptsByDate[a.date] = [];
    apptsByDate[a.date].push(a);
  }

  const todayStr = toLocalISO(today);

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: textColor, letterSpacing: "-0.03em" }}>
          Agenda
        </h1>
        <p style={{ margin: "4px 0 0", color: mutedColor, fontSize: 14 }}>
          Turnos y citas de la oficina
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 20, alignItems: "start" }}>

        {/* ── CALENDARIO ── */}
        <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
          {/* Nav mes */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${borderColor}`,
          }}>
            <button onClick={prevMonth} style={{
              background: surfBg, border: "none", borderRadius: 9,
              width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: mutedColor,
            }}>
              <ChevronLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textColor }}>
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} style={{
              background: surfBg, border: "none", borderRadius: 9,
              width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: mutedColor,
            }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "12px 12px 4px" }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: mutedColor, padding: "0 0 4px", letterSpacing: "0.04em" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 12px 16px", gap: 2 }}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const dayCounts = apptsByDate[dateStr] || [];
              const hasAppts = dayCounts.length > 0;

              // Dot colors: up to 3, by status priority
              const dots = dayCounts.slice(0, 3).map((a) => STATUS_META[a.status]?.color || "#6b7280");

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    position: "relative",
                    width: "100%", aspectRatio: "1",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    borderRadius: 11,
                    border: isToday && !isSelected ? `2px solid #10b981` : "2px solid transparent",
                    background: isSelected
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    padding: 0,
                    gap: 2,
                  }}
                >
                  <span style={{
                    fontSize: 14, fontWeight: isToday || isSelected ? 700 : 400, lineHeight: 1,
                    color: isSelected ? "#fff" : (isToday ? "#10b981" : textColor),
                  }}>
                    {day}
                  </span>
                  {hasAppts && (
                    <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                      {dots.map((c, idx) => (
                        <div key={idx} style={{
                          width: 4, height: 4, borderRadius: "50%",
                          background: isSelected ? "rgba(255,255,255,0.8)" : c,
                        }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", gap: 16, padding: "12px 20px",
            borderTop: `1px solid ${borderColor}`, flexWrap: "wrap",
          }}>
            {Object.entries(STATUS_META).map(([key, { label, color }]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 11, color: mutedColor }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── PANEL DÍA ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header día */}
          <div style={{
            background: cardBg, borderRadius: 20, border: `1px solid ${borderColor}`,
            padding: "16px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: mutedColor }}>
                {DAYS[parseLocalDate(selectedDate).getDay()]}
              </p>
              <h3 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: textColor, letterSpacing: "-0.02em" }}>
                {parseLocalDate(selectedDate).getDate()} de {MONTHS[parseLocalDate(selectedDate).getMonth()]}
                {selectedDate === todayStr && (
                  <span style={{
                    marginLeft: 8, fontSize: 11, fontWeight: 600, color: "#10b981",
                    background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: 20,
                  }}>Hoy</span>
                )}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: mutedColor }}>
                {dayAppts.length === 0 ? "Sin turnos" : `${dayAppts.length} turno${dayAppts.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={() => setModal({ appt: null })}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 16px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
              }}
            >
              <Plus size={15} />
              Nuevo turno
            </button>
          </div>

          {/* Lista turnos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loadingDay ? (
              <div style={{ textAlign: "center", padding: 40, color: mutedColor, fontSize: 14 }}>
                Cargando...
              </div>
            ) : dayAppts.length === 0 ? (
              <div style={{
                background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`,
                padding: "40px 24px", textAlign: "center",
              }}>
                <Clock size={32} style={{ color: mutedColor, marginBottom: 10 }} />
                <p style={{ margin: 0, color: mutedColor, fontSize: 14 }}>
                  No hay turnos para este día
                </p>
                <p style={{ margin: "4px 0 0", color: mutedColor, fontSize: 12 }}>
                  Hacé clic en "Nuevo turno" para agregar uno
                </p>
              </div>
            ) : (
              dayAppts.map((a) => (
                <ApptCard
                  key={a.id}
                  appt={a}
                  dark={dark}
                  onEdit={(appt) => setModal({ appt })}
                  onDelete={(id) => setConfirmDelete(id)}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL FORMULARIO ── */}
      {modal !== null && (
        <AppointmentModal
          appt={modal.appt}
          defaultDate={selectedDate}
          clients={clients}
          onClose={() => setModal(null)}
          onSave={refresh}
        />
      )}

      {/* ── CONFIRM DELETE ── */}
      {confirmDelete !== null && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 110,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", padding: 16,
        }}>
          <div style={{
            background: cardBg, borderRadius: 18, padding: "28px 28px 24px",
            maxWidth: 320, width: "100%", textAlign: "center",
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, background: "rgba(239,68,68,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            }}>
              <Trash2 size={22} color="#ef4444" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: textColor }}>
              Eliminar turno
            </h3>
            <p style={{ margin: "0 0 24px", color: mutedColor, fontSize: 14, lineHeight: 1.5 }}>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                  background: surfBg, color: textColor, fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                  background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
