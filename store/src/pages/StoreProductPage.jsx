import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, ChevronLeft, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import api from "../services/api";
import { XyloLogo, WhatsAppIcon } from "../components/Icons";
import { trackViewContent, trackContact, trackReservationRequest } from "../utils/metaPixel";

const WHATSAPP = "5493518916482";
const ACCENT = "#00C896";
const GALLERY_ENABLED = false;

const T = {
  heading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  bg: "#ffffff",
  surface: "#f6f6f4",
  card: "#ffffff",
  text: "#0a0a0a",
  textSec: "#6b7280",
  textMuted: "#9ca3af",
  border: "rgba(0,0,0,0.08)",
  borderAccent: "rgba(0,200,150,0.30)",
  accent: ACCENT,
  accentLight: "rgba(0,200,150,0.08)",
  accentBorder: "rgba(0,200,150,0.20)",
};

function waLink(product) {
  const msg = `Hola! Me interesa el ${product.model}${product.storage ? ` ${product.storage}` : ""}${product.color ? ` ${product.color}` : ""}. ¿Sigue disponible?`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Navbar
// ─────────────────────────────────────────────────────────────────────────────
function Navbar({ scrolled }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: "60px",
        background: scrolled ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.70)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 48px)",
        transition: "background 0.35s, border-color 0.35s",
        fontFamily: T.body,
      }}
    >
      <Link
        to="/"
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontSize: "14px", color: T.textSec, textDecoration: "none",
          fontWeight: 400, transition: "color 0.2s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = T.text}
        onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
      >
        <ChevronLeft size={16} strokeWidth={2} />
        Volver
      </Link>
      <XyloLogo size={22} />
      <div style={{ width: "60px" }} />
    </motion.nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sticky Buy Bar
