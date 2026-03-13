import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const [productRes, exchangeRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/exchange-rates/active"),
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

  if (loading) return <p className="text-base-muted">Cargando producto...</p>;
  if (!product) return <p className="text-base-muted">Producto no encontrado.</p>;

  return (
    <div>
      <Header
        title={product.model}
        subtitle={`Detalle del equipo #${product.id}`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-base-card border border-base-border rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Info label="Modelo" value={product.model} />
            <Info label="Capacidad" value={product.storage} />
            <Info label="Color" value={product.color} />
            <Info label="IMEI" value={product.imei} />
            <Info label="Batería" value={product.battery_health ? `${product.battery_health}%` : "-"} />
            <Info label="Estado" value={product.status} />
            <Info label="Costo USD" value={`USD ${product.purchase_price_usd}`} />
            <Info label="Venta sugerida USD" value={`USD ${product.suggested_sale_price_usd}`} />
            <Info
              label="Costo ARS"
              value={
                exchange
                  ? `ARS ${toArs(product.purchase_price_usd, exchange.buy_rate_ars)}`
                  : "-"
              }
            />
            <Info
              label="Venta sugerida ARS"
              value={
                exchange
                  ? `ARS ${toArs(product.suggested_sale_price_usd, exchange.sell_rate_ars)}`
                  : "-"
              }
            />
          </div>

          {product.notes && (
            <div className="mt-6">
              <p className="text-sm text-base-muted mb-2">Observaciones</p>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                {product.notes}
              </div>
            </div>
          )}
        </div>

        <div className="bg-base-card border border-base-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Acciones</h3>

          <div className="space-y-3">
            {product.status === "in_stock" && (
              <Link
                to={`/products/${product.id}/sell`}
                className="block w-full text-center bg-xylo-500 hover:bg-xylo-400 transition text-white rounded-xl px-4 py-3 font-medium"
              >
                Vender ahora
              </Link>
            )}

            <a
              href={`${import.meta.env.VITE_API_URL}/products/${product.id}/qr`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-white/5 hover:bg-white/10 transition text-white rounded-xl px-4 py-3 font-medium"
            >
              Ver / descargar QR
            </a>

            <Link
              to={`/products/${product.id}/label`}
              className="block w-full text-center bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-3"
            >
              Ver etiqueta imprimible
            </Link>

            <Link
              to={`/products/${product.id}/edit`}
              className="block w-full text-center bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-3"
            >
              Editar producto
            </Link>

            {product.status === "sold" && (
              <div className="block w-full text-center bg-white/5 text-base-muted rounded-xl px-4 py-3">
                Este producto ya fue vendido
              </div>
            )}

            <Link
              to={product.status === "sold" ? "/sold-products" : "/products"}
              className="block w-full text-center bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-3"
            >
              {product.status === "sold" ? "Volver a vendidos" : "Volver al stock"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
      <p className="text-sm text-base-muted mb-1">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}