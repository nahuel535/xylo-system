import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { Trash2 } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
            <Info label="Estado estético" value={product.cosmetic_condition} />
            <Info label="Estado funcional" value={product.functional_condition} />
            <Info label="Tipo SIM" value={product.sim_type} />
            <Info label="Condición" value={product.condition_type} />
            <Info label="Costo USD" value={`USD ${product.purchase_price_usd}`} />
            <Info label="Venta sugerida USD" value={`USD ${product.suggested_sale_price_usd}`} />
            <Info
              label="Costo ARS"
              value={exchange ? `ARS ${toArs(product.purchase_price_usd, exchange.buy_rate_ars)}` : "-"}
            />
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
            {product.status === "in_stock" && (
              <Link
                to={`/products/${product.id}/sell`}
                className="block w-full text-center bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                Vender ahora
              </Link>
            )}

            <a
              href={`https://xylo-system-production.up.railway.app/products/${product.id}/qr`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
            >
              Ver / descargar QR
            </a>

            <Link
              to={`/products/${product.id}/label`}
              className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
            >
              Ver etiqueta imprimible
            </Link>

            {product.status !== "sold" && (
              <Link
                to={`/products/${product.id}/edit`}
                className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
              >
                Editar producto
              </Link>
            )}

            {product.status === "sold" && (
              <div className="bg-base-subtle rounded-xl px-4 py-2.5 text-center text-sm text-base-muted">
                Este producto ya fue vendido
              </div>
            )}

            <Link
              to={product.status === "sold" ? "/sold-products" : "/products"}
              className="block w-full text-center bg-base-subtle hover:bg-base-border transition text-base-text rounded-xl px-4 py-2.5 text-sm"
            >
              {product.status === "sold" ? "Volver a vendidos" : "Volver al stock"}
            </Link>

            {/* Eliminar — solo para productos vendidos */}
            {product.status === "sold" && (
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
    </div>
  );
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