import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import UsdtCard from "../components/UsdtCard";
import { Package, TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart2, CreditCard, Minus, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function DashboardPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [topModels, setTopModels] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState("profit");

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  function prevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [summaryRes, exchangeRes, topModelsRes, paymentRes, monthlyRes, recentRes] = await Promise.all([
          api.get(`/dashboard/summary?year=${selectedYear}&month=${selectedMonth}`),
          api.get("/exchange-rates/active"),
          api.get("/dashboard/top-models"),
          api.get("/dashboard/payment-methods"),
          api.get("/dashboard/monthly-stats"),
          api.get("/dashboard/recent-sales"),
        ]);
        setSummary(summaryRes.data);
        setExchange(exchangeRes.data);
        setTopModels(topModelsRes.data);
        setPaymentMethods(paymentRes.data);
        setMonthlyStats(monthlyRes.data.slice(-6));
        setRecentSales(recentRes.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [selectedYear, selectedMonth]);

  if (loading) return <p className="text-base-muted">Cargando dashboard...</p>;
  if (!summary) return <p className="text-base-muted">No se pudo cargar el dashboard.</p>;

  // Deltas mes vs mes anterior
  const deltaRevenue = delta(summary.sales_this_month_value_usd, summary.sales_last_month_value_usd);
  const deltaProfit = delta(summary.profit_this_month_usd, summary.profit_last_month_usd);
  const deltaSales = delta(summary.sales_this_month_count, summary.sales_last_month_count);

  // Margen este mes
  const margin = summary.sales_this_month_value_usd > 0
    ? ((summary.profit_this_month_usd / summary.sales_this_month_value_usd) * 100).toFixed(1)
    : "0.0";

  const maxSales = topModels[0]?.sales_count || 1;
  const maxPayment = paymentMethods[0]?.total_usd || 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Header title="Dashboard" subtitle="Resumen general del negocio" />
        <div className="flex items-center gap-2 bg-base-card border border-base-border rounded-xl px-3 py-2 shadow-card">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-base-subtle transition text-base-muted hover:text-base-text">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold text-base-text min-w-[120px] text-center">
            {MONTHS_ES[selectedMonth - 1]} {selectedYear}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className={`p-1 rounded-lg transition ${isCurrentMonth ? "text-base-border cursor-default" : "hover:bg-base-subtle text-base-muted hover:text-base-text"}`}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── KPI cards principales ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={`Ventas — ${MONTHS_ES[selectedMonth - 1]}`}
          value={`USD ${fmt(summary.sales_this_month_value_usd)}`}
          sub={`${summary.sales_this_month_count} operaciones`}
          delta={deltaRevenue}
          deltaLabel="vs mes anterior"
          icon={<ShoppingBag size={16} />}
          accent="xylo"
        />
        <KpiCard
          label={`Ganancia — ${MONTHS_ES[selectedMonth - 1]}`}
          value={`USD ${fmt(summary.profit_this_month_usd)}`}
          sub={`Margen ${margin}%`}
          delta={deltaProfit}
          deltaLabel="vs mes anterior"
          icon={<TrendingUp size={16} />}
          accent="green"
        />
        <KpiCard
          label="Stock en inventario"
          value={`USD ${fmt(summary.total_stock_value_usd)}`}
          sub={`${summary.total_products_in_stock} unidades en stock`}
          icon={<Package size={16} />}
          accent="blue"
        />
        <KpiCard
          label="Ganancia acumulada"
          value={`USD ${fmt(summary.total_gross_profit_usd)}`}
          sub={`${summary.total_sales_count} ventas totales`}
          icon={<DollarSign size={16} />}
          accent="purple"
        />
      </div>

      {/* ── Comparativa mes actual vs anterior ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CompareCard
          label="Facturación"
          current={summary.sales_this_month_value_usd}
          previous={summary.sales_last_month_value_usd}
          prefix="USD"
        />
        <CompareCard
          label="Ganancia bruta"
          current={summary.profit_this_month_usd}
          previous={summary.profit_last_month_usd}
          prefix="USD"
          accent
        />
        <CompareCard
          label="Operaciones"
          current={summary.sales_this_month_count}
          previous={summary.sales_last_month_count}
          integer
        />
      </div>

      {/* ── Chart + Ventas recientes ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {monthlyStats.length > 0 && (
          <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-base-subtle rounded-lg flex items-center justify-center">
                  <BarChart2 size={14} className="text-base-muted" />
                </div>
                <p className="text-sm font-semibold text-base-text">Evolución mensual</p>
              </div>
              <div className="flex gap-1 bg-base-subtle rounded-xl p-1">
                <button
                  onClick={() => setChartView("profit")}
                  className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${chartView === "profit" ? "bg-base-card text-base-text shadow-sm" : "text-base-muted hover:text-base-text"}`}
                >
                  Costo vs Ganancia
                </button>
                <button
                  onClick={() => setChartView("revenue")}
                  className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${chartView === "revenue" ? "bg-base-card text-base-text shadow-sm" : "text-base-muted hover:text-base-text"}`}
                >
                  Facturación
                </button>
              </div>
            </div>

            <MonthlyChart data={monthlyStats} view={chartView} />

            <div className="flex gap-5 mt-3 justify-center">
              {chartView === "profit" ? (
                <>
                  <LegendDot color="bg-red-400" label="Costo" />
                  <LegendDot color="bg-xylo-500" label="Ganancia" />
                </>
              ) : (
                <LegendDot color="bg-xylo-500" label="Facturación" />
              )}
            </div>
          </div>
        )}

        {/* Ventas recientes */}
        <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <SectionHeader icon={<Clock size={14} />} title="Ventas recientes" />
          {recentSales.length === 0 ? (
            <p className="text-sm text-base-muted mt-4">Sin ventas aún.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2.5 border-b border-base-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-base-text truncate">{sale.model}</p>
                    <p className="text-xs text-base-muted">{sale.client_name || "Sin cliente"} · {fmtDate(sale.sale_date)}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-semibold text-base-text">USD {fmt(sale.sale_price_usd)}</p>
                    <p className="text-xs text-green-500">+{fmt(sale.gross_profit_usd)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modelos + Métodos de pago ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <SectionHeader icon={<BarChart2 size={14} />} title="Modelos más vendidos" />
          {topModels.length === 0 ? (
            <p className="text-sm text-base-muted">Sin datos aún.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {topModels.slice(0, 6).map((model, i) => (
                <div key={model.model}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-base-muted w-4">{i + 1}</span>
                      <span className="text-sm text-base-text font-medium">{model.model}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-base-muted">USD {fmt(model.total_sales_usd)}</span>
                      <span className="text-xs font-semibold text-xylo-500">{model.sales_count} uds</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-base-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-xylo-500 rounded-full transition-all duration-700"
                      style={{ width: `${(model.sales_count / maxSales) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
          <SectionHeader icon={<CreditCard size={14} />} title="Métodos de pago" />
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-base-muted">Sin datos aún.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {paymentMethods.map((method) => (
                <div key={method.method}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-base-text capitalize">{method.method}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-base-muted">{method.count} pagos</span>
                      <span className="text-xs font-semibold text-green-500">USD {fmt(method.total_usd)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-base-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${(method.total_usd / maxPayment) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UsdtCard />
    </div>
  );
}

// ── Chart SVG ──────────────────────────────────────────
function MonthlyChart({ data, view }) {
  const [tooltip, setTooltip] = useState(null);

  const W = 600;
  const H = 180;
  const PAD = { top: 12, right: 16, bottom: 32, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const n = data.length;
  const barGroupW = chartW / n;
  const barW = view === "profit" ? barGroupW * 0.3 : barGroupW * 0.45;
  const gap = view === "profit" ? barGroupW * 0.06 : 0;

  const maxVal = Math.max(
    ...data.map((d) => view === "profit" ? Math.max(d.cost_usd, d.profit_usd) : d.revenue_usd),
    1
  );

  const yTicks = 4;
  const tickStep = niceStep(maxVal / yTicks);

  function barH(val) {
    return (val / (tickStep * yTicks)) * chartH;
  }

  function x(i) {
    return PAD.left + i * barGroupW + (barGroupW - (view === "profit" ? barW * 2 + gap : barW)) / 2;
  }

  // Tooltip dimensions
  const TW = 148;
  const TH = view === "profit" ? 60 : 44;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
      {/* Y gridlines */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = i * tickStep;
        const y = PAD.top + chartH - (val / (tickStep * yTicks)) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="currentColor" strokeOpacity={0.07} strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end"
              fontSize={9} fill="currentColor" opacity={0.4}>
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bx = x(i);
        const hovered = tooltip?.i === i;
        if (view === "profit") {
          const hCost = Math.max(barH(d.cost_usd), 2);
          const hProfit = Math.max(barH(d.profit_usd), 2);
          return (
            <g key={i}>
              <rect
                x={bx} y={PAD.top + chartH - hCost}
                width={barW} height={hCost}
                rx={3} fill="#f87171" opacity={hovered ? 1 : 0.85}
              />
              <rect
                x={bx + barW + gap} y={PAD.top + chartH - hProfit}
                width={barW} height={hProfit}
                rx={3} fill="var(--color-xylo-500, #7c3aed)" opacity={hovered ? 1 : 0.9}
              />
              <text x={bx + barW + gap / 2} y={H - PAD.bottom + 14}
                textAnchor="middle" fontSize={9} fill="currentColor" opacity={hovered ? 0.9 : 0.5}>
                {d.label}
              </text>
            </g>
          );
        } else {
          const hRev = Math.max(barH(d.revenue_usd), 2);
          return (
            <g key={i}>
              <rect
                x={bx} y={PAD.top + chartH - hRev}
                width={barW} height={hRev}
                rx={3} fill="var(--color-xylo-500, #7c3aed)" opacity={hovered ? 1 : 0.9}
              />
              <text x={bx + barW / 2} y={H - PAD.bottom + 14}
                textAnchor="middle" fontSize={9} fill="currentColor" opacity={hovered ? 0.9 : 0.5}>
                {d.label}
              </text>
            </g>
          );
        }
      })}

      {/* Invisible hitboxes for hover */}
      {data.map((d, i) => {
        const cx = PAD.left + i * barGroupW + barGroupW / 2;
        return (
          <rect
            key={`hit-${i}`}
            x={PAD.left + i * barGroupW}
            y={PAD.top}
            width={barGroupW}
            height={chartH}
            fill="transparent"
            style={{ cursor: "crosshair" }}
            onMouseEnter={() => setTooltip({ i, d, cx })}
            onMouseLeave={() => setTooltip(null)}
          />
        );
      })}

      {/* Tooltip */}
      {tooltip && (() => {
        const tx = Math.min(Math.max(tooltip.cx - TW / 2, PAD.left), W - PAD.right - TW);
        const ty = PAD.top + 2;
        const d = tooltip.d;
        return (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={tx} y={ty} width={TW} height={TH}
              rx={7} fill="white"
              stroke="rgba(0,0,0,0.09)" strokeWidth={1}
              filter="drop-shadow(0 2px 10px rgba(0,0,0,0.13))"
            />
            {/* Month label */}
            <text x={tx + TW / 2} y={ty + 15} textAnchor="middle"
              fontSize={9} fontWeight="600" fill="#0a0a0a">
              {d.label}
            </text>
            {view === "profit" ? (
              <>
                <text x={tx + 12} y={ty + 31} fontSize={9} fill="#f87171">
                  ● Costo
                </text>
                <text x={tx + TW - 12} y={ty + 31} textAnchor="end" fontSize={9} fontWeight="600" fill="#f87171">
                  USD {fmt(d.cost_usd)}
                </text>
                <text x={tx + 12} y={ty + 47} fontSize={9} fill="var(--color-xylo-500, #7c3aed)">
                  ● Ganancia
                </text>
                <text x={tx + TW - 12} y={ty + 47} textAnchor="end" fontSize={9} fontWeight="600" fill="var(--color-xylo-500, #7c3aed)">
                  USD {fmt(d.profit_usd)}
                </text>
              </>
            ) : (
              <>
                <text x={tx + 12} y={ty + 31} fontSize={9} fill="var(--color-xylo-500, #7c3aed)">
                  ● Facturación
                </text>
                <text x={tx + TW - 12} y={ty + 31} textAnchor="end" fontSize={9} fontWeight="600" fill="var(--color-xylo-500, #7c3aed)">
                  USD {fmt(d.revenue_usd)}
                </text>
              </>
            )}
          </g>
        );
      })()}
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────
function KpiCard({ label, value, sub, delta: d, deltaLabel, icon, accent }) {
  const accents = {
    xylo: { bg: "bg-xylo-500/10", text: "text-xylo-500" },
    green: { bg: "bg-green-500/10", text: "text-green-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
  };
  const { bg, text } = accents[accent] || accents.xylo;

  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <div className={`inline-flex p-2 rounded-xl ${bg} ${text} mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-base-text mb-0.5">{value}</p>
      <p className="text-xs text-base-muted mb-2">{label}</p>
      {sub && <p className="text-xs text-base-muted opacity-60">{sub}</p>}
      {d !== undefined && (
        <DeltaBadge delta={d} label={deltaLabel} />
      )}
    </div>
  );
}

function CompareCard({ label, current, previous, prefix = "", integer = false, accent = false }) {
  const d = delta(current, previous);
  const fmt2 = (v) => integer ? Number(v).toLocaleString("es-AR") : `${prefix} ${fmt(v)}`;

  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <p className="text-xs text-base-muted mb-3 font-medium">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-xl font-bold ${accent ? "text-xylo-500" : "text-base-text"}`}>{fmt2(current)}</p>
          <p className="text-xs text-base-muted mt-0.5">Este mes</p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-base-muted">{fmt2(previous)}</p>
          <p className="text-xs text-base-muted mt-0.5">Mes anterior</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-base-border">
        <DeltaBadge delta={d} label="variación" />
      </div>
    </div>
  );
}

function DeltaBadge({ delta: d, label }) {
  if (d === null) return null;
  const positive = d >= 0;
  const zero = d === 0;
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
      zero ? "bg-base-subtle text-base-muted" :
      positive ? "bg-green-500/10 text-green-500" : "bg-red-400/10 text-red-400"
    }`}>
      {zero ? <Minus size={11} /> : positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {zero ? "Sin cambio" : `${positive ? "+" : ""}${d.toFixed(1)}% ${label}`}
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 bg-base-subtle rounded-lg flex items-center justify-center text-base-muted">
        {icon}
      </div>
      <p className="text-sm font-semibold text-base-text">{title}</p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-base-muted">{label}</span>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────
function fmt(value) {
  return Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function delta(current, previous) {
  const c = Number(current);
  const p = Number(previous);
  if (p === 0) return c === 0 ? 0 : null;
  return ((c - p) / p) * 100;
}

function niceStep(rawStep) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / magnitude;
  if (norm <= 1) return magnitude;
  if (norm <= 2) return 2 * magnitude;
  if (norm <= 5) return 5 * magnitude;
  return 10 * magnitude;
}