// ─────────────────────────────────────────────────────────────────────────────
function StickyBuyBar({ product, exchange, visible }) {
  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars))
        .toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
            padding: "14px clamp(16px, 4vw, 48px)",
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: `1px solid ${T.border}`,
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "16px",
            fontFamily: T.body,
          }}
        >
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: T.text, letterSpacing: "-0.02em" }}>
              {product.model}{product.storage ? ` · ${product.storage}` : ""}
            </p>
            <p style={{ fontSize: "13px", color: T.textSec }}>
              USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
              {ars ? `  ·  ARS ${ars}` : ""}
            </p>
          </div>
          <motion.a
            href={waLink(product)}
            onClick={() => {
              trackContact(product);
              if (product.status === "in_stock") trackReservationRequest(product);
            }}
            target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#25d366", color: "white",
              padding: "11px 22px", borderRadius: "980px",
              fontSize: "14px", fontWeight: 600, textDecoration: "none",
              flexShrink: 0, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(37,211,102,0.28)",
            }}
          >
            <WhatsAppIcon size={15} />
            {product.status === "reserved" ? "Consultar alternativas" : "Me interesa"}
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Battery Arc
// ─────────────────────────────────────────────────────────────────────────────
function BatteryArc({ value, color }) {
  const size = 200, stroke = 10;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const startAngle = 135, totalAngle = 270;
  const angle = (value / 100) * totalAngle;

  function polar(deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arc(startDeg, endDeg) {
    const s = polar(startDeg), e = polar(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <svg width={size} height={size} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
      <path d={arc(startAngle, startAngle + totalAngle)}
        fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} strokeLinecap="round" />
      {value > 0 && (
        <path d={arc(startAngle, startAngle + angle)}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}50)` }} />
      )}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={T.text}
        style={{ fontSize: "38px", fontWeight: 700, fontFamily: T.heading, letterSpacing: "-0.04em" }}>
        {value}%
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill={T.textMuted}
        style={{ fontSize: "13px", fontFamily: T.body, letterSpacing: "0.04em" }}>
        salud
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Reveal wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({ children, style }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      style={style}>
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Loading / Unavailable
// ─────────────────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.body }}>
      <div style={{ width: "min(560px, calc(100% - 40px))" }}>
        <motion.div
          animate={{ opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ height: "300px", borderRadius: "24px", background: T.surface, marginBottom: "28px" }}
        />
        <div style={{ height: "24px", width: "48%", borderRadius: "8px", background: T.surface, margin: "0 auto 12px" }} />
        <div style={{ height: "14px", width: "32%", borderRadius: "8px", background: T.surface, margin: "0 auto" }} />
        <p style={{ color: T.textSec, fontSize: "13px", textAlign: "center", marginTop: "28px" }}>
          Cargando información del equipo…
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "24px", textAlign: "center" }}>
      <AlertCircle size={48} strokeWidth={1.2} color={T.textMuted} />
      <p style={{ fontFamily: T.heading, fontSize: "24px", fontWeight: 600, color: T.text }}>
        No pudimos cargar este equipo
      </p>
      <p style={{ maxWidth: "420px", fontSize: "15px", color: T.textSec, lineHeight: 1.6 }}>
        Puede ser una demora momentánea. Volvé a intentar o consultanos directamente.
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={onRetry} style={{ display: "inline-flex", alignItems: "center", gap: "7px", border: 0, borderRadius: "980px", background: T.text, color: "#fff", padding: "12px 20px", cursor: "pointer", fontFamily: T.body, fontWeight: 600 }}>
          <RefreshCw size={14} /> Reintentar
        </button>
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "7px", borderRadius: "980px", background: "#25d366", color: "#fff", padding: "12px 20px", textDecoration: "none", fontWeight: 600 }}>
          <WhatsAppIcon size={15} /> WhatsApp
        </a>
      </div>
    </div>
  );
}

function UnavailableState({ alternatives = [] }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "24px", textAlign: "center" }}>
      <div style={{ opacity: 0.15, marginBottom: "8px" }}>
        <Smartphone size={56} strokeWidth={1} color={T.text} />
      </div>
      <p style={{ fontFamily: T.heading, fontSize: "24px", fontWeight: 600, color: T.text }}>
        Producto no disponible
      </p>
      <p style={{ fontSize: "15px", color: T.textSec }}>Este equipo ya fue vendido o no está disponible.</p>
      <Link to="/" style={{ marginTop: "8px", color: ACCENT, fontSize: "15px", textDecoration: "none", fontWeight: 500 }}>
        Ver stock disponible →
      </Link>
      {alternatives.length > 0 && (
        <div style={{ width: "min(680px, 100%)", marginTop: "28px" }}>
          <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: "12px" }}>Equipos disponibles ahora</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            {alternatives.slice(0, 3).map((item) => (
              <Link key={item.id} to={`/producto/${item.id}`} style={{ border: `1px solid ${T.border}`, borderRadius: "14px", padding: "14px", color: T.text, textDecoration: "none", background: T.card }}>
                <p style={{ fontWeight: 600, fontSize: "14px" }}>{item.model}</p>
                <p style={{ color: T.textSec, fontSize: "12px", marginTop: "3px" }}>{item.storage || "Consultar capacidad"}</p>
                <p style={{ color: ACCENT, fontWeight: 700, fontSize: "14px", marginTop: "8px" }}>USD {Number(item.suggested_sale_price_usd).toLocaleString("es-AR")}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function useProductSeo(product) {
  useEffect(() => {
    if (!product) return undefined;
    const titleParts = [product.model, product.storage, product.color].filter(Boolean);
    const title = `${titleParts.join(" · ")} — Xylo`;
    const description = [
      product.battery_health ? `Batería ${product.battery_health}%` : null,
      product.suggested_sale_price_usd
        ? `USD ${Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}`
        : null,
      product.status === "reserved" ? "Reservado" : "Disponible",
    ].filter(Boolean).join(" · ");
    const canonicalUrl = `https://www.xylobox.store/producto/${product.id}`;

    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:type", "product");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    if (product.photo_url) setMeta("property", "og:image", product.photo_url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: titleParts.join(" · "),
      image: [product.photo_url, ...(product.gallery_urls || [])].filter(Boolean),
      sku: String(product.id),
      brand: { "@type": "Brand", name: product.brand || "Apple" },
      itemCondition: product.condition_type?.toLowerCase().includes("nuevo")
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "USD",
        price: Number(product.suggested_sale_price_usd || 0),
        availability: product.status === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
    };
    const schemaNode = document.createElement("script");
    schemaNode.type = "application/ld+json";
    schemaNode.dataset.xyloProduct = "true";
    schemaNode.textContent = JSON.stringify(schema);
    document.head.appendChild(schemaNode);

    return () => schemaNode.remove();
  }, [product]);
}

