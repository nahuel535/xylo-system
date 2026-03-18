import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { XyloLogo, WhatsAppIcon, PhoneIcon } from "../components/Icons";

const WHATSAPP = "5493512345678";
const ACCENT = "#4a9d7f";
const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

export default function StoreProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const heroRef = useRef(null);

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
    if (!heroRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => setCtaVisible(!e.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, [product]);

  if (loading) return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6e6e73", fontSize: "17px" }}>Cargando...</p>
    </div>
  );

  if (!product || product.status !== "in_stock") return (
    <div style={{ fontFamily: FONT, background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "24px", textAlign: "center" }}>
      <PhoneIcon size={48} color="#d1d1d6" />
      <p style={{ fontSize: "22px", fontWeight: 600, color: "#1d1d1f" }}>Producto no disponible</p>
      <p style={{ fontSize: "15px", color: "#6e6e73" }}>Este equipo ya fue vendido o no está disponible.</p>
      <Link to="/" style={{ marginTop: "8px", color: ACCENT, fontSize: "15px", textDecoration: "none", fontWeight: 500 }}>Ver stock disponible →</Link>
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
    product.battery_health ? { label: "Salud de batería", value: `${product.battery_health}%` } : null,
  ].filter(Boolean);

  return (
    <div style={{ fontFamily: FONT, background: "#fff", color: "#1d1d1f", overflowX: "hidden" }}>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: "56px",
        background: scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.01)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
        transition: "background 0.3s, border-color 0.3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <Link to="/" style={{ fontSize: "15px", color: "#1d1d1f", textDecoration: "none", fontWeight: 400, opacity: 0.6, display: "flex", alignItems: "center", gap: "4px" }}>
          ‹ Volver
        </Link>
        <XyloLogo size={22} />
        <div style={{ width: "60px" }} />
      </nav>

      {/* Sticky buy bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
        padding: "14px 32px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
        transform: ctaVisible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#1d1d1f", margin: 0, letterSpacing: "-0.2px" }}>
            {product.model}{product.storage ? ` · ${product.storage}` : ""}
          </p>
          <p style={{ fontSize: "13px", color: "#6e6e73", margin: 0 }}>
            USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
            {ars ? `  ·  ARS ${ars}` : ""}
          </p>
        </div>
        <a
          href={waUrl} target="_blank" rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#25d366", color: "white",
            padding: "11px 22px", borderRadius: "980px",
            fontSize: "14px", fontWeight: 600, textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <WhatsAppIcon size={15} /> Me interesa
        </a>
      </div>

      {/* Hero imagen */}
      <div style={{
        paddingTop: "56px",
        background: "radial-gradient(ellipse 80% 60% at 50% 60%, #e8f4f0 0%, #f5f5f7 55%, #ebebed 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", minHeight: "520px", position: "relative",
      }}>
        {/* Glow difuso detrás del equipo */}
        <div style={{
          position: "absolute",
          width: "360px", height: "360px",
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
          borderRadius: "50%",
          pointerEvents: "none",
        }} />

        {product.photo_url ? (
          <div style={{ position: "relative", zIndex: 1, padding: "56px 0 0" }}>
            <img
              src={product.photo_url}
              alt={product.model}
              style={{
                maxWidth: "360px", width: "70vw", maxHeight: "460px",
                objectFit: "contain", display: "block",
                filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.18)) drop-shadow(0 8px 16px rgba(0,0,0,0.10))",
              }}
            />
            {/* Reflejo */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "60px",
              background: "linear-gradient(to bottom, transparent, rgba(235,235,237,0.6))",
              pointerEvents: "none",
            }} />
          </div>
        ) : (
          <div style={{ padding: "80px 0", opacity: 0.2, zIndex: 1 }}>
            <PhoneIcon size={96} color="#1d1d1f" />
          </div>
        )}
      </div>

      {/* Nombre + subtítulo */}
      <section style={{ textAlign: "center", padding: "72px 24px 56px", borderBottom: "1px solid #f0f0f0" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
          Disponible
        </p>
        <h1 style={{
          fontSize: "clamp(40px, 7vw, 72px)",
          fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
          color: "#1d1d1f", marginBottom: "16px",
        }}>
          {product.model}
        </h1>
        {(product.storage || product.color) && (
          <p style={{ fontSize: "clamp(18px, 2.5vw, 22px)", color: "#6e6e73", fontWeight: 400 }}>
            {[product.storage, product.color].filter(Boolean).join(" · ")}
          </p>
        )}
      </section>

      {/* Batería — solo si existe */}
      {product.battery_health && (
        <section style={{ padding: "64px 24px", borderBottom: "1px solid #f0f0f0", background: "#f5f5f7" }}>
          <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "32px" }}>
              Salud de batería
            </p>
            {/* Arco circular */}
            <BatteryArc value={product.battery_health} color={batteryColor} />
          </div>
        </section>
      )}

      {/* Especificaciones */}
      <section style={{ padding: "64px 24px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "32px", textAlign: "center" }}>
            Especificaciones
          </p>
          <div>
            {specs.map((spec, i) => (
              <div key={spec.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "18px 0",
                borderBottom: i < specs.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <span style={{ fontSize: "15px", color: "#6e6e73" }}>{spec.label}</span>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#1d1d1f" }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notas */}
      {product.notes && (
        <section style={{ padding: "64px 24px", borderBottom: "1px solid #f0f0f0", background: "#f5f5f7" }}>
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px" }}>
              Observaciones
            </p>
            <p style={{ fontSize: "17px", color: "#1d1d1f", lineHeight: 1.75 }}>{product.notes}</p>
          </div>
        </section>
      )}

      {/* Precio */}
      <section ref={heroRef} style={{ textAlign: "center", padding: "64px 24px", borderBottom: "1px solid #f0f0f0", background: "#f5f5f7" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#6e6e73", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px" }}>
          Precio
        </p>
        <p style={{
          fontSize: "clamp(48px, 9vw, 80px)",
          fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
          color: "#1d1d1f",
        }}>
          USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
        </p>
        {ars && (
          <p style={{ fontSize: "clamp(18px, 2.5vw, 24px)", color: "#6e6e73", marginTop: "10px" }}>
            ARS {ars}
          </p>
        )}
      </section>

      {/* CTA final */}
      <section style={{ padding: "80px 24px 120px", textAlign: "center" }}>
        <p style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#1d1d1f", marginBottom: "8px" }}>
          ¿Te interesa?
        </p>
        <p style={{ fontSize: "17px", color: "#6e6e73", marginBottom: "32px" }}>
          Escribinos y lo reservamos para vos.
        </p>
        <a
          href={waUrl} target="_blank" rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "#25d366", color: "white",
            padding: "18px 40px", borderRadius: "980px",
            fontSize: "17px", fontWeight: 600, textDecoration: "none",
            boxShadow: "0 4px 24px rgba(37,211,102,0.28)",
            marginBottom: "20px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <WhatsAppIcon size={20} />
          Escribinos por WhatsApp
        </a>
        <br />
        <Link to="/"
          style={{ fontSize: "15px", color: "#6e6e73", textDecoration: "none" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#1d1d1f"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#6e6e73"}
        >
          ← Ver más equipos
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
          <XyloLogo size={20} />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1d1d1f" }}>Xylo</span>
        </div>
        <p style={{ fontSize: "12px", color: "#aaa" }}>© {new Date().getFullYear()} Xylo — Todos los derechos reservados</p>
      </footer>

      <style>{`* { -webkit-font-smoothing: antialiased; }`}</style>
    </div>
  );
}

/* Arco SVG para mostrar la salud de batería */
function BatteryArc({ value, color }) {
  const size = 180;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Arco de 270° (de 135° a 405° = 135° + 270°)
  const startAngle = 135;
  const totalAngle = 270;
  const angle = (value / 100) * totalAngle;

  function polar(deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(startDeg, endDeg) {
    const s = polar(startDeg);
    const e = polar(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Track */}
        <path
          d={arc(startAngle, startAngle + totalAngle)}
          fill="none" stroke="#f0f0f0" strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progreso */}
        {value > 0 && (
          <path
            d={arc(startAngle, startAngle + angle)}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}
        {/* Valor */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#1d1d1f"
          style={{ fontSize: "36px", fontWeight: 700, fontFamily: "inherit", letterSpacing: "-0.03em" }}>
          {value}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#6e6e73"
          style={{ fontSize: "13px", fontFamily: "inherit" }}>
          salud
        </text>
      </svg>
    </div>
  );
}
