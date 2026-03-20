import { useEffect, useState } from "react";
import api from "../services/api";

const ACTION_LABELS = {
  created: { label: "Creado", color: "bg-blue-500/10 text-blue-500" },
  updated: { label: "Editado", color: "bg-xylo-500/10 text-xylo-500" },
  sold:    { label: "Vendido", color: "bg-green-500/10 text-green-500" },
};

const FIELD_LABELS = {
  model: "Modelo", storage: "Capacidad", color: "Color", imei: "IMEI",
  serial_number: "N° de serie", battery_health: "Batería (%)",
  purchase_price_usd: "Costo USD", suggested_sale_price_usd: "Precio sugerido USD",
  cosmetic_condition: "Estado estético", functional_condition: "Estado funcional",
  notes: "Observaciones", status: "Estado", supplier: "Proveedor",
  sale_price_usd: "Precio de venta USD", seller_id: "Vendedor",
  client_name: "Cliente", has_trade_in: "Trade-in",
  has_deposit: "Seña", deposit_amount_usd: "Monto seña USD",
  remaining_balance_usd: "Saldo restante USD",
};

export default function AuditHistory({ entityType, entityId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/${entityType}s/${entityId}/history`);
        setLogs(res.data);
      } catch {
        // silencioso si no hay historial
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entityType, entityId]);

  if (loading) return null;
  if (logs.length === 0) return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <SectionTitle />
      <p className="text-sm text-base-muted mt-3">Sin historial registrado aún.</p>
    </div>
  );

  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <SectionTitle />
      <div className="mt-4 space-y-0">
        {logs.map((log, i) => {
          const { label, color } = ACTION_LABELS[log.action] || { label: log.action, color: "bg-base-subtle text-base-muted" };
          const hasChanges = log.changes && Object.keys(log.changes).length > 0;
          return (
            <div key={log.id} className="relative flex gap-4">
              {/* Timeline line */}
              {i < logs.length - 1 && (
                <div className="absolute left-3.5 top-7 bottom-0 w-px bg-base-border" />
              )}
              {/* Dot */}
              <div className="shrink-0 w-7 h-7 rounded-full bg-base-subtle border border-base-border flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-base-muted/60" />
              </div>
              {/* Content */}
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                  <span className="text-xs text-base-muted">por <span className="font-medium text-base-text">{log.user_name}</span></span>
                  <span className="text-xs text-base-muted ml-auto">{formatDate(log.created_at)}</span>
                </div>
                {hasChanges && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(log.changes).map(([field, { old: oldVal, new: newVal }]) => (
                      <div key={field} className="flex items-center gap-2 text-xs text-base-muted bg-base-subtle rounded-lg px-3 py-1.5">
                        <span className="font-medium text-base-text shrink-0">{FIELD_LABELS[field] || field}</span>
                        <span className="line-through opacity-50 truncate">{oldVal || "—"}</span>
                        <span className="text-base-muted opacity-40">→</span>
                        <span className="text-base-text font-medium truncate">{newVal || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 bg-base-subtle rounded-lg flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-base-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-base-text">Historial de cambios</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
