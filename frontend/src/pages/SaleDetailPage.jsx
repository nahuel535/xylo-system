import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import AuditHistory from "../components/AuditHistory";
import { useAuth } from "../context/AuthContext";
import { RotateCcw, AlertTriangle } from "lucide-react";

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sale, setSale] = useState(null);
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnModal, setReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const saleRes = await api.get(`/sales/${id}`);
        const saleData = saleRes.data;
        setSale(saleData);

        const [productRes, usersRes] = await Promise.all([
          api.get(`/products/${saleData.product_id}`),
          api.get("/users/"),
        ]);

        setProduct(productRes.data);

        const sellerUser = usersRes.data.find(
          (u) => u.id === saleData.seller_id
        );
        setSeller(sellerUser || null);
      } catch (error) {
        console.error("Error cargando venta:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  async function handleReturn() {
    setReturning(true);
    try {
      const res = await api.post(`/sales/${id}/return`, { reason: returnReason });
      setSale(res.data);
      setReturnModal(false);
    } catch (e) {
      alert(e?.response?.data?.detail || "Error al registrar la devolución");
    } finally {
      setReturning(false);
    }
  }

  if (loading) return <p className="text-base-muted">Cargando venta...</p>;
  if (!sale) return <p className="text-base-muted">Venta no encontrada.</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <Header
          title={`Venta #${sale.id}`}
          subtitle={sale.is_returned ? "⚠ Esta venta fue devuelta" : "Detalle completo de la operación"}
        />
        <div className="flex gap-2">
          {user?.role === "admin" && !sale.is_returned && (
            <button
              onClick={() => setReturnModal(true)}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl px-4 py-2.5 text-sm font-medium transition"
            >
              <RotateCcw size={14} /> Devolución
            </button>
          )}
          {!sale.is_returned && (
            <button
              onClick={() => navigate(`/sales/${id}/edit`)}
              className="bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {sale.is_returned && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-600">Venta devuelta el {formatDate(sale.return_date)}</p>
            {sale.return_reason && <p className="text-sm text-red-500 mt-0.5">{sale.return_reason}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-base-card border border-base-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Producto</h3>

          {product && (
            <div className="space-y-2 text-sm">
              <p><b>Modelo:</b> {product.model}</p>
              <p><b>Capacidad:</b> {product.storage || "-"}</p>
              <p><b>Color:</b> {product.color || "-"}</p>
              <p><b>IMEI:</b> {product.imei}</p>
              <p><b>Batería:</b> {product.battery_health ? `${product.battery_health}%` : "-"}</p>
            </div>
          )}

          <div className="mt-4">
            <Link
              to={`/products/${product?.id}`}
              className="text-xylo-300 hover:underline text-sm"
            >
              Ver producto
            </Link>
          </div>
        </div>

        <div className="bg-base-card border border-base-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Venta</h3>

          <div className="space-y-2 text-sm">
            <p><b>Fecha:</b> {formatDate(sale.sale_date)}</p>
            <p><b>Cliente:</b> {sale.client_name || "-"}</p>
            <p><b>Vendedor:</b> {seller?.name || "-"}</p>
            <p><b>Precio venta:</b> USD {sale.sale_price_usd}</p>
            <p><b>Costo equipo:</b> USD {sale.purchase_price_usd_snapshot}</p>
            <p className="text-xylo-300 font-semibold">
              Ganancia: USD {sale.gross_profit_usd}
            </p>
            {sale.commission_usd != null && Number(sale.commission_usd) > 0 && (
              <p className="text-amber-500 font-semibold">
                Comisión vendedor: USD {sale.commission_usd}
              </p>
            )}
          </div>

          {sale.notes && (
            <div className="mt-4">
              <p className="text-sm text-base-muted mb-1">Notas</p>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-sm">
                {sale.notes}
              </div>
            </div>
          )}
        </div>

        <div className="bg-base-card border border-base-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Pagos</h3>

          {!sale.payments || sale.payments.length === 0 ? (
            <p className="text-sm text-base-muted">
              No hay pagos registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {sale.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white/5 border border-white/5 rounded-lg p-3 text-sm"
                >
                  <p><b>Método:</b> {payment.method}</p>
                  <p><b>Monto:</b> USD {payment.amount_usd}</p>
                  <p><b>Fecha:</b> {formatDate(payment.created_at)}</p>
                  {payment.reference && (
                    <p><b>Referencia:</b> {payment.reference}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <AuditHistory entityType="sale" entityId={id} />
      </div>

      <div className="mt-5">
        <Link
          to="/sales"
          className="bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-3 text-sm"
        >
          Volver a ventas
        </Link>
      </div>

      {/* Modal devolución */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <div className="bg-base-card border border-base-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <RotateCcw size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-base-text">Registrar devolución</h3>
                <p className="text-xs text-base-muted">El producto vuelve a stock automáticamente.</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-base-muted mb-1.5">Motivo (opcional)</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full bg-base-subtle border border-base-border rounded-xl px-3 py-2 text-sm text-base-text outline-none resize-none"
                rows={3}
                placeholder="Falla, cambio de opinión..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReturnModal(false)} className="flex-1 bg-base-subtle text-base-muted rounded-xl py-2.5 text-sm font-medium">Cancelar</button>
              <button onClick={handleReturn} disabled={returning} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition">
                {returning ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}