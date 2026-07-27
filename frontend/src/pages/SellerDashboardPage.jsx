import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookUser,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MessageCircle,
  Package,
  Plus,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";
import UsdtCard from "../components/UsdtCard";


export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/seller-dashboard/summary")
      .then(({ data }) => setSummary(data))
      .catch(() => setError("No se pudo cargar tu panel."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-base-muted">Cargando tu panel...</p>;
  if (!summary) return <p className="text-sm text-red-500">{error}</p>;

  const countDelta = summary.sales_this_month_count - summary.sales_last_month_count;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Header title={`Hola, ${firstName(summary.seller_name)}`} subtitle="Tu panel de ventas" />
        <button
          onClick={() => navigate("/scanner")}
          className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm"
        >
          <Plus size={15} /> Cargar una venta
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={ReceiptText}
          label="Ventas este mes"
          value={summary.sales_this_month_count}
          helper={`${countDelta >= 0 ? "+" : ""}${countDelta} vs. mes anterior`}
          tone="xylo"
        />
        <MetricCard
          icon={TrendingUp}
          label="Facturado este mes"
          value={`USD ${money(summary.sales_this_month_value_usd)}`}
          helper={`${summary.sales_today_count} venta${summary.sales_today_count === 1 ? "" : "s"} hoy`}
          tone="green"
        />
        <MetricCard
          icon={Users}
          label="Clientes activos"
          value={summary.active_clients_count}
          helper={`${summary.due_followups_count} para recontactar`}
          tone={summary.due_followups_count > 0 ? "amber" : "blue"}
        />
        <MetricCard
          icon={FileText}
          label="Presupuestos abiertos"
          value={summary.open_quotes_count}
          helper={`${summary.accepted_quotes_this_month_count} aceptados este mes`}
          tone="purple"
        />
      </div>

      {summary.due_followups_count > 0 && (
        <button
          onClick={() => navigate("/crm")}
          className="w-full flex items-center gap-3 text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3.5 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition"
        >
          <MessageCircle size={18} className="text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Tenés {summary.due_followups_count} recontacto{summary.due_followups_count === 1 ? "" : "s"} pendiente{summary.due_followups_count === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Abrí el CRM y contactá a esos clientes.</p>
          </div>
          <ArrowRight size={16} className="text-amber-600 dark:text-amber-400" />
        </button>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section
          icon={CalendarDays}
          title="Próximos turnos"
          actionLabel="Ver agenda"
          onAction={() => navigate("/agenda")}
        >
          {summary.upcoming_appointments.length === 0 ? (
            <EmptyState icon={CalendarDays} text="No tenés turnos en los próximos 7 días." />
          ) : (
            <div className="divide-y divide-base-border">
              {summary.upcoming_appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() => navigate("/agenda")}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-base-subtle/40 transition"
                >
                  <div className="w-10 text-center flex-shrink-0">
                    <p className="text-[10px] uppercase font-semibold text-xylo-500">{shortMonth(appointment.date)}</p>
                    <p className="text-lg font-bold text-base-text leading-none">{dayNumber(appointment.date)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-text truncate">{appointment.title}</p>
                    <p className="text-xs text-base-muted truncate">
                      {appointment.start_time}{appointment.client_name ? ` · ${appointment.client_name}` : ""}
                    </p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${appointment.status === "confirmed"
                    ? "bg-green-50 text-green-600"
                    : "bg-amber-50 text-amber-600"}`}
                  >
                    {appointment.status === "confirmed" ? "Confirmado" : "Pendiente"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>

        <Section
          icon={Clock}
          title="Tus ventas recientes"
          actionLabel="Ver ventas"
          onAction={() => navigate("/sales")}
        >
          {summary.recent_sales.length === 0 ? (
            <EmptyState icon={Package} text="Todavía no registraste ventas." />
          ) : (
            <div className="divide-y divide-base-border">
              {summary.recent_sales.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => navigate(`/sales/${sale.id}`)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-base-subtle/40 transition"
                >
                  <div className="p-2 rounded-xl bg-xylo-500/10 text-xylo-500">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-text truncate">{sale.model}</p>
                    <p className="text-xs text-base-muted truncate">{sale.client_name || "Sin cliente"} · {formatDate(sale.sale_date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-base-text">USD {money(sale.sale_price_usd)}</p>
                </button>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction icon={BookUser} label="Nuevo cliente" onClick={() => navigate("/crm")} />
        <QuickAction icon={CalendarDays} label="Agendar turno" onClick={() => navigate("/agenda")} />
        <QuickAction icon={FileText} label="Crear presupuesto" onClick={() => navigate("/presupuestos")} />
        <QuickAction icon={Package} label="Consultar stock" onClick={() => navigate("/products")} />
      </div>

      <UsdtCard />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    xylo: "bg-xylo-500/10 text-xylo-500",
    green: "bg-green-500/10 text-green-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    purple: "bg-purple-500/10 text-purple-500",
  };
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-4 md:p-5 shadow-card">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <p className="text-xs text-base-muted font-medium mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-base-text">{value}</p>
      <p className="text-[11px] text-base-muted mt-1.5">{helper}</p>
    </div>
  );
}

function Section({ icon: Icon, title, actionLabel, onAction, children }) {
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-base-subtle flex items-center justify-center text-base-muted">
          <Icon size={15} />
        </div>
        <h3 className="text-sm font-semibold text-base-text">{title}</h3>
        <button onClick={onAction} className="ml-auto text-xs font-medium text-xylo-500 hover:text-xylo-600">
          {actionLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="py-8 text-center">
      <Icon size={25} className="text-base-muted mx-auto mb-2 opacity-50" />
      <p className="text-sm text-base-muted">{text}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 bg-base-card border border-base-border rounded-2xl p-4 text-base-muted hover:text-xylo-500 hover:border-xylo-500/30 transition shadow-card"
    >
      <Icon size={19} />
      <span className="text-xs font-semibold text-center">{label}</span>
    </button>
  );
}

function firstName(name) {
  return name?.split(" ")[0] || "vendedor";
}

function money(value) {
  return Number(value || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function dateOnly(value) {
  return String(value).slice(0, 10);
}

function dayNumber(value) {
  return new Date(`${dateOnly(value)}T12:00:00`).getDate();
}

function shortMonth(value) {
  return new Date(`${dateOnly(value)}T12:00:00`).toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}
