import { useState, useEffect, useCallback } from "react";
import { TrendingUp, DollarSign, Users, ChevronDown, ChevronUp } from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmt(val) {
  return Number(val || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CommissionsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [data, setData]   = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [sellerSales, setSellerSales] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, usersRes] = await Promise.all([
        api.get(`/users/commissions/summary?month=${month}&year=${year}`),
        api.get("/users/"),
      ]);
      setData(commRes.data);
      setUsers(usersRes.data);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  async function saveRate(userId) {
    setSaving(true);
    try {
      await api.patch(`/users/${userId}/commission-rate`, { commission_rate: parseFloat(editRate) });
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleExpand(sellerId) {
    if (expandedId === sellerId) { setExpandedId(null); return; }
    setExpandedId(sellerId);
    if (!sellerSales[sellerId]) {
      const res = await api.get(`/sales/?seller_id=${sellerId}`).catch(() => ({ data: [] }));
      const filtered = res.data.filter((s) => {
        const d = new Date(s.sale_date);
        return d.getMonth() + 1 === month && d.getFullYear() === year && !s.is_returned;
      });
      setSellerSales((p) => ({ ...p, [sellerId]: filtered }));
    }
  }

  const totals = data.reduce((acc, row) => ({
    sales: acc.sales + row.sales_count,
    profit: acc.profit + Number(row.total_gross_profit_usd),
    commission: acc.commission + Number(row.total_commission_usd),
  }), { sales: 0, profit: 0, commission: 0 });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return (
    <div>
      <Header title="Comisiones" subtitle="Desglose por vendedor" />

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
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

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Ventas", value: totals.sales, suffix: "", icon: TrendingUp, color: "#3b82f6" },
          { label: "Ganancia bruta", value: `USD ${fmt(totals.profit)}`, suffix: "", icon: DollarSign, color: "#10b981" },
          { label: "Total comisiones", value: `USD ${fmt(totals.commission)}`, suffix: "", icon: Users, color: "#f59e0b" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-base-card border border-base-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div style={{ background: `${color}18`, borderRadius: 8, padding: 6 }}>
                <Icon size={14} style={{ color }} />
              </div>
              <span className="text-xs text-base-muted">{label}</span>
            </div>
            <p className="text-xl font-bold text-base-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-base-card border border-base-border rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-5 py-3 border-b border-base-border bg-base-subtle">
          {["Vendedor", "% Comisión", "Ventas", "Facturación", "Ganancia bruta", "Comisión ganada"].map((h) => (
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
          const isEditing = editingId === row.seller_id;
          const sales = sellerSales[row.seller_id] || [];

          return (
            <div key={row.seller_id} className="border-t border-base-border">
              {/* Row principal */}
              <div
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-5 py-3.5 items-center hover:bg-base-subtle/50 cursor-pointer transition"
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

                {/* % comisión — editable */}
                <div onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min="0" max="100" step="0.5"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                        className="w-16 bg-base-subtle border border-base-border rounded-lg px-2 py-1 text-sm text-base-text outline-none"
                        autoFocus
                      />
                      <span className="text-xs text-base-muted">%</span>
                      <button onClick={() => saveRate(row.seller_id)} disabled={saving}
                        className="text-xs bg-xylo-500 text-white rounded-lg px-2 py-1 ml-1 font-medium">
                        {saving ? "..." : "OK"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-base-muted ml-1">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(row.seller_id); setEditRate(String(row.commission_rate)); }}
                      className="flex items-center gap-1 text-sm font-semibold text-base-text hover:text-xylo-500 transition"
                    >
                      {Number(row.commission_rate).toFixed(1)}%
                      <span className="text-[10px] text-base-muted">(editar)</span>
                    </button>
                  )}
                </div>

                <span className="text-sm text-base-text">{row.sales_count}</span>
                <span className="text-sm text-base-text">USD {fmt(row.total_sales_usd)}</span>
                <span className="text-sm text-base-text">USD {fmt(row.total_gross_profit_usd)}</span>
                <span className="text-sm font-bold" style={{ color: Number(row.total_commission_usd) > 0 ? "#10b981" : undefined }}>
                  USD {fmt(row.total_commission_usd)}
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
                          {["#", "Fecha", "Cliente", "Precio", "Ganancia", "Comisión"].map((h) => (
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
    </div>
  );
}
