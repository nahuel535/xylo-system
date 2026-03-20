import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import AuditHistory from "../components/AuditHistory";

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-base-muted">Cargando venta...</p>;
  if (!sale) return <p className="text-base-muted">Venta no encontrada.</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <Header
          title={`Venta #${sale.id}`}
          subtitle="Detalle completo de la operación"
        />
        <button
          onClick={() => navigate(`/sales/${id}/edit`)}
          className="bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm font-medium"
        >
          Editar
        </button>
      </div>

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