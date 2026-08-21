import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Send, Search, User, CalendarPlus, X, Check, Link2 } from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function conversationLabel(conversation) {
  return conversation.client?.name || conversation.contact_name || conversation.wa_id;
}

export default function WhatsAppInboxPage() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({ title: "", date: "", start_time: "", notes: "" });
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [appointmentSaved, setAppointmentSaved] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");

  const bottomRef = useRef(null);

  async function loadConversations() {
    try {
      const response = await api.get("/whatsapp/conversations");
      setConversations(response.data);
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "No se pudieron cargar las conversaciones.");
    } finally {
      setLoadingConversations(false);
    }
  }

  useEffect(() => {
    loadConversations();
    const interval = window.setInterval(loadConversations, 8000);
    return () => window.clearInterval(interval);
  }, []);

  async function loadMessages(conversationId, { silent } = {}) {
    if (!silent) setLoadingMessages(true);
    try {
      const response = await api.get(`/whatsapp/conversations/${conversationId}/messages`);
      setMessages(response.data);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unread_count: 0 } : conversation
        )
      );
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "No se pudo cargar la conversación.");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (!selectedId) return undefined;
    loadMessages(selectedId);
    const interval = window.setInterval(() => loadMessages(selectedId, { silent: true }), 4000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return conversations;
    return conversations.filter((conversation) =>
      [conversationLabel(conversation), conversation.wa_id, conversation.last_message_preview]
        .some((field) => String(field || "").toLowerCase().includes(value))
    );
  }, [conversations, search]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) || null;

  function selectConversation(conversation) {
    setSelectedId(conversation.id);
    setShowAppointmentForm(false);
    setAppointmentSaved(false);
    setAppointmentError("");
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await api.post(`/whatsapp/conversations/${selectedId}/messages`, { body });
      setMessages((current) => [...current, response.data]);
      setDraft("");
      loadConversations();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  function openAppointmentForm() {
    if (!selectedConversation) return;
    const today = new Date().toISOString().slice(0, 10);
    setAppointmentForm({
      title: `Turno - ${conversationLabel(selectedConversation)}`,
      date: today,
      start_time: "10:00",
      notes: `Contacto por WhatsApp (${selectedConversation.wa_id})`,
    });
    setAppointmentSaved(false);
    setAppointmentError("");
    setShowAppointmentForm(true);
  }

  async function createAppointment(event) {
    event.preventDefault();
    if (!selectedConversation) return;
    setAppointmentSaving(true);
    setAppointmentError("");
    try {
      await api.post("/appointments", {
        title: appointmentForm.title,
        client_id: selectedConversation.client_id || null,
        contact_name: conversationLabel(selectedConversation),
        contact_phone: selectedConversation.wa_id,
        date: appointmentForm.date,
        start_time: appointmentForm.start_time,
        notes: appointmentForm.notes,
      });
      setAppointmentSaved(true);
      window.setTimeout(() => setShowAppointmentForm(false), 1500);
    } catch (requestError) {
      setAppointmentError(requestError?.response?.data?.detail || "No se pudo crear el turno.");
    } finally {
      setAppointmentSaving(false);
    }
  }

  return (
    <div>
      <Header title="Mensajes" subtitle="Inbox de WhatsApp del CRM" />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        <section className="bg-base-card border border-base-border rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-base-border">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar contacto o número..."
                className="w-full bg-base-subtle border border-base-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
              />
            </div>
          </div>

          <div className="divide-y divide-base-border max-h-[640px] overflow-y-auto">
            {loadingConversations ? (
              <p className="p-5 text-sm text-base-muted">Cargando conversaciones...</p>
            ) : filteredConversations.length === 0 ? (
              <p className="p-5 text-sm text-base-muted">Todavía no llegaron mensajes.</p>
            ) : filteredConversations.map((conversation) => {
              const active = conversation.id === selectedId;
              const unread = conversation.unread_count > 0;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation)}
                  className={`w-full text-left p-4 transition ${active ? "bg-xylo-50/60 dark:bg-xylo-950/20" : "hover:bg-base-subtle/50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm truncate ${unread ? "font-bold text-base-text" : "font-medium text-base-text"}`}>
                      {conversationLabel(conversation)}
                    </p>
                    <span className="text-[10px] text-base-muted whitespace-nowrap">{formatDay(conversation.last_message_at)}</span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${unread ? "text-base-text font-medium" : "text-base-muted"}`}>
                    {conversation.last_message_preview || "Sin mensajes"}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-base-muted">{conversation.wa_id}</span>
                    {unread && (
                      <span className="text-[10px] font-bold bg-green-500 text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none">
                        {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-base-card border border-base-border rounded-2xl shadow-card flex flex-col min-h-[520px]">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
              <Inbox size={28} className="text-base-muted mb-3" />
              <p className="text-sm font-medium text-base-text">Elegí una conversación</p>
              <p className="text-xs text-base-muted mt-1">Los mensajes de WhatsApp aparecen acá.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-base-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-base-text text-sm truncate">{conversationLabel(selectedConversation)}</p>
                  <p className="text-xs text-base-muted">{selectedConversation.wa_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.client_id ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/crm/${selectedConversation.client_id}`)}
                      className="flex items-center gap-1.5 rounded-xl border border-base-border px-3 py-2 text-xs font-medium text-base-muted transition hover:bg-base-subtle"
                    >
                      <User size={13} /> Ver cliente
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-3 py-2 text-xs font-medium">
                      <Link2 size={13} /> Sin vincular
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={openAppointmentForm}
                    className="flex items-center gap-1.5 rounded-xl bg-xylo-500 hover:bg-xylo-600 text-white px-3 py-2 text-xs font-semibold transition"
                  >
                    <CalendarPlus size={14} /> Crear turno
                  </button>
                </div>
              </div>

              {showAppointmentForm && (
                <form onSubmit={createAppointment} className="p-4 border-b border-base-border bg-base-subtle/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-base-muted">Turno rápido</p>
                    <button type="button" onClick={() => setShowAppointmentForm(false)} className="text-base-muted hover:text-base-text">
                      <X size={14} />
                    </button>
                  </div>
                  <input
                    value={appointmentForm.title}
                    onChange={(event) => setAppointmentForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Título del turno"
                    required
                    className="w-full bg-base-card border border-base-border rounded-lg px-3 py-2 text-sm text-base-text outline-none focus:border-xylo-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={appointmentForm.date}
                      onChange={(event) => setAppointmentForm((current) => ({ ...current, date: event.target.value }))}
                      required
                      className="w-full bg-base-card border border-base-border rounded-lg px-3 py-2 text-sm text-base-text outline-none focus:border-xylo-500"
                    />
                    <input
                      type="time"
                      value={appointmentForm.start_time}
                      onChange={(event) => setAppointmentForm((current) => ({ ...current, start_time: event.target.value }))}
                      required
                      className="w-full bg-base-card border border-base-border rounded-lg px-3 py-2 text-sm text-base-text outline-none focus:border-xylo-500"
                    />
                  </div>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(event) => setAppointmentForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={2}
                    className="w-full bg-base-card border border-base-border rounded-lg px-3 py-2 text-sm text-base-text outline-none resize-y focus:border-xylo-500"
                  />
                  {appointmentError && <p className="text-xs text-red-500">{appointmentError}</p>}
                  <button
                    type="submit"
                    disabled={appointmentSaving}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${appointmentSaved ? "bg-green-600 text-white" : "bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 text-white"}`}
                  >
                    {appointmentSaved ? <><Check size={13} /> Turno creado</> : appointmentSaving ? "Guardando..." : "Guardar turno"}
                  </button>
                </form>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#efeae2] dark:bg-[#111b21]">
                {loadingMessages ? (
                  <p className="text-sm text-base-muted text-center py-10">Cargando mensajes...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-base-muted text-center py-10">Todavía no hay mensajes en esta conversación.</p>
                ) : messages.map((message) => (
                  <div key={message.id} className={`flex ${message.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      message.direction === "out"
                        ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-sm"
                        : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-sm"
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{message.body || `[${message.message_type}]`}</p>
                      <p className="text-[10px] text-base-muted mt-1 text-right">
                        {formatTime(message.created_at)}
                        {message.direction === "out" && message.status ? ` · ${message.status}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="p-3 border-t border-base-border flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Escribí un mensaje..."
                  className="flex-1 bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-sm text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-xylo-500 hover:bg-xylo-600 disabled:opacity-50 text-white px-4 py-2.5 text-sm font-semibold transition"
                >
                  <Send size={15} /> {sending ? "..." : "Enviar"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
