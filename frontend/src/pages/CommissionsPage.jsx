import { createElement, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign, Users, ChevronDown, ChevronUp, Pencil, Trash2, Plus, X, WalletCards, Check } from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmt(val) {
  return Number(val || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

const emptyPayoutForm = (sellerId = "") => ({
  seller_id: sellerId ? String(sellerId) : "",
  amount_usd: "",
  paid_at: todayLocal(),
  notes: "",
});

export default function CommissionsPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [data, setData]   = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [sellerSales, setSellerSales] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [editingPayoutId, setEditingPayoutId] = useState(null);
  const [payoutForm, setPayoutForm] = useState(emptyPayoutForm);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [confirmDeletePayoutId, setConfirmDeletePayoutId] = useState(null);

  const [baseCommission, setBaseCommission] = useState(null);
  const [editingBaseCommission, setEditingBaseCommission] = useState(false);
  const [baseCommissionDraft, setBaseCommissionDraft] = useState("");
  const [baseCommissionSaving, setBaseCommissionSaving] = useState(false);
  const [baseCommissionSaved, setBaseCommissionSaved] = useState(false);
  const [baseCommissionError, setBaseCommissionError] = useState("");

  useEffect(() => {
    api.get("/settings/base-seller-commission")
      .then((res) => setBaseCommission(res.data.amount_usd))
      .catch(() => {});
  }, []);

  function openEditBaseCommission() {
    setBaseCommissionDraft(String(baseCommission ?? ""));
    setBaseCommissionError("");
    setBaseCommissionSaved(false);
    setEditingBaseCommission(true);
  }

  async function saveBaseCommission(event) {
    event.preventDefault();
    const amount = Number(baseCommissionDraft);
    if (!amount || amount <= 0) {
      setBaseCommissionError("Ingresá un monto válido mayor a 0.");
      return;
    }
    setBaseCommissionSaving(true);
    setBaseCommissionError("");
    try {
      const res = await api.put("/settings/base-seller-commission", { amount_usd: amount });
      setBaseCommission(res.data.amount_usd);
      setBaseCommissionSaved(true);
      window.setTimeout(() => {
        setEditingBaseCommission(false);
        setBaseCommissionSaved(false);
      }, 1200);
    } catch (error) {
      setBaseCommissionError(error?.response?.data?.detail || "No se pudo guardar el cambio.");
    } finally {
      setBaseCommissionSaving(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, usersRes, paymentsRes] = await Promise.all([
        api.get(`/users/commissions/summary?month=${month}&year=${year}`),
        api.get("/users/"),
        api.get(`/users/commissions/payments?month=${month}&year=${year}`),
      ]);
      setData(commRes.data);
      setUsers(usersRes.data);
      setPayments(paymentsRes.data);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    setExpandedId(null);
    setSellerSales({});
    load();
  }, [load]);

  async function toggleExpand(sellerId) {
    if (expandedId === sellerId) { setExpandedId(null); return; }
    setExpandedId(sellerId);
    if (!sellerSales[sellerId]) {
      const res = await api.get(`/sales/?seller_id=${sellerId}`).catch(() => ({ data: [] }));
      const filtered = res.data.filter((s) => {
        const d = new Date(s.sale_date);
        return Number(s.seller_id) === Number(sellerId)
          && d.getMonth() + 1 === month
          && d.getFullYear() === year
          && !s.is_returned;
      });
      setSellerSales((p) => ({ ...p, [sellerId]: filtered }));
    }
  }

  async function deleteSale(sellerId, saleId) {
    setDeleteError("");
    try {
      await api.delete(`/sales/${saleId}`);
      setSellerSales((current) => ({
        ...current,
        [sellerId]: (current[sellerId] || []).filter((sale) => sale.id !== saleId),
      }));
      setConfirmDeleteId(null);
      await load();
    } catch (error) {
      setDeleteError(error?.response?.data?.detail || "No se pudo eliminar la venta.");
    }
  }

  function openNewPayout(sellerId = "") {
    const firstSellerId = sellerId || data[0]?.seller_id || "";
    setEditingPayoutId(null);
    setPayoutForm(emptyPayoutForm(firstSellerId));
    setPayoutError("");
    setPayoutOpen(true);
  }

  function openEditPayout(payment) {
    setEditingPayoutId(payment.id);
    setPayoutForm({
      seller_id: String(payment.seller_id),
      amount_usd: String(payment.amount_usd),
      paid_at: payment.paid_at,
      notes: payment.notes || "",
    });
    setPayoutError("");
    setPayoutOpen(true);
  }

  async function savePayout(event) {
    event.preventDefault();
    const amount = Number(payoutForm.amount_usd);
    if (!payoutForm.seller_id) { setPayoutError("Seleccioná un vendedor."); return; }
    if (!amount || amount <= 0) { setPayoutError("Ingresá un monto mayor a cero."); return; }
    if (!payoutForm.paid_at) { setPayoutError("Seleccioná la fecha del pago."); return; }

    setSavingPayout(true);
    setPayoutError("");
    const payload = {
      amount_usd: amount,
      paid_at: payoutForm.paid_at,
      notes: payoutForm.notes || null,
    };
    try {
      if (editingPayoutId) {
        await api.put(`/users/commissions/payments/${editingPayoutId}`, payload);
      } else {
        await api.post("/users/commissions/payments", {
          ...payload,
          seller_id: Number(payoutForm.seller_id),
        });
      }
      setPayoutOpen(false);
      await load();
    } catch (error) {
      setPayoutError(error?.response?.data?.detail || "No se pudo guardar el pago.");
    } finally {
      setSavingPayout(false);
    }
  }

  async function deletePayout(paymentId) {
    setPayoutError("");
    try {
      await api.delete(`/users/commissions/payments/${paymentId}`);
      setConfirmDeletePayoutId(null);
      await load();
    } catch (error) {
      setPayoutError(error?.response?.data?.detail || "No se pudo eliminar el pago.");
    }
  }

  const totals = data.reduce((acc, row) => ({
    sales: acc.sales + row.sales_count,
    profit: acc.profit + Number(row.total_gross_profit_usd),
    commission: acc.commission + Number(row.total_commission_usd),
    paid: acc.paid + Number(row.paid_this_month_usd),
    pending: acc.pending + Number(row.pending_commission_usd),
  }), { sales: 0, profit: 0, commission: 0, paid: 0, pending: 0 });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const selectedPayoutSeller = data.find((row) => Number(row.seller_id) === Number(payoutForm.seller_id));
  const editingPayment = payments.find((payment) => payment.id === editingPayoutId);
  const availableToPay = Number(selectedPayoutSeller?.pending_commission_usd || 0)
    + Number(editingPayment?.amount_usd || 0);

  return (
    <div>
      <Header title="Ganancias de vendedores" subtitle="Comisiones generadas, pagos manuales e historial por vendedor" />

      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">{deleteError}</div>
      )}
      {payoutError && !payoutOpen && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">{payoutError}</div>
      )}

      {/* Comisión base configurable */}
      <div className="mb-6 bg-base-card border border-base-border rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-xylo-500/10 text-xylo-600">
            <DollarSign size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-base-text">Comisión base por venta</p>
            <p className="text-xs text-base-muted">Se aplica automáticamente cuando no se define una comisión puntual en la venta</p>
          </div>
        </div>

        {!editingBaseCommission ? (
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-base-text">
              {baseCommission === null ? "..." : `USD ${fmt(baseCommission)}`}
            </span>
            <button
              type="button"
              onClick={openEditBaseCommission}
              className="flex items-center gap-1.5 rounded-xl border border-base-border px-3 py-2 text-xs font-medium text-base-muted transition hover:bg-base-subtle"
            >
              <Pencil size={13} /> Editar
            </button>
          </div>
        ) : (
          <form onSubmit={saveBaseCommission} className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-base-muted">USD</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                value={baseCommissionDraft}
                onChange={(e) => setBaseCommissionDraft(e.target.value)}
                className="w-32 bg-base-subtle border border-base-border rounded-xl pl-11 pr-3 py-2 text-sm text-base-text outline-none focus:border-xylo-500"
              />
            </div>
            <button
              type="submit"
              disabled={baseCommissionSaving}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${baseCommissionSaved ? "bg-green-600 text-white" : "bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 text-white"}`}
            >
              {baseCommissionSaved ? <Check size={13} /> : baseCommissionSaving ? "..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditingBaseCommission(false)}
              className="text-base-muted hover:text-base-text"
            >
              <X size={16} />
            </button>
          </form>
        )}
        {baseCommissionError && (
          <p className="w-full text-xs text-red-500">{baseCommissionError}</p>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex gap-3 flex-wrap">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-base-card border border-base-border rounded-xl px-3 py-2 text-sm text-base-text outline-none"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-base-card border border-base-border rounded-xl px-3 py-2 text-sm text-base-text outline-none"
          >
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={() => openNewPayout()}
          className="inline-flex items-center gap-2 rounded-xl bg-xylo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-xylo-600 transition"
        >
          <Plus size={15} /> Registrar pago
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Ventas", value: totals.sales, suffix: "", icon: TrendingUp, color: "#3b82f6" },
          { label: "Ganancia bruta", value: `USD ${fmt(totals.profit)}`, suffix: "", icon: DollarSign, color: "#10b981" },
          { label: "Generado vendedores", value: `USD ${fmt(totals.commission)}`, suffix: "", icon: Users, color: "#f59e0b" },
          { label: "Pagado en el mes", value: `USD ${fmt(totals.paid)}`, suffix: "", icon: WalletCards, color: "#8b5cf6" },
          { label: "Pendiente total", value: `USD ${fmt(totals.pending)}`, suffix: "", icon: DollarSign, color: "#ef4444" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-base-card border border-base-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div style={{ background: `${color}18`, borderRadius: 8, padding: 6 }}>
                {createElement(icon, { size: 14, style: { color } })}
              </div>
              <span className="text-xs text-base-muted">{label}</span>
            </div>
            <p className="text-xl font-bold text-base-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-base-card border border-base-border rounded-2xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1.6fr_.7fr_.6fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-b border-base-border bg-base-subtle">
          {["Vendedor", "Regla", "Ventas", "Facturación", "Ganancia bruta", "Generado", "Pagado mes", "Pendiente"].map((h) => (
            <span key={h} className="text-xs font-semibold text-base-muted uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="px-5 py-8 text-sm text-base-muted">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="px-5 py-8 text-sm text-base-muted">Sin datos para este período.</div>
        ) : data.map((row) => {
          const user = userMap[row.seller_id];
          const isExpanded = expandedId === row.seller_id;
          const sales = sellerSales[row.seller_id] || [];

          return (
            <div key={row.seller_id} className="border-t border-base-border">
              {/* Row principal */}
              <div
                className="grid grid-cols-2 lg:grid-cols-[1.6fr_.7fr_.6fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 items-center hover:bg-base-subtle/50 cursor-pointer transition"
                onClick={() => toggleExpand(row.seller_id)}
              >
                {/* Vendedor */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-xylo-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-xylo-500">
                      {row.seller_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-text">{row.seller_name}</p>
                    <p className="text-xs text-base-muted capitalize">{user?.role || "seller"}</p>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-base-muted ml-2" /> : <ChevronDown size={14} className="text-base-muted ml-2" />}
                </div>

                <div>
                  <p className="text-sm font-semibold text-base-text">USD 10</p>
                  <p className="text-[10px] text-base-muted">por venta</p>
                </div>

                <span className="text-sm text-base-text">{row.sales_count}</span>
                <span className="text-sm text-base-text">USD {fmt(row.total_sales_usd)}</span>
                <span className="text-sm text-base-text">USD {fmt(row.total_gross_profit_usd)}</span>
                <span className="text-sm font-bold" style={{ color: Number(row.total_commission_usd) > 0 ? "#10b981" : undefined }}>
                  USD {fmt(row.total_commission_usd)}
                </span>
                <span className="text-sm font-semibold text-purple-500">USD {fmt(row.paid_this_month_usd)}</span>
                <span className="text-sm font-bold" style={{ color: Number(row.pending_commission_usd) > 0 ? "#ef4444" : "#10b981" }}>
                  USD {fmt(row.pending_commission_usd)}
                </span>
              </div>

              {/* Detalle de ventas */}
              {isExpanded && (
                <div className="px-5 pb-3 bg-base-subtle/30 border-t border-base-border">
                  {sales.length === 0 ? (
                    <p className="text-xs text-base-muted py-3">Sin ventas en este período.</p>
                  ) : (
                    <table className="w-full text-xs mt-2">
                      <thead>
                        <tr className="text-base-muted">
                          {["#", "Fecha", "Cliente", "Precio", "Ganancia bruta", "Ganancia vendedor", "Acciones"].map((h) => (
                            <th key={h} className="text-left py-1.5 pr-4 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((s) => (
                          <tr key={s.id} className="border-t border-base-border/40">
                            <td className="py-1.5 pr-4 text-base-muted">{s.id}</td>
                            <td className="py-1.5 pr-4">{new Date(s.sale_date).toLocaleDateString("es-AR")}</td>
                            <td className="py-1.5 pr-4">{s.client_name || "—"}</td>
                            <td className="py-1.5 pr-4">USD {fmt(s.sale_price_usd)}</td>
                            <td className="py-1.5 pr-4 text-green-500">USD {fmt(s.gross_profit_usd)}</td>
                            <td className="py-1.5 font-semibold" style={{ color: "#f59e0b" }}>
                              USD {fmt(s.commission_usd)}
                            </td>
                            <td className="py-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/sales/${s.id}/edit`)}
                                  className="p-1.5 rounded-lg text-base-muted hover:text-base-text hover:bg-base-subtle transition"
                                  aria-label={`Editar venta ${s.id}`}
                                >
                                  <Pencil size={12} />
                                </button>
                                {confirmDeleteId === s.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => deleteSale(row.seller_id, s.id)}
                                      className="text-[10px] font-semibold bg-red-500 text-white rounded-md px-2 py-1"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-[10px] text-base-muted rounded-md px-1.5 py-1"
                                    >
                                      No
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(s.id)}
                                    className="p-1.5 rounded-lg text-base-muted hover:text-red-500 hover:bg-red-50 transition"
                                    aria-label={`Eliminar venta ${s.id}`}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Historial de pagos */}
      <div className="mt-6 bg-base-card border border-base-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-base-border">
          <div>
            <h2 className="text-sm font-semibold text-base-text">Historial de pagos</h2>
            <p className="text-xs text-base-muted">{MONTHS[month - 1]} {year}</p>
          </div>
          <button
            type="button"
            onClick={() => openNewPayout()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-xylo-500 hover:text-xylo-600"
          >
            <Plus size={14} /> Nuevo pago
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <WalletCards size={22} className="mx-auto mb-2 text-base-muted opacity-50" />
            <p className="text-sm text-base-muted">No hay pagos registrados en este mes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead className="bg-base-subtle text-xs uppercase tracking-wide text-base-muted">
                <tr>
                  {['Fecha', 'Vendedor', 'Monto', 'Nota', 'Registrado por', 'Acciones'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-base-border">
                    <td className="px-5 py-3 text-base-text">{new Date(`${payment.paid_at}T00:00:00`).toLocaleDateString('es-AR')}</td>
                    <td className="px-5 py-3 font-medium text-base-text">{payment.seller_name}</td>
                    <td className="px-5 py-3 font-bold text-purple-500">USD {fmt(payment.amount_usd)}</td>
                    <td className="px-5 py-3 text-base-muted">{payment.notes || '—'}</td>
                    <td className="px-5 py-3 text-base-muted">{payment.created_by_name || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditPayout(payment)}
                          className="p-1.5 rounded-lg text-base-muted hover:text-base-text hover:bg-base-subtle transition"
                          aria-label={`Editar pago ${payment.id}`}
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmDeletePayoutId === payment.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => deletePayout(payment.id)}
                              className="text-[10px] font-semibold bg-red-500 text-white rounded-md px-2 py-1"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePayoutId(null)}
                              className="text-[10px] text-base-muted rounded-md px-1.5 py-1"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePayoutId(payment.id)}
                            className="p-1.5 rounded-lg text-base-muted hover:text-red-500 hover:bg-red-50 transition"
                            aria-label={`Eliminar pago ${payment.id}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setPayoutOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-base-border bg-base-card p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-base-text">{editingPayoutId ? 'Editar pago' : 'Registrar pago'}</h2>
                <p className="text-xs text-base-muted mt-1">Se descontará de la ganancia neta en la fecha indicada.</p>
              </div>
              <button type="button" onClick={() => setPayoutOpen(false)} className="p-1.5 rounded-lg text-base-muted hover:bg-base-subtle">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={savePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Vendedor</label>
                <select
                  value={payoutForm.seller_id}
                  disabled={Boolean(editingPayoutId)}
                  onChange={(event) => setPayoutForm((current) => ({ ...current, seller_id: event.target.value }))}
                  className="w-full rounded-xl border border-base-border bg-base-subtle px-3 py-2.5 text-sm text-base-text outline-none disabled:opacity-60"
                >
                  <option value="">Seleccionar vendedor</option>
                  {data.map((row) => <option key={row.seller_id} value={row.seller_id}>{row.seller_name}</option>)}
                </select>
                {selectedPayoutSeller && (
                  <p className="mt-1.5 text-[11px] text-base-muted">Saldo disponible: USD {fmt(availableToPay)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Monto USD</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={availableToPay > 0 ? availableToPay : undefined}
                    value={payoutForm.amount_usd}
                    onChange={(event) => setPayoutForm((current) => ({ ...current, amount_usd: event.target.value }))}
                    className="w-full rounded-xl border border-base-border bg-base-subtle px-3 py-2.5 text-sm text-base-text outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-base-muted mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={payoutForm.paid_at}
                    onChange={(event) => setPayoutForm((current) => ({ ...current, paid_at: event.target.value }))}
                    className="w-full rounded-xl border border-base-border bg-base-subtle px-3 py-2.5 text-sm text-base-text outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-base-muted mb-1.5">Nota <span className="opacity-50">opcional</span></label>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={payoutForm.notes}
                  onChange={(event) => setPayoutForm((current) => ({ ...current, notes: event.target.value }))}
                  className="w-full resize-none rounded-xl border border-base-border bg-base-subtle px-3 py-2.5 text-sm text-base-text outline-none"
                  placeholder="Ej: Pago de comisiones de la semana"
                />
              </div>

              {payoutError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{payoutError}</div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setPayoutOpen(false)} className="rounded-xl border border-base-border px-4 py-2 text-sm text-base-muted hover:bg-base-subtle">
                  Cancelar
                </button>
                <button type="submit" disabled={savingPayout} className="rounded-xl bg-xylo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-xylo-600 disabled:opacity-60">
                  {savingPayout ? 'Guardando...' : editingPayoutId ? 'Guardar cambios' : 'Registrar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
