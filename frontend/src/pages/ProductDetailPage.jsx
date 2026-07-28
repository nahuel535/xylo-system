import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import AuditHistory from "../components/AuditHistory";
import { Bookmark, CalendarClock, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [product, setProduct] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    client_name: "",
    reserved_until: "",
    notes: "",
  });
  const [reservationError, setReservationError] = useState("");
  const [reservationSaving, setReservationSaving] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const [productRes, exchangeRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/exchange-rates/active").catch(() => ({ data: null })),
        ]);
        setProduct(productRes.data);
        setExchange(exchangeRes.data);
      } catch (error) {
        console.error("Error cargando producto:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      navigate("/sold-products");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      setDeleting(false);
    }
  }

  async function reserveProduct(event) {
    event.preventDefault();
    setReservationSaving(true);
    setReservationError("");
    try {
      const { data } = await api.post(`/products/${id}/reserve`, {
        client_name: reservationForm.client_name,
        reserved_until: new Date(reservationForm.reserved_until).toISOString(),
        notes: reservationForm.notes || null,
      });
      setProduct(data);
      setShowReservation(false);
      setReservationForm({ client_name: "", reserved_until: "", notes: "" });
    } catch (error) {
      setReservationError(error?.response?.data?.detail || "No se pudo reservar el producto.");
    } finally {
      setReservationSaving(false);
    }
  }

  async function releaseReservation() {
    setReservationSaving(true);
    setReservationError("");
    try {
      const { data } = await api.post(`/products/${id}/release`);
      setProduct(data);
    } catch (error) {
      setReservationError(error?.response?.data?.detail || "No se pudo liberar la reserva.");
    } finally {
      setReservationSaving(false);
    }
  }

  if (loading) return <p className="text-base-muted">Cargando producto...</p>;
  if (!product) return <p className="text-base-muted">Producto no encontrado.</p>;

  return (
    <div>
      <Header
        title={product.model}
        subtitle={`Detalle del equipo #${product.id}`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Info del producto */}
        <div className="xl:col-span-2 bg-base-card border border-base-border rounded-2xl p-6 shadow-card">
          {product.photo_url && (
            <img
              src={product.photo_url}
              alt={product.model}
              className="w-full h-48 object-cover rounded-xl mb-6"
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Info label="Modelo" value={product.model} />
            <Info label="Capacidad" value={product.storage} />
            <Info label="Color" value={product.color} />
            <Info label="IMEI" value={product.imei} mono />
            <Info label="Batería" value={product.battery_health ? `${product.battery_health}%` : "-"} />
            <Info label="Estado" value={product.status} />
            {product.status === "reserved" && <Info label="Reservado para" value={product.reserved_for} />}
            {product.status === "reserved" && <Info label="Reserva hasta" value={formatDateTime(product.reserved_until)} />}
            <Info label="Estado estético" value={product.cosmetic_condition} />
            <Info label="Estado funcional" value={product.functional_condition} />
            <Info label="Tipo SIM" value={product.sim_type} />
            <Info label="Condición" value={product.condition_type} />
            {isAdmin && <Info label="Costo USD" value={`USD ${product.purchase_price_usd}`} />}
            <Info label="Venta sugerida USD" value={`USD ${product.suggested_sale_price_usd}`} />
            {isAdmin && <Info
              label="Costo ARS"
              value={exchange ? `ARS ${toArs(product.purchase_price_usd, exchange.buy_rate_ars)}` : "-"}
            />}
            <Info
              label="Venta sugerida ARS"
              value={exchange ? `ARS ${toArs(product.suggested_sale_price_usd, exchange.sell_rate_ars)}` : "-"}
            />
          </div>

          {product.notes && (
            <div className="mt-5">
              <p className="text-xs font-medium text-base-muted uppercase tracking-wide mb-2">Observaciones</p>
              <div className="bg-base-subtle border border-base-border rounded-xl p-4 text-sm text-base-text">
                {product.notes}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-card h-fit">
          <h3 className="text-base font-semibold text-base-text mb-4">Acciones</h3>

          <div className="space-y-2">
            {(product.status === "in_stock" || (product.status === "reserved" && (isAdmin || product.reserved_by === user?.id))) && (
              <Link
                to={`/products/${product.id}/sell`}
                className="block w-full text-center bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                Vender ahora
              </Link>
            )}

            {product.status === "in_stock" && (
              <button
                onClick={() => setShowReservation(true)}
                className="flex items-center justify-center gap-2 w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl px-4 py-2.5 text-sm font-medium transition"
              >
                <Bookmark size={15} /> Reservar
              </button>
            )}

            {product.status === "reserved" && (isAdmin || product.reserved_by === user?.id) && (
              <button
                onClick={releaseReservation}
                disabled={reservationSaving}
                className="flex items-center justify-center gap-2 w-full bg-base-subtle hover:bg-base-border text-base-text rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-60"
              >
                <X size={15} /> Liberar reserva
              </button>
            )}

            {isAdmin && <a
              href={`https://xylo-system-production.up.railway.app/products/${product.id}/qr`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
            >
              Ver / descargar QR
            </a>}

            {isAdmin && <Link
              to={`/products/${product.id}/label`}
              className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
            >
              Ver etiqueta imprimible
            </Link>}

            {isAdmin && <Link
              to={`/products/${product.id}/edit`}
              className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
            >
              Editar producto
            </Link>}

            <Link
              to={product.status === "sold" ? "/sold-products" : "/products"}
              className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
            >
              {product.status === "sold" ? "Volver a vendidos" : "Volver al stock"}
            </Link>

            {/* Eliminar — solo para productos vendidos */}
            {isAdmin && product.status === "sold" && (
              <div className="pt-2 mt-2 border-t border-base-border">
                {confirmDelete ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-sm text-red-600 font-medium mb-3 text-center">
                      ¿Seguro que querés eliminar este producto?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 transition text-white rounded-xl px-4 py-2.5 text-sm font-medium"
                      >
                        {deleting ? "Eliminando..." : "Sí, eliminar"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 bg-base-subtle hover:bg-base-border transition text-base-muted rounded-xl px-4 py-2.5 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center justify-center gap-2 w-full text-red-500 hover:bg-red-50 transition rounded-xl px-4 py-2.5 text-sm border border-red-100"
                  >
                    <Trash2 size={15} />
                    Eliminar producto
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {isAdmin && <div className="mt-5">
        <AuditHistory entityType="product" entityId={id} />
      </div>}

      {showReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(event) => event.target === event.currentTarget && setShowReservation(false)}>
          <div className="w-full max-w-md bg-base-card border border-base-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-base-text">Reservar {product.model}</h3>
                <p className="text-xs text-base-muted mt-1">Indicá quién lo reserva y hasta cuándo.</p>
              </div>
              <button onClick={() => setShowReservation(false)} className="p-2 text-base-muted"><X size={16} /></button>
            </div>
            <form onSubmit={reserveProduct} className="space-y-4">
              <label className="block">
                <span className="block text-xs font-medium text-base-muted mb-1.5">Cliente</span>
                <input
                  value={reservationForm.client_name}
                  onChange={(event) => setReservationForm((current) => ({ ...current, client_name: event.target.value }))}
                  minLength={2}
                  required
                  className={inputClass}
                  placeholder="Nombre del cliente"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-base-muted mb-1.5">Fecha y hora límite</span>
                <input
                  type="datetime-local"
                  value={reservationForm.reserved_until}
                  onChange={(event) => setReservationForm((current) => ({ ...current, reserved_until: event.target.value }))}
                  required
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-base-muted mb-1.5">Notas</span>
                <textarea
                  value={reservationForm.notes}
                  onChange={(event) => setReservationForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Seña, condiciones u observaciones"
                />
              </label>
              {reservationError && <p className="text-sm text-red-500">{reservationError}</p>}
              <button
                type="submit"
                disabled={reservationSaving}
                className="w-full flex items-center justify-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                <CalendarClock size={15} />
                {reservationSaving ? "Reservando..." : "Confirmar reserva"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Info({ label, value, mono = false }) {
  return (
    <div className="bg-base-subtle border border-base-border rounded-xl p-4">
      <p className="text-xs text-base-muted mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium text-base-text ${mono ? "font-mono" : ""}`}>
        {value || "-"}
      </p>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}
