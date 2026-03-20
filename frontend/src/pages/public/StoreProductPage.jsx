import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { XyloLogo, WhatsAppIcon } from "../../components/public/Icons";

const WHATSAPP = "5493512345678";
const ACCENT = "#4a9d7f";
const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

export default function StoreProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const priceRef = useRef(null);
  const [priceVisible, setPriceVisible] = useState(true);

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
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [id]);

  useEffect(() => {
    if (!priceRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPriceVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    obs.observe(priceRef.current);
    return () => obs.disconnect();
  }, [product]);

  if (loading) return (
    <div style={{ fontFamily: FONT, background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px", border: `2px solid ${ACCENT}30`,
          borderTop: `2px solid ${ACCENT}`,
          borderRadius: "50%", margin: "0 auto 16px",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "#aaa", fontSize: "15px" }}>Cargando...</p>
      </div>
    </div>
  );

  if (!product || product.status !== "in_stock") return (
    <div style={{
      fontFamily: FONT, background: "#fff", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: "12px", textAlign: "center", padding: "24px",
    }}>
      <div style={{ opacity: 0.25, marginBottom: "8px" }}>
        <InboxSVG />
      </div>
      <p style={{ fontSize: "22px", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.03em" }}>Producto no disponible</p>
      <p style={{ fontSize: "15px", color: "#6e6e73", marginBottom: "8px" }}>
        Este equipo ya fue vendido o no está disponible.
      </p>
      <Link to="/store" style={{ color: ACCENT, fontSize: "15px", textDecoration: "none", fontWeight: 500 }}>
        ← Ver stock disponible
      </Link>
    </div>
  );

  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars)).toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  const batteryColor =
    product.battery_health >= 85 ? "#34c759" :
    product.battery_health >= 70 ? "#ff9f0a" : "#ff3b30";

  const waMessage = encodeURIComponent(
    `Hola! Me interesa el ${product.model}${product.storage ? ` ${product.storage}` : ""}${product.color ? ` ${product.color}` : ""}. ¿Sigue disponible?`
  );
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
    <div style={{ fontFamily: FONT, background: "#fff", minHeight: "100vh", color: "#1d1d1f", overflowX: "hidden" }}>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: "56px",
        background: scrolled ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0)",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <Link
          to="/store"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            color: ACCENT, textDecoration: "none",
            fontSize: "14px", fontWeight: 500,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Stock
        </Link>
        <XyloLogo size={22} />
        <div style={{ width: "60px" }} />
      </nav>

      {/* Sticky CTA bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
        padding: "14px 24px",
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
        transform: priceVisible ? "translateY(100%)" : "translateY(0)",
        transition: "transform 0.35s ease",
      }}>
        <div>
          <p style={{ fontSize: "17px", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.4px", margin: 0 }}>
            USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
          </p>
          {ars && <p style={{ fontSize: "13px", color: "#6e6e73", margin: 0 }}>ARS {ars}</p>}
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "#25d366", color: "white",
            padding: "12px 24px", borderRadius: "980px",
            fontSize: "15px", fontWeight: 600, textDecoration: "none",
            whiteSpace: "nowrap", cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <WhatsAppIcon size={17} />
          Me interesa
        </a>
      </div>

      {/* Imagen hero */}
      <div style={{
        width: "100%",
        background: "#f5f5f7",
        minHeight: "55vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        paddingTop: "56px",
        position: "relative",
      }}>
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.model}
            style={{ width: "100%", maxHeight: "560px", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
            padding: "80px 0",
          }}>
            <div style={{
              width: "100px", height: "100px", background: "white",
              borderRadius: "28px", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            }}>
              <PhoneSVG />
            </div>
            <p style={{ fontSize: "13px", color: "#aaa" }}>Sin foto disponible</p>
          </div>
        )}
        {/* Badge disponible */}
        <div style={{
          position: "absolute", top: "72px", right: "20px",
          background: "rgba(52,199,89,0.12)",
          border: "1px solid rgba(52,199,89,0.2)",
          borderRadius: "980px", padding: "5px 12px",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34c759" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#34c759" }}>Disponible</span>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 160px" }}>

        {/* Título y subtítulo */}
        <div style={{ padding: "48px 0 36px", borderBottom: "1px solid #f0f0f0" }}>
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 700, letterSpacing: "-0.04em",
            lineHeight: 1.05, marginBottom: "8px",
          }}>
            {product.model}
          </h1>
          <p style={{ fontSize: "18px", color: "#6e6e73" }}>
            {[product.storage, product.color].filter(Boolean).join(" · ")}
          </p>
        </div>

        {/* Precio */}
        <div ref={priceRef} style={{ padding: "36px 0", borderBottom: "1px solid #f0f0f0" }}>
          <p style={{
            fontSize: "11px", fontWeight: 600, color: "#aaa",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px",
          }}>
            Precio
          </p>
          <p style={{
            fontSize: "clamp(40px, 8vw, 56px)",
            fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
            color: "#1d1d1f", marginBottom: "6px",
          }}>
            USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
          </p>
          {ars && (
            <p style={{ fontSize: "19px", color: "#6e6e73", fontWeight: 400 }}>
              ARS {ars}
            </p>
          )}
        </div>

        {/* Batería */}
        {product.battery_health && (
          <div style={{ padding: "32px 0", borderBottom: "1px solid #f0f0f0" }}>
            <p style={{
              fontSize: "11px", fontWeight: 600, color: "#aaa",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px",
            }}>
              Salud de batería
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ flex: 1, height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  width: `${product.battery_health}%`, height: "100%",
                  background: `linear-gradient(90deg, ${batteryColor}cc, ${batteryColor})`,
                  borderRadius: "3px",
                  transition: "width 1s ease",
                }} />
              </div>
              <span style={{
                fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em",
                color: batteryColor, minWidth: "64px", textAlign: "right",
              }}>
                {product.battery_health}%
              </span>
            </div>
          </div>
        )}

        {/* Especificaciones */}
        <div style={{ padding: "32px 0", borderBottom: "1px solid #f0f0f0" }}>
          <p style={{
            fontSize: "11px", fontWeight: 600, color: "#aaa",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px",
          }}>
            Especificaciones
          </p>
          <div style={{ background: "#f9f9f9", borderRadius: "16px", overflow: "hidden" }}>
            {specs.map((spec, i) => (
              <div key={spec.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 20px",
                borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}>
                <span style={{ fontSize: "15px", color: "#6e6e73" }}>{spec.label}</span>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#1d1d1f" }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        {product.notes && (
          <div style={{ padding: "32px 0", borderBottom: "1px solid #f0f0f0" }}>
            <p style={{
              fontSize: "11px", fontWeight: 600, color: "#aaa",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px",
            }}>
              Observaciones
            </p>
            <p style={{ fontSize: "16px", color: "#1d1d1f", lineHeight: 1.75 }}>{product.notes}</p>
          </div>
        )}

        {/* CTA */}
        <div style={{ paddingTop: "40px" }}>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "10px", background: "#25d366", color: "white",
              padding: "20px 32px", borderRadius: "16px",
              fontSize: "17px", fontWeight: 600, textDecoration: "none",
              boxShadow: "0 8px 32px rgba(37,211,102,0.28)",
              marginBottom: "12px", cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            <WhatsAppIcon size={21} />
            Me interesa este iPhone
          </a>
          <Link
            to="/store"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              padding: "16px",
              borderRadius: "16px",
              fontSize: "15px", color: "#6e6e73", textDecoration: "none",
              transition: "color 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#1d1d1f"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#6e6e73"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Ver más equipos
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-font-smoothing: antialiased; }
        @media (max-width: 480px) {
          nav { padding: 0 16px !important; }
        }
      `}</style>
    </div>
  );
}

function PhoneSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8c8cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <circle cx="12" cy="17" r="1" fill="#c8c8cc" stroke="none" />
    </svg>
  );
}

function InboxSVG() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