function setMeta(attribute, key, content) {
  let node = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.content = content;
}

// ─────────────────────────────────────────────────────────────────────────────
//  StoreProductPage
// ─────────────────────────────────────────────────────────────────────────────
export default function StoreProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    if (product) {
      trackViewContent(product);
    }
  }, [product]);

  useEffect(() => {
    // Limpiar ?v=1 que agrega la función OG de Vercel
    const url = new URL(window.location.href);
    if (url.searchParams.has("v")) {
      url.searchParams.delete("v");
      window.history.replaceState({}, "", url.pathname);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const [prodRes, exRes] = await Promise.all([
          api.get(`/products/${id}`, { timeout: 12000 }),
          api.get("/exchange-rates/active").catch(() => ({ data: null })),
        ]);
        if (cancelled) return;
        setProduct(prodRes.data);
        setExchange(exRes.data);
        setLoading(false);
        // Las alternativas no bloquean la ficha principal: se cargan después.
        api.get("/products/", { timeout: 12000 }).then((productsRes) => {
          if (cancelled || !Array.isArray(productsRes.data)) return;
          setAlternatives(
            productsRes.data
              .filter((item) => item.status === "in_stock" && String(item.id) !== String(id))
              .sort((a, b) => Number(a.suggested_sale_price_usd) - Number(b.suggested_sale_price_usd))
              .slice(0, 3)
          );
        }).catch(() => {});
        // Guardar en vistos recientemente
        try {
          const prev = JSON.parse(localStorage.getItem("xylo_recent") || "[]");
          const next = [String(prodRes.data.id), ...prev.filter((x) => x !== String(prodRes.data.id))].slice(0, 6);
          localStorage.setItem("xylo_recent", JSON.stringify(next));
        } catch {}
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
    };
  }, [id, retryKey]);

  useEffect(() => {
    if (!heroRef.current) return;
    const obs = new IntersectionObserver(([e]) => setCtaVisible(!e.isIntersecting), { threshold: 0 });
    obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, [product]);

  useProductSeo(product);

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState onRetry={() => setRetryKey((value) => value + 1)} />;
  if (!product || !["in_stock", "reserved"].includes(product.status)) return <UnavailableState alternatives={alternatives} />;

  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars))
        .toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  const batteryColor =
    product.battery_health >= 85 ? "#16a34a" :
    product.battery_health >= 70 ? "#d97706" : "#dc2626";

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
  const isReserved = product.status === "reserved";
  const media = [product.photo_url, ...(product.gallery_urls || [])].filter(Boolean);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, overflowX: "hidden", fontFamily: T.body }}>
      <Navbar scrolled={scrolled} />
      <StickyBuyBar product={product} exchange={exchange} visible={ctaVisible} />

      {/* ── Hero image ─────────────────────────────────────────────── */}
      <div style={{
        paddingTop: "60px",
        minHeight: "560px",
        background: "radial-gradient(ellipse 80% 60% at 50% 55%, #e8f9f4 0%, #f6f6f4 55%, #efefed 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(0,200,150,0.12) 0%, transparent 65%)",
          borderRadius: "50%", pointerEvents: "none",
          animation: "glow-pulse 4s ease-in-out infinite",
        }} />

        {media[0] ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: "relative", zIndex: 1, padding: "64px 24px 0" }}
          >
            <img
              src={media[0]}
              alt={product.model}
              style={{
                maxWidth: "340px", width: "60vw", maxHeight: "460px",
                objectFit: "contain", display: "block",
                filter: "drop-shadow(0 40px 56px rgba(0,0,0,0.16)) drop-shadow(0 8px 16px rgba(0,200,150,0.06))",
              }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "80px",
              background: "linear-gradient(to bottom, transparent, rgba(239,239,237,0.5))",
              pointerEvents: "none",
            }} />
          </motion.div>
        ) : (
          <div style={{ padding: "100px 0", opacity: 0.1, zIndex: 1 }}>
            <Smartphone size={96} strokeWidth={1} color={T.text} />
          </div>
        )}
        {GALLERY_ENABLED && media.length > 1 && (
          <div style={{ position: "absolute", left: "50%", bottom: "20px", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 3 }}>
            {media.map((source, index) => (
              <img key={source} src={source} alt={`${product.model} ${index + 1}`} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "10px", border: "2px solid #fff" }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Name + subtitle ─────────────────────────────────────────── */}
      <section style={{
        textAlign: "center",
        padding: "80px clamp(20px, 6vw, 80px) 64px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <p style={{
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: ACCENT, marginBottom: "20px",
          }}>
            {isReserved ? "Reservado" : "Disponible"}
          </p>
          <h1 style={{
            fontFamily: T.heading,
            fontSize: "clamp(40px, 7vw, 72px)",
            fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1,
            color: T.text, marginBottom: "16px",
          }}>
            {product.model}
          </h1>
          {(product.storage || product.color) && (
            <p style={{ fontSize: "clamp(17px, 2.2vw, 20px)", color: T.textSec, fontWeight: 400 }}>
              {[product.storage, product.color].filter(Boolean).join(" · ")}
            </p>
          )}
        </motion.div>
      </section>

      {/* ── Compra segura ─────────────────────────────────────────── */}
      <Reveal style={{ borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: "72px clamp(20px, 6vw, 80px)", maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <ShieldCheck size={28} color={ACCENT} />
            <h2 style={{ fontFamily: T.heading, fontSize: "clamp(25px, 4vw, 34px)", marginTop: "12px", letterSpacing: "-0.03em" }}>Qué revisamos antes de publicarlo</h2>
            <p style={{ color: T.textSec, fontSize: "14px", lineHeight: 1.6, marginTop: "10px" }}>
              Control técnico del equipo y garantía de funcionamiento. Las condiciones se confirman antes de la entrega.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
            {["Pantalla y táctil", "Cámaras y Face ID", "Batería y carga", "Botones y sonido", "Conectividad", "IMEI y funcionamiento"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "9px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "13px 15px", fontSize: "13px", color: T.textSec }}>
                <Check size={15} color={ACCENT} strokeWidth={2.5} /> {item}
              </div>
            ))}
          </div>
          {product.warranty_days ? (
            <p style={{ textAlign: "center", color: T.text, fontWeight: 600, fontSize: "14px", marginTop: "24px" }}>
              Garantía informada para este equipo: {product.warranty_days} días.
            </p>
          ) : (
            <p style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", marginTop: "24px" }}>
              Consultá las condiciones específicas de garantía de esta unidad.
            </p>
          )}
        </div>
      </Reveal>

      {/* ── Battery ─────────────────────────────────────────────────── */}
      {product.battery_health && (
        <Reveal style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ padding: "80px clamp(20px, 6vw, 80px)", maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
            <p style={{
              fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em",
              textTransform: "uppercase", color: T.textMuted, marginBottom: "40px",
            }}>
              Salud de batería
            </p>
            <BatteryArc value={product.battery_health} color={batteryColor} />
            <p style={{ fontSize: "14px", color: T.textSec, marginTop: "20px", lineHeight: 1.6 }}>
              {product.battery_health >= 85 ? "Batería en excelente estado"
                : product.battery_health >= 70 ? "Batería en buen estado"
                : "Batería con desgaste moderado"}
            </p>
          </div>
        </Reveal>
      )}

      {/* ── Specs ───────────────────────────────────────────────────── */}
      <Reveal style={{ borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: "80px clamp(20px, 6vw, 80px)", maxWidth: "640px", margin: "0 auto" }}>
          <p style={{
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: T.textMuted,
            marginBottom: "32px", textAlign: "center",
          }}>
            Especificaciones
          </p>
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: "20px", padding: "0 24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {specs.map((spec, i) => (
              <div key={spec.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "18px 0",
                borderBottom: i < specs.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <span style={{ fontSize: "14px", color: T.textSec }}>{spec.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: T.text }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── Notes ───────────────────────────────────────────────────── */}
      {product.notes && (
        <Reveal style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ padding: "80px clamp(20px, 6vw, 80px)", maxWidth: "640px", margin: "0 auto" }}>
            <p style={{
              fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em",
              textTransform: "uppercase", color: T.textMuted, marginBottom: "24px",
            }}>
              Observaciones
            </p>
            <p style={{
              fontSize: "17px", color: T.textSec, lineHeight: 1.75,
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: "16px", padding: "24px 28px",
            }}>
              {product.notes}
            </p>
          </div>
        </Reveal>
      )}

      {/* ── Price ───────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{
        textAlign: "center",
        padding: "100px clamp(20px, 6vw, 80px)",
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px", height: "300px",
          background: "radial-gradient(ellipse, rgba(0,200,150,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <Reveal>
          <p style={{
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: T.textMuted, marginBottom: "24px",
          }}>
            Precio
          </p>
          <p style={{
            fontFamily: T.heading,
            fontSize: "clamp(52px, 10vw, 88px)",
            fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
            color: T.text,
          }}>
            USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
          </p>
          {ars && (
            <p style={{ fontSize: "clamp(18px, 2.5vw, 24px)", color: T.textSec, marginTop: "12px" }}>
              ARS {ars}
            </p>
          )}
        </Reveal>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px clamp(20px, 6vw, 80px) 140px", textAlign: "center" }}>
        <Reveal>
          <p style={{
            fontFamily: T.heading,
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 600, letterSpacing: "-0.02em",
            color: T.text, marginBottom: "10px",
          }}>
            ¿Te interesa?
          </p>
          <p style={{ fontSize: "17px", color: T.textSec, marginBottom: "40px", lineHeight: 1.6 }}>
            {isReserved
              ? "Este equipo ya está reservado. Podemos avisarte si se libera o mostrarte alternativas."
              : "Solicitá la reserva por WhatsApp y confirmamos disponibilidad con vos."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <motion.a
              href={waLink(product)}
              onClick={() => {
                trackContact(product);
                if (!isReserved) trackReservationRequest(product);
              }}
              target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                background: "#25d366", color: "white",
                padding: "18px 40px", borderRadius: "980px",
                fontSize: "17px", fontWeight: 600, textDecoration: "none",
                boxShadow: "0 8px 36px rgba(37,211,102,0.28)",
                cursor: "pointer",
              }}
            >
              <WhatsAppIcon size={20} />
              {isReserved ? "Consultar alternativas" : "Solicitar reserva"}
            </motion.a>
            <Link to="/"
              style={{ fontSize: "14px", color: T.textMuted, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.textSec}
              onMouseLeave={(e) => e.currentTarget.style.color = T.textMuted}
              onClick={() => trackContact(product)}
              >
              ← Ver más equipos
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${T.border}`,
        padding: "32px clamp(16px, 4vw, 48px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "8px", background: T.bg,
      }}>
        <XyloLogo size={18} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: T.text, letterSpacing: "-0.3px" }}>Xylo</span>
        <span style={{ fontSize: "13px", color: T.textMuted, marginLeft: "12px" }}>
          © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
