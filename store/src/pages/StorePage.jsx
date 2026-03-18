import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { XyloLogo, WhatsAppIcon, CheckIcon, BatteryIcon, ChatIcon, BoxIcon, PhoneIcon } from "../components/Icons";

const WHATSAPP = "5493512345678";
const ACCENT = "#4a9d7f";
const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [storageFilter, setStorageFilter] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, exRes] = await Promise.all([
          api.get("/products/"),
          api.get("/exchange-rates/active").catch(() => ({ data: null })),
        ]);
        setProducts(prodRes.data.filter((p) => p.status === "in_stock"));
        setExchange(exRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const models = useMemo(() => [...new Set(products.map((p) => p.model).filter(Boolean))].sort(), [products]);
  const storages = useMemo(() => [...new Set(products.map((p) => p.storage).filter(Boolean))].sort(), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) =>
      (!q || p.model?.toLowerCase().includes(q) || p.storage?.toLowerCase().includes(q) || p.color?.toLowerCase().includes(q)) &&
      (!modelFilter || p.model === modelFilter) &&
      (!storageFilter || p.storage === storageFilter)
    );
  }, [products, search, modelFilter, storageFilter]);

  return (
    <div style={{ fontFamily: FONT, background: "#fff", minHeight: "100vh", color: "#1d1d1f", overflowX: "hidden" }}>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: "56px",
        background: scrolled ? "rgba(255,255,255,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.4s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <XyloLogo size={22} />
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.4px" }}>Xylo</span>
        </Link>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: ACCENT, color: "white",
            padding: "8px 18px", borderRadius: "980px",
            fontSize: "14px", fontWeight: 500, textDecoration: "none",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <WhatsAppIcon size={15} />
          Consultar
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        background: "linear-gradient(180deg, #f5f5f7 0%, #fff 60%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "10%", left: "50%",
          transform: "translateX(-50%)",
          width: "700px", height: "700px",
          background: `radial-gradient(ellipse at center, ${ACCENT}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <FadeIn delay={0}>
          <p style={{
            fontSize: "13px", fontWeight: 600, color: ACCENT,
            letterSpacing: "0.14em", textTransform: "uppercase",
            marginBottom: "20px",
          }}>
            Stock disponible · {products.length} equipos
          </p>
        </FadeIn>

        <FadeIn delay={80}>
          <h1 style={{
            fontSize: "clamp(52px, 8vw, 88px)",
            fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
            color: "#1d1d1f", marginBottom: "24px",
          }}>
            iPhones<br />
            <span style={{
              background: `linear-gradient(135deg, ${ACCENT}, #2d7a60)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              certificados.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={160}>
          <p style={{
            fontSize: "clamp(17px, 2.5vw, 21px)", color: "#6e6e73",
            lineHeight: 1.6, maxWidth: "500px", marginBottom: "40px",
          }}>
            Equipos seleccionados, revisados y listos para usar.<br />Precio justo, sin sorpresas.
          </p>
        </FadeIn>

        <FadeIn delay={240}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="#stock"
              style={{
                background: "#1d1d1f", color: "white",
                padding: "14px 32px", borderRadius: "980px",
                fontSize: "16px", fontWeight: 500, textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Ver stock disponible
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank" rel="noreferrer"
              style={{
                background: "white", color: "#1d1d1f",
                border: "1.5px solid rgba(0,0,0,0.12)",
                padding: "14px 32px", borderRadius: "980px",
                fontSize: "16px", fontWeight: 500, textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f7"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              Hacer una consulta
            </a>
          </div>
        </FadeIn>

        <div style={{
          position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)",
          width: "1px", height: "40px",
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.2))",
        }} />
      </section>

      {/* Features */}
      <section style={{ background: "#f5f5f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {[
            { Icon: CheckIcon,   title: "Revisados",          desc: "Cada equipo pasa por una inspección técnica completa antes de la venta." },
            { Icon: BatteryIcon, title: "Batería verificada", desc: "Conocés el estado real de la batería antes de comprar." },
            { Icon: ChatIcon,    title: "Atención directa",   desc: "Consultá por WhatsApp y te respondemos al instante." },
            { Icon: BoxIcon,     title: "Listo para usar",    desc: "Sin activaciones pendientes, libre y desbloqueado." },
          ].map(({ Icon, title, desc }) => (
            <RevealCard key={title}>
              <div style={{
                background: "white", borderRadius: "20px", padding: "28px 24px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.05)", height: "100%", boxSizing: "border-box",
              }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: "#f0f8f5", display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px",
                }}>
                  <Icon size={22} color={ACCENT} />
                </div>
                <p style={{ fontSize: "16px", fontWeight: 600, color: "#1d1d1f", marginBottom: "6px" }}>{title}</p>
                <p style={{ fontSize: "14px", color: "#6e6e73", lineHeight: 1.6 }}>{desc}</p>
              </div>
            </RevealCard>
          ))}
        </div>
      </section>

      {/* Stock */}
      <section id="stock" style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px 100px" }}>
        <div style={{ marginBottom: "48px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "8px" }}>
            Equipos disponibles
          </h2>
          <p style={{ fontSize: "17px", color: "#6e6e73" }}>
            {filtered.length} equipo{filtered.length !== 1 ? "s" : ""} en stock
          </p>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ position: "relative", maxWidth: "480px", margin: "0 auto 20px" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "16px", pointerEvents: "none" }}>⌕</span>
            <input
              type="text"
              placeholder="Buscar modelo, color, capacidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#f5f5f7", border: "none",
                borderRadius: "980px", padding: "13px 20px 13px 40px",
                fontSize: "15px", color: "#1d1d1f", outline: "none",
              }}
            />
          </div>

          {models.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "10px" }}>
              <Chip active={!modelFilter} onClick={() => setModelFilter("")}>Todos</Chip>
              {models.map((m) => (
                <Chip key={m} active={modelFilter === m} onClick={() => setModelFilter(modelFilter === m ? "" : m)}>{m}</Chip>
              ))}
            </div>
          )}

          {storages.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              <Chip active={!storageFilter} onClick={() => setStorageFilter("")}>Todas las capacidades</Chip>
              {storages.map((s) => (
                <Chip key={s} active={storageFilter === s} onClick={() => setStorageFilter(storageFilter === s ? "" : s)}>{s}</Chip>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                background: "#f5f5f7", borderRadius: "24px", height: "360px",
                animation: "pulse 1.8s ease-in-out infinite",
                animationDelay: `${i * 120}ms`,
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#6e6e73" }}>
            <p style={{ fontSize: "52px", marginBottom: "16px" }}>📭</p>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>Sin resultados</p>
            <p style={{ fontSize: "15px", marginBottom: "20px" }}>Probá con otros filtros o consultanos.</p>
            <button
              onClick={() => { setSearch(""); setModelFilter(""); setStorageFilter(""); }}
              style={{ background: "#1d1d1f", color: "white", border: "none", borderRadius: "980px", padding: "10px 24px", fontSize: "14px", cursor: "pointer" }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {filtered.map((product, i) => (
              <RevealCard key={product.id} delay={i * 30}>
                <ProductCard product={product} exchange={exchange} />
              </RevealCard>
            ))}
          </div>
        )}
      </section>

      {/* CTA banner */}
      <section style={{ background: "#1d1d1f", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.03em", color: "white", marginBottom: "12px" }}>
          ¿No encontrás lo que buscás?
        </h2>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.55)", marginBottom: "32px" }}>
          Escribinos y te conseguimos el equipo ideal.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank" rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "#25d366", color: "white",
            padding: "16px 36px", borderRadius: "980px",
            fontSize: "16px", fontWeight: 600, textDecoration: "none",
            boxShadow: "0 8px 32px rgba(37,211,102,0.35)",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <WhatsAppIcon size={20} />
          Escribinos por WhatsApp
        </a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "40px 24px", textAlign: "center", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
          <XyloLogo size={24} />
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.3px" }}>Xylo</span>
        </div>
        <p style={{ fontSize: "13px", color: "#aaa" }}>
          © {new Date().getFullYear()} Xylo — Todos los derechos reservados
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#1d1d1f" : "#f5f5f7",
        color: active ? "white" : "#1d1d1f",
        border: "none", borderRadius: "980px",
        padding: "8px 18px", fontSize: "14px", fontWeight: 500,
        cursor: "pointer", transition: "all 0.18s ease", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#e8e8ed"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "#f5f5f7"; }}
    >
      {children}
    </button>
  );
}

function ProductCard({ product, exchange }) {
  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars)).toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  const batteryColor =
    !product.battery_health ? "#aaa" :
    product.battery_health >= 85 ? "#34c759" :
    product.battery_health >= 70 ? "#ff9f0a" : "#ff3b30";

  return (
    <Link
      to={`/producto/${product.id}`}
      style={{
        display: "flex", flexDirection: "column",
        background: "#f5f5f7", borderRadius: "24px",
        textDecoration: "none", color: "inherit",
        overflow: "hidden",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        width: "100%", aspectRatio: "4/3",
        background: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <PhoneIcon size={56} color="#c8c8cc" />
        )}
      </div>

      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <p style={{ fontSize: "17px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.3px", marginBottom: "3px" }}>
            {product.model}
          </p>
          <p style={{ fontSize: "14px", color: "#6e6e73" }}>
            {[product.storage, product.color].filter(Boolean).join(" · ")}
          </p>
        </div>

        {product.battery_health && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "3px", background: "rgba(0,0,0,0.08)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "2px" }} />
            </div>
            <span style={{ fontSize: "12px", color: batteryColor, fontWeight: 600, minWidth: "32px" }}>
              {product.battery_health}%
            </span>
          </div>
        )}

        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.5px", lineHeight: 1 }}>
              USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
            </p>
            {ars && <p style={{ fontSize: "13px", color: "#6e6e73", marginTop: "2px" }}>ARS {ars}</p>}
          </div>
          <div style={{ background: ACCENT, color: "white", borderRadius: "980px", padding: "6px 14px", fontSize: "13px", fontWeight: 500 }}>
            Ver
          </div>
        </div>
      </div>
    </Link>
  );
}

function FadeIn({ children, delay = 0 }) {
  return (
    <div style={{ animation: `fadeUp 0.7s ease both`, animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function RevealCard({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}
