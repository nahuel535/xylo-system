import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Bookmark, Boxes, CalendarClock, CheckCircle2,
  ChevronRight, Plus, ShieldCheck, Wrench, X,
} from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const inputClass =
  "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

const CLAIM_STATUS = {
  open: { label: "Abierto", className: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
  in_review: { label: "En revisión", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  resolved: { label: "Resuelto", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  rejected: { label: "Rechazado", className: "bg-base-subtle text-base-muted" },
};

export default function AfterSalesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [overview, setOverview] = useState(null);
  const [claims, setClaims] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showClaim, setShowClaim] = useState(false);
  const [claimForm, setClaimForm] = useState({ sale_id: "", client_phone: "", issue: "" });
  const [saving, setSaving] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [overviewRes, claimsRes, salesRes] = await Promise.all([
        api.get("/after-sales/overview?days=30"),
        api.get("/after-sales/claims"),
        api.get("/sales/"),
      ]);
      setOverview(overviewRes.data);
      setClaims(claimsRes.data);
      setSales(salesRes.data);
    } catch {
      setError("No se pudo cargar la información de posventa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saleOptions = useMemo(
    () => sales.map((sale) => ({
      ...sale,
      label: `Venta #${sale.id} · ${sale.client_name || "Sin cliente"}`,
    })),
    [sales],
  );

  async function createClaim(e) {
    e.preventDefault();
    if (!claimForm.sale_id || !claimForm.issue.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/after-sales/claims", {
        sale_id: Number(claimForm.sale_id),
        client_phone: claimForm.client_phone.trim() || null,
        issue: claimForm.issue.trim(),
      });
      setClaimForm({ sale_id: "", client_phone: "", issue: "" });
      setShowClaim(false);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "No se pudo registrar el reclamo.");
    } finally {
      setSaving(false);
    }
  }

  async function updateClaim(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/after-sales/claims/${editingClaim.id}`, {
        status: editingClaim.status,
        resolution: editingClaim.resolution?.trim() || null,
      });
      setEditingClaim(null);
      await load();
    } catch {
      setError("No se pudo actualizar el reclamo.");
    } finally {
      setSaving(false);
    }
  }

  async function releaseReservation(productId) {
    try {
      await api.post(`/products/${productId}/release`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "No se pudo liberar la reserva.");
    }
  }

  const cards = overview ? [
    {
      label: "Reservas vencidas",
      value: overview.overdue_reservations.length,
      icon: CalendarClock,
      tone: "text-red-500 bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Garantías a revisar",
      value: overview.warranties.length,
      icon: ShieldCheck,
      tone: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Reclamos abiertos",
      value: overview.open_claims_count,
      icon: Wrench,
      tone: "text-violet-500 bg-violet-50 dark:bg-violet-950/30",
    },
    ...(isAdmin ? [{
      label: "Stock bajo",
      value: overview.low_stock.length,
      icon: Boxes,
      tone: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    }] : []),
  ] : [];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <Header title="Posventa y alertas" subtitle="Reservas, garantías, reclamos y stock" />
        <button
          onClick={() => { setError(""); setShowClaim(true); }}
          className="mt-1 flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
        >
          <Plus size={15} /> <span className="hidden sm:inline">Nuevo reclamo</span>
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-base-muted">Cargando alertas...</p>
      ) : (
        <>
          <div className={`grid grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 mb-7`}>
            {cards.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-semibold text-base-text">{value}</p>
                <p className="text-xs text-base-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-7">
            <AlertSection
              title="Reservas"
              icon={Bookmark}
              empty="No hay reservas activas."
              items={[...overview.overdue_reservations, ...overview.active_reservations]}
              renderItem={(reservation) => {
                const overdue = new Date(reservation.reserved_until) < new Date();
                return (
                  <div key={reservation.product_id} className="flex items-start gap-3 p-3 rounded-xl bg-base-subtle border border-base-border">
                    <div className={`mt-0.5 ${overdue ? "text-red-500" : "text-xylo-500"}`}>
                      {overdue ? <AlertTriangle size={17} /> : <CalendarClock size={17} />}
                    </div>
                    <button onClick={() => navigate(`/products/${reservation.product_id}`)} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-base-text truncate">{reservation.model}</p>
                      <p className="text-xs text-base-muted truncate">{reservation.reserved_for}</p>
                      <p className={`text-[11px] mt-1 ${overdue ? "text-red-500 font-semibold" : "text-base-muted"}`}>
                        {overdue ? "Venció " : "Hasta "}{formatDate(reservation.reserved_until)}
                      </p>
                    </button>
                    <button
                      onClick={() => releaseReservation(reservation.product_id)}
                      className="text-[11px] font-semibold text-base-muted hover:text-red-500 transition"
                    >
                      Liberar
                    </button>
                  </div>
                );
              }}
            />

            <AlertSection
              title="Garantías"
              icon={ShieldCheck}
              empty="No hay garantías por vencer en los próximos 30 días."
              items={overview.warranties}
              renderItem={(warranty) => (
                <button
                  key={warranty.sale_id}
                  onClick={() => navigate(`/sales/${warranty.sale_id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-base-subtle border border-base-border text-left hover:border-xylo-500/40 transition"
                >
                  <ShieldCheck size={17} className={warranty.status === "expired" ? "text-red-500" : "text-amber-500"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-base-text truncate">{warranty.model}</p>
                    <p className="text-xs text-base-muted truncate">{warranty.client_name || "Sin cliente"}</p>
                  </div>
                  <span className={`text-[11px] font-semibold ${warranty.status === "expired" ? "text-red-500" : "text-amber-500"}`}>
                    {warranty.remaining_days < 0
                      ? `Venció hace ${Math.abs(warranty.remaining_days)} d.`
                      : `${warranty.remaining_days} d.`}
                  </span>
                  <ChevronRight size={14} className="text-base-muted" />
                </button>
              )}
            />
          </div>

          {isAdmin && overview.low_stock.length > 0 && (
            <section className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card mb-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Boxes size={17} className="text-blue-500" />
                  <h3 className="text-sm font-semibold text-base-text">Stock bajo de accesorios</h3>
                </div>
                <button onClick={() => navigate("/accessories")} className="text-xs font-semibold text-xylo-500">Ver accesorios</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {overview.low_stock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-base-subtle border border-base-border rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-base-text">{item.name}</p>
                      <p className="text-xs text-base-muted">{item.category}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-500">{item.quantity} / mín. {item.min_stock}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Wrench size={17} className="text-violet-500" />
              <h3 className="text-sm font-semibold text-base-text">Reclamos de posventa</h3>
            </div>
            {claims.length === 0 ? (
              <Empty text="Todavía no hay reclamos registrados." />
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => {
                  const status = CLAIM_STATUS[claim.status] || CLAIM_STATUS.open;
                  return (
                    <div key={claim.id} className="border border-base-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-base-text">{claim.model}</p>
                            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${status.className}`}>{status.label}</span>
                            {claim.under_warranty && (
                              <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">En garantía</span>
                            )}
                          </div>
                          <p className="text-xs text-base-muted mt-1">{claim.client_name || "Sin cliente"} · {claim.seller_name}</p>
                          <p className="text-sm text-base-text mt-2">{claim.issue}</p>
                          {claim.resolution && <p className="text-xs text-base-muted mt-2">Resolución: {claim.resolution}</p>}
                        </div>
                        {isAdmin && (
                          <button onClick={() => setEditingClaim({ ...claim, resolution: claim.resolution || "" })} className="text-xs font-semibold text-xylo-500">
                            Gestionar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {showClaim && (
        <Modal title="Nuevo reclamo" onClose={() => setShowClaim(false)}>
          <form onSubmit={createClaim} className="space-y-4">
            <Field label="Venta">
              <select required value={claimForm.sale_id} onChange={(e) => setClaimForm((p) => ({ ...p, sale_id: e.target.value }))} className={inputClass}>
                <option value="">Seleccionar venta</option>
                {saleOptions.map((sale) => <option key={sale.id} value={sale.id}>{sale.label}</option>)}
              </select>
            </Field>
            <Field label="Teléfono del cliente">
              <input value={claimForm.client_phone} onChange={(e) => setClaimForm((p) => ({ ...p, client_phone: e.target.value }))} placeholder="Opcional" className={inputClass} />
            </Field>
            <Field label="Problema informado">
              <textarea required rows={4} value={claimForm.issue} onChange={(e) => setClaimForm((p) => ({ ...p, issue: e.target.value }))} placeholder="Describí el reclamo..." className={inputClass} />
            </Field>
            <SubmitButtons saving={saving} onCancel={() => setShowClaim(false)} />
          </form>
        </Modal>
      )}

      {editingClaim && (
        <Modal title={`Gestionar reclamo #${editingClaim.id}`} onClose={() => setEditingClaim(null)}>
          <form onSubmit={updateClaim} className="space-y-4">
            <Field label="Estado">
              <select value={editingClaim.status} onChange={(e) => setEditingClaim((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
                {Object.entries(CLAIM_STATUS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
              </select>
            </Field>
            <Field label="Resolución">
              <textarea rows={4} value={editingClaim.resolution} onChange={(e) => setEditingClaim((p) => ({ ...p, resolution: e.target.value }))} placeholder="Trabajo realizado, cambio o decisión..." className={inputClass} />
            </Field>
            <SubmitButtons saving={saving} onCancel={() => setEditingClaim(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function AlertSection({ title, icon: Icon, items, empty, renderItem }) {
  return (
    <section className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={17} className="text-xylo-500" />
        <h3 className="text-sm font-semibold text-base-text">{title}</h3>
      </div>
      {items.length === 0 ? <Empty text={empty} /> : <div className="space-y-2">{items.map(renderItem)}</div>}
    </section>
  );
}

function Empty({ text }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-base-subtle border border-base-border px-4 py-4 text-xs text-base-muted">
      <CheckCircle2 size={15} className="text-emerald-500" /> {text}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
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

function formatDate(value) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
