import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { XyloLogo, WhatsAppIcon } from "../../components/public/Icons";

const WHATSAPP = "5493512345678"; // reemplazá con el número real

export default function StoreProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, exRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/exchange-rates/active").catch(() => ({ data: null })),
        ]);
        setProduct(prodRes.data);
        setExchange(exRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, sans-serif", background: "#f5f5f7", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6e6e73" }}>Cargando...</p>
    </div>
  );

  if (!product || product.status !== "in_stock") return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, sans-serif", background: "#f5f5f7", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "48px" }}>📭</p>
      <p style={{ fontSize: "19px", fontWeight: 600, color: "#1d1d1f" }}>Producto no disponible</p>
      <Link to="/store" style={{ color: "#4a9d7f", fontSize: "15px" }}>← Volver al stock</Link>
    </div>
  );

  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars)).toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  const batteryColor = product.battery_health >= 85 ? "#34c759" : product.battery_health >= 70 ? "#ff9f0a" : "#ff3b30";

  const waMessage = encodeURIComponent(`Hola! Me interesa el ${product.model} ${product.storage} ${product.color}. ¿Sigue disponible?`);
  const waUrl = `https://wa.me/${WHATSAPP}?text=${waMessage}`;

  const specs = [
    { label: "Modelo", value: product.model },
    { label: "Capacidad", value: product.storage },
    { label: "Color", value: product.color },
    { label: "Condición", value: product.condition_type },
    { label: "Estado estético", value: product.cosmetic_condition },
    { label: "Estado funcional", value: product.functional_condition },
    { label: "Tipo de SIM", value: product.sim_type },
  ].filter((s) => s.value);

  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", background: "#f5f5f7", minHeight: "100vh", color: "#1d1d1f" }}>

      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(245,245,247,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "52px",
      }}>
        <Link to="/store" style={{ fontSize: "15px", color: "#4a9d7f", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          ← Stock
        </Link>
        <XyloLogo size={22} />
        <div style={{ width: "60px" }} />
      </nav>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header del producto */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          {product.photo_url ? (
  <img
    src={product.photo_url}
    alt={product.model}
    style={{
      width: "100%", maxHeight: "360px", objectFit: "cover",
      borderRadius: "20px", marginBottom: "32px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
    }}
  />
) : (
  <div style={{
    width: "96px", height: "96px", background: "white",
    borderRadius: "24px", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "48px",
    margin: "0 auto 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  }}>
    📱
  </div>
)}
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, letterSpacing: "-1px", marginBottom: "8px" }}>
            {product.model}
          </h1>
          <p style={{ fontSize: "17px", color: "#6e6e73" }}>
            {product.storage} · {product.color}
          </p>
        </div>

        {/* Precio */}
        <div style={{
          background: "white", borderRadius: "20px", padding: "28px",
          marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "42px", fontWeight: 700, letterSpacing: "-1.5px", color: "#1d1d1f", marginBottom: "6px" }}>
            USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
          </p>
          {ars && (
            <p style={{ fontSize: "20px", color: "#6e6e73", fontWeight: 500 }}>ARS {ars}</p>
          )}
        </div>

        {/* Batería */}
        {product.battery_health && (
          <div style={{
            background: "white", borderRadius: "20px", padding: "20px 28px",
            marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", gap: "16px",
          }}>
            <span style={{ fontSize: "24px" }}>🔋</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "15px", fontWeight: 500 }}>Salud de batería</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: batteryColor }}>{product.battery_health}%</span>
              </div>
              <div style={{ height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "3px" }} />
              </div>
            </div>
          </div>
        )}

        {/* Especificaciones */}
        <div style={{
          background: "white", borderRadius: "20px", overflow: "hidden",
          marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          {specs.map((spec, i) => (
            <div key={spec.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 28px",
              borderTop: i > 0 ? "1px solid #f5f5f7" : "none",
            }}>
              <span style={{ fontSize: "15px", color: "#6e6e73" }}>{spec.label}</span>
              <span style={{ fontSize: "15px", fontWeight: 500, color: "#1d1d1f" }}>{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Notas */}
        {product.notes && (
          <div style={{
            background: "white", borderRadius: "20px", padding: "20px 28px",
            marginBottom: "32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <p style={{ fontSize: "13px", color: "#6e6e73", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
              Observaciones
            </p>
            <p style={{ fontSize: "15px", color: "#1d1d1f", lineHeight: 1.6 }}>{product.notes}</p>
          </div>
        )}

        {/* CTA */}
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "10px", background: "#25d366", color: "white",
            padding: "18px 32px", borderRadius: "16px",
            fontSize: "17px", fontWeight: 600, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <WhatsAppIcon size={22} />
          Me interesa este iPhone
        </a>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}