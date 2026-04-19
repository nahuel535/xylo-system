import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { useCriptoYa } from "../hooks/useCriptoYa";
import {
  DollarSign, Bitcoin, RefreshCw, CheckCircle,
  Edit3, Save, X, TrendingUp, TrendingDown, Clock
} from "lucide-react";

export default function ExchangePage() {
  const [rates, setRates] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({
    source_name: "",
    buy_rate_ars: "",
    sell_rate_ars: "",
    is_active: false,
    manual_override: false,
    manual_buy_rate_ars: "",
    manual_sell_rate_ars: "",
  });

  const { data: crypto, loading: cryptoLoading } = useCriptoYa();

  useEffect(() => {
    loadRates();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setMessage("");
    try {
      await api.post("/exchange-rates/sync");
      await loadRates();
      setMessage("Cotización sincronizada con dólar blue Córdoba.");
    } catch (e) {
      setMessage(e?.response?.data?.detail || "Error al sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  async function loadRates() {
    try {
      const [ratesRes, activeRes] = await Promise.all([
        api.get("/exchange-rates/"),
        api.get("/exchange-rates/active").catch(() => ({ data: null })),
      ]);
      setRates(ratesRes.data);
      setActive(activeRes.data);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/exchange-rates/", {
        ...newForm,
        buy_rate_ars: Number(newForm.buy_rate_ars),
        sell_rate_ars: Number(newForm.sell_rate_ars),
        manual_buy_rate_ars: newForm.manual_buy_rate_ars ? Number(newForm.manual_buy_rate_ars) : null,
        manual_sell_rate_ars: newForm.manual_sell_rate_ars ? Number(newForm.manual_sell_rate_ars) : null,
      });
      setShowNewForm(false);
      setNewForm({ source_name: "", buy_rate_ars: "", sell_rate_ars: "", is_active: false, manual_override: false, manual_buy_rate_ars: "", manual_sell_rate_ars: "" });
      await loadRates();
      setMessage("Cotización creada correctamente.");
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Error al crear cotización.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id) {
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/exchange-rates/${id}`, {
        ...editForm,
        buy_rate_ars: editForm.buy_rate_ars ? Number(editForm.buy_rate_ars) : undefined,
        sell_rate_ars: editForm.sell_rate_ars ? Number(editForm.sell_rate_ars) : undefined,
        manual_buy_rate_ars: editForm.manual_buy_rate_ars ? Number(editForm.manual_buy_rate_ars) : null,
        manual_sell_rate_ars: editForm.manual_sell_rate_ars ? Number(editForm.manual_sell_rate_ars) : null,
      });
      setEditingId(null);
      await loadRates();
      setMessage("Cotización actualizada.");
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Error al actualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(id) {
    try {
      await api.put(`/exchange-rates/${id}`, { is_active: true });
      await loadRates();
      setMessage("Cotización activada.");
    } catch {
      setMessage("Error al activar cotización.");
    }
  }

  function startEdit(rate) {
    setEditingId(rate.id);
    setEditForm({
      source_name: rate.source_name,
      buy_rate_ars: rate.buy_rate_ars,
      sell_rate_ars: rate.sell_rate_ars,
      manual_override: rate.manual_override,
      manual_buy_rate_ars: rate.manual_buy_rate_ars || "",
      manual_sell_rate_ars: rate.manual_sell_rate_ars || "",
    });
  }

  if (loading) return <p className="text-base-muted">Cargando cotizaciones...</p>;

  return (
    <div>
      <Header title="Cotización" subtitle="Gestión del tipo de cambio y precios de mercado" />

      {/* Cotización activa */}
      {active && (
        <div className="bg-gradient-to-r from-xylo-500/20 to-xylo-600/10 border border-xylo-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <CheckCircle size={16} className="text-xylo-400" />
            <p className="text-sm font-medium text-xylo-300">Cotización activa — {active.source_name}</p>
            <span className="text-xs bg-xylo-500/20 text-xylo-300 px-2 py-0.5 rounded-full">
              {active.mode === "manual" ? "Override manual" : "Automático"}
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="ml-auto flex items-center gap-1.5 bg-xylo-500/20 hover:bg-xylo-500/30 disabled:opacity-60 text-xylo-300 transition rounded-xl px-3 py-1.5 text-xs font-medium"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando…" : "Sincronizar ahora"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-base-muted mb-1">Dólar compra</p>
              <p className="text-2xl font-semibold text-green-400">
                ARS {fmt(active.buy_rate_ars)}
              </p>
            </div>
            <div>
              <p className="text-xs text-base-muted mb-1">Dólar venta</p>
              <p className="text-2xl font-semibold text-red-400">
                ARS {fmt(active.sell_rate_ars)}
              </p>
            </div>
            <div>
              <p className="text-xs text-base-muted mb-1">Spread</p>
              <p className="text-2xl font-semibold text-yellow-400">
                ARS {fmt(Number(active.sell_rate_ars) - Number(active.buy_rate_ars))}
              </p>
            </div>
            <div>
              <p className="text-xs text-base-muted mb-1">Actualizado</p>
              <div className="flex items-center gap-1 text-base-muted">
                <Clock size={13} />
                <p className="text-sm">{formatDate(active.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USDT / Crypto */}
      <div className="bg-base-card border border-base-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bitcoin size={16} className="text-yellow-400" />
          <p className="text-sm font-medium">USDT / ARS — Mercado crypto</p>
          {!cryptoLoading && crypto && (
            <span className="ml-auto text-xs text-base-muted bg-white/5 px-2 py-0.5 rounded-full">
              Promedio ARS {Math.round(crypto.avg).toLocaleString("es-AR")}
            </span>
          )}
        </div>

        {cryptoLoading ? (
          <p className="text-sm text-base-muted">Cargando precios crypto...</p>
        ) : !crypto ? (
          <p className="text-sm text-red-400">No se pudo obtener cotización USDT.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {crypto.exchanges.map((exchange) => (
              <div key={exchange.name} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium">{exchange.name}</span>
                <div className="flex gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-base-muted">Compra</p>
                    <p className="text-green-400 font-medium flex items-center gap-1">
                      <TrendingUp size={12} />
                      {exchange.bid.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-base-muted">Venta</p>
                    <p className="text-red-400 font-medium flex items-center gap-1">
                      <TrendingDown size={12} />
                      {exchange.ask.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Cotizaciones guardadas</p>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-400 transition text-white rounded-xl px-4 py-2 text-sm font-medium"
        >
          <DollarSign size={15} />
          Nueva cotización
        </button>
      </div>

      {message && (
        <div className="mb-4 text-sm text-xylo-300 bg-xylo-500/10 border border-xylo-500/20 rounded-xl px-4 py-3">
          {message}
        </div>
      )}

      {/* Formulario nueva cotización */}
      {showNewForm && (
        <div className="bg-base-card border border-base-border rounded-xl p-5 mb-4">
          <p className="text-sm font-medium mb-4">Nueva cotización</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              <InputField label="Nombre / Fuente" value={newForm.source_name} onChange={(v) => setNewForm((p) => ({ ...p, source_name: v }))} placeholder="Ej: Dólar blue Córdoba" required />
              <InputField label="Compra ARS" value={newForm.buy_rate_ars} onChange={(v) => setNewForm((p) => ({ ...p, buy_rate_ars: v }))} type="number" required />
              <InputField label="Venta ARS" value={newForm.sell_rate_ars} onChange={(v) => setNewForm((p) => ({ ...p, sell_rate_ars: v }))} type="number" required />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newForm.is_active} onChange={(e) => setNewForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                Activar como cotización principal
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newForm.manual_override} onChange={(e) => setNewForm((p) => ({ ...p, manual_override: e.target.checked }))} className="rounded" />
                Override manual
              </label>
            </div>
            {newForm.manual_override && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Override compra ARS" value={newForm.manual_buy_rate_ars} onChange={(v) => setNewForm((p) => ({ ...p, manual_buy_rate_ars: v }))} type="number" />
                <InputField label="Override venta ARS" value={newForm.manual_sell_rate_ars} onChange={(v) => setNewForm((p) => ({ ...p, manual_sell_rate_ars: v }))} type="number" />
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-xylo-500 hover:bg-xylo-400 disabled:opacity-60 transition text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
                <Save size={14} /> Guardar
              </button>
              <button type="button" onClick={() => setShowNewForm(false)} className="bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                <X size={14} /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de cotizaciones */}
      <div className="space-y-3">
        {rates.length === 0 ? (
          <p className="text-sm text-base-muted">No hay cotizaciones guardadas.</p>
        ) : (
          rates.map((rate) => (
            <div
              key={rate.id}
              className={`bg-base-card border rounded-xl p-5 transition ${
                rate.is_active ? "border-xylo-500/40" : "border-base-border"
              }`}
            >
              {editingId === rate.id ? (
                // Modo edición
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                    <InputField label="Nombre" value={editForm.source_name} onChange={(v) => setEditForm((p) => ({ ...p, source_name: v }))} />
                    <InputField label="Compra ARS" value={editForm.buy_rate_ars} onChange={(v) => setEditForm((p) => ({ ...p, buy_rate_ars: v }))} type="number" />
                    <InputField label="Venta ARS" value={editForm.sell_rate_ars} onChange={(v) => setEditForm((p) => ({ ...p, sell_rate_ars: v }))} type="number" />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={editForm.manual_override} onChange={(e) => setEditForm((p) => ({ ...p, manual_override: e.target.checked }))} />
                      Override manual
                    </label>
                  </div>
                  {editForm.manual_override && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <InputField label="Override compra" value={editForm.manual_buy_rate_ars} onChange={(v) => setEditForm((p) => ({ ...p, manual_buy_rate_ars: v }))} type="number" />
                      <InputField label="Override venta" value={editForm.manual_sell_rate_ars} onChange={(v) => setEditForm((p) => ({ ...p, manual_sell_rate_ars: v }))} type="number" />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => handleUpdate(rate.id)} disabled={saving} className="bg-xylo-500 hover:bg-xylo-400 disabled:opacity-60 transition text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
                      <Save size={14} /> Guardar
                    </button>
                    <button onClick={() => setEditingId(null)} className="bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo lectura
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{rate.source_name}</p>
                      {rate.is_active && (
                        <span className="text-xs bg-xylo-500/20 text-xylo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={10} /> Activa
                        </span>
                      )}
                      {rate.manual_override && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                          Override
                        </span>
                      )}
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-base-muted text-xs">Compra </span>
                        <span className="text-green-400 font-medium">ARS {fmt(rate.buy_rate_ars)}</span>
                      </div>
                      <div>
                        <span className="text-base-muted text-xs">Venta </span>
                        <span className="text-red-400 font-medium">ARS {fmt(rate.sell_rate_ars)}</span>
                      </div>
                      {rate.manual_override && rate.manual_sell_rate_ars && (
                        <div>
                          <span className="text-base-muted text-xs">Override venta </span>
                          <span className="text-yellow-400 font-medium">ARS {fmt(rate.manual_sell_rate_ars)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!rate.is_active && (
                      <button
                        onClick={() => handleActivate(rate.id)}
                        className="flex items-center gap-1.5 bg-xylo-500/10 hover:bg-xylo-500/20 text-xylo-300 transition rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <RefreshCw size={13} /> Activar
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(rate)}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 transition rounded-xl px-3 py-2 text-xs"
                    >
                      <Edit3 size={13} /> Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <div>
      <p className="text-xs text-base-muted mb-1.5">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-2.5 text-white outline-none text-sm"
      />
    </div>
  );
}

function fmt(value) {
  return Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}