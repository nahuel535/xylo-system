import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { XyloLogo, WhatsAppIcon } from "../../components/public/Icons";

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
        background: scrolled ? "rgba(255,255,255,0.90)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.4s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <Link to="/store" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <XyloLogo size={22} />
          <span style={{
            fontSize: "17px", fontWeight: 700, letterSpacing: "-0.4px",
            color: scrolled ? "#1d1d1f" : "white",
            transition: "color 0.4s",
          }}>Xylo</span>
        </Link>

        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: scrolled ? ACCENT : "rgba(255,255,255,0.12)",
            border: scrolled ? "none" : "1px solid rgba(255,255,255,0.2)",
            color: "white",
            padding: "7px 16px", borderRadius: "980px",
            fontSize: "14px", fontWeight: 500, textDecoration: "none",
            transition: "all 0.3s", cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <WhatsAppIcon size={14} />
          Consultar
        </a>
      </nav>

      {/* Hero — Dark */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        background: "linear-gradient(155deg, #0d1512 0%, #0f1110 50%, #0a0d0c 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Orb verde */}
        <div style={{
          position: "absolute", top: "10%", left: "50%",
          transform: "translateX(-50%)",
          width: "900px", height: "700px",
          background: `radial-gradient(ellipse at center, ${ACCENT}1a 0%, ${ACCENT}08 40%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        {/* Grid decorativa */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(74,157,127,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,157,127,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          pointerEvents: "none",
        }} />

        <FadeIn delay={0}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(74,157,127,0.1)",
            border: "1px solid rgba(74,157,127,0.2)",
            borderRadius: "980px",
            padding: "6px 16px",
            marginBottom: "32px",
          }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: ACCENT,
              boxShadow: `0 0 8px ${ACCENT}`,
            }} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: ACCENT, letterSpacing: "0.05em" }}>
              {products.length} equipos en stock
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={80}>
          <h1 style={{
            fontSize: "clamp(56px, 9vw, 100px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: "white",
            marginBottom: "28px",
          }}>
            iPhones
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #2d8a65 60%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              certificados.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={160}>
          <p style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.65,
            maxWidth: "460px",
            marginBottom: "48px",
          }}>
            Equipos seleccionados, revisados y listos para usar.
            <br />Precio justo, sin sorpresas.
          </p>
        </FadeIn>

        <FadeIn delay={240}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="#stock"
              style={{
                background: "white", color: "#1d1d1f",
                padding: "14px 32px", borderRadius: "980px",
                fontSize: "15px", fontWeight: 600, textDecoration: "none",
                transition: "opacity 0.2s", cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Ver stock disponible
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "white",
                padding: "14px 28px", borderRadius: "980px",
                fontSize: "15px", fontWeight: 500, textDecoration: "none",
                backdropFilter: "blur(8px)",
                transition: "background 0.2s", cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
            >
              <WhatsAppIcon size={15} />
              Hacer una consulta
            </a>
          </div>
        </FadeIn>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: "40px", left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.28,
        }}>
          <div style={{
            width: "1px", height: "48px",
            background: "linear-gradient(to bottom, transparent, white)",
            animation: "scrollLine 2s ease-in-out infinite",
          }} />
        </div>
      </section>

      {/* Features — Bento */}
      <section style={{ background: "#f5f5f7", padding: "80px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          {/* Row 1: carta grande full width */}
          <RevealCard>
            <div style={{
              background: "#111",
              borderRadius: "24px",
              padding: "40px 44px",
              marginBottom: "16px",
              display: "flex", alignItems: "center", gap: "32px",
              overflow: "hidden", position: "relative",
            }}>
              <div style={{
                position: "absolute", right: "-80px", top: "-80px",
                width: "320px", height: "320px",
                background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 65%)`,
                pointerEvents: "none",
              }} />
              <div style={{
                flexShrink: 0,
                width: "52px", height: "52px",
                background: `${ACCENT}20`, borderRadius: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShieldCheckSVG />
              </div>
              <div>
                <p style={{ fontSize: "21px", fontWeight: 700, color: "white", marginBottom: "6px", letterSpacing: "-0.03em" }}>
                  Revisados y certificados
                </p>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.42)", lineHeight: 1.65, maxWidth: "480px" }}>
                  Cada equipo pasa por una inspección técnica completa antes de publicarse. Sabés exactamente qué comprás antes de decidir.
                </p>
              </div>
            </div>
          </RevealCard>

          {/* Row 2: 3 tarjetas */}
          <div className="bento-row">
            {[
              {
                icon: <BatterySVG />,
                title: "Batería verificada",
                desc: "El porcentaje real de batería es visible antes de comprar. Sin sorpresas.",
              },
              {
                icon: <ChatSVG />,
                title: "Atención directa",
                desc: "Respondemos por WhatsApp al instante. Sin formularios, sin esperas.",
              },
              {
                icon: <BoxSVG />,
                title: "Listo para usar",
                desc: "Sin activaciones pendientes, desbloqueado y disponible para cualquier operadora.",
              },
            ].map((f, i) => (
              <RevealCard key={f.title} delay={i * 60}>
                <div style={{
                  background: "white", borderRadius: "20px", padding: "28px 24px",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                  height: "100%", boxSizing: "border-box",
                }}>
                  <div style={{
                    width: "38px", height: "38px",
                    background: `${ACCENT}14`, borderRadius: "11px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "18px",
                  }}>
                    {f.icon}
                  </div>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#1d1d1f", marginBottom: "6px" }}>{f.title}</p>
                  <p style={{ fontSize: "14px", color: "#6e6e73", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* Stock */}
      <section id="stock" style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px 100px" }}>

        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "6px" }}>
            Equipos disponibles
          </h2>
          <p style={{ fontSize: "17px", color: "#6e6e73" }}>
            {filtered.length} equipo{filtered.length !== 1 ? "s" : ""} en stock
          </p>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ position: "relative", maxWidth: "480px", marginBottom: "20px" }}>
            <svg
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#999" }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar modelo, color, capacidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#f5f5f7",
                border: "1.5px solid transparent",
                borderRadius: "12px", padding: "12px 20px 12px 42px",
                fontSize: "15px", color: "#1d1d1f", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = ACCENT}
              onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
            />
          </div>

          {models.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              <Chip active={!modelFilter} onClick={() => setModelFilter("")}>Todos</Chip>
              {models.map((m) => (
                <Chip key={m} active={modelFilter === m} onClick={() => setModelFilter(modelFilter === m ? "" : m)}>{m}</Chip>
              ))}
            </div>
          )}

          {storages.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Chip active={!storageFilter} onClick={() => setStorageFilter("")}>Todas</Chip>
              {storages.map((s) => (
                <Chip key={s} active={storageFilter === s} onClick={() => setStorageFilter(storageFilter === s ? "" : s)}>{s}</Chip>
              ))}
            </div>
          )}
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                background: "#f5f5f7", borderRadius: "24px", height: "380px",
                animation: "pulse 1.8s ease-in-out infinite",
                animationDelay: `${i * 100}ms`,
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#6e6e73" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", opacity: 0.3 }}>
              <InboxSVG />
            </div>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>Sin resultados</p>
            <p style={{ fontSize: "15px", marginBottom: "24px" }}>Probá con otros filtros o consultanos directamente.</p>
            <button
              onClick={() => { setSearch(""); setModelFilter(""); setStorageFilter(""); }}
              style={{
                background: "#1d1d1f", color: "white", border: "none",
                borderRadius: "980px", padding: "11px 26px",
                fontSize: "14px", cursor: "pointer",
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {filtered.map((product, i) => (
              <RevealCard key={product.id} delay={i * 40}>
                <ProductCard product={product} exchange={exchange} />
              </RevealCard>
            ))}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section style={{
        background: "#0a0f0d",
        padding: "88px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "640px", height: "320px",
          background: `radial-gradient(ellipse, ${ACCENT}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.03em", color: "white", marginBottom: "12px", position: "relative" }}>
          ¿No encontrás lo que buscás?
        </h2>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.4)", marginBottom: "36px", position: "relative" }}>
          Escribinos y te conseguimos el equipo ideal.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "#25d366", color: "white",
            padding: "16px 36px", borderRadius: "980px",
            fontSize: "16px", fontWeight: 600, textDecoration: "none",
            boxShadow: "0 8px 40px rgba(37,211,102,0.28)",
            transition: "opacity 0.2s", position: "relative", cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
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
        <p style={{ fontSize: "13px", color: "#b0b0b0" }}>
          © {new Date().getFullYear()} Xylo — Todos los derechos reservados
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.65; }
        }
        @keyframes scrollLine {
          0%   { transform: scaleY(0); transform-origin: top; opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: scaleY(1); transform-origin: top; opacity: 0; }
        }
        * { -webkit-font-smoothing: antialiased; }
        .bento-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) {
          .bento-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          nav { padding: 0 16px !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Chip filtro ── */
function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#1d1d1f" : "#f5f5f7",
        color: active ? "white" : "#1d1d1f",
        border: active ? "none" : "1.5px solid transparent",
        borderRadius: "980px",
        padding: "8px 18px", fontSize: "14px", fontWeight: 500,
        cursor: "pointer", transition: "all 0.18s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#e8e8ed"; e.currentTarget.style.borderColor = "transparent"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "#f5f5f7"; } }}
    >
      {children}
    </button>
  );
}

/* ── Tarjeta de producto ── */
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
      to={`/store/${product.id}`}
      style={{
        display: "flex", flexDirection: "column",
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "20px",
        textDecoration: "none", color: "inherit",
        overflow: "hidden",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
        height: "100%",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.10)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Imagen */}
      <div style={{
        width: "100%", aspectRatio: "4/3",
        background: "#f5f5f7",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.model}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <PhoneSVG />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <p style={{ fontSize: "17px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.3px", marginBottom: "3px" }}>
            {product.model}
          </p>
          <p style={{ fontSize: "14px", color: "#6e6e73" }}>
            {[product.storage, product.color].filter(Boolean).join(" · ")}
          </p>
        </div>

        {product.battery_health && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, height: "4px", background: "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "2px" }} />
            </div>
            <span style={{ fontSize: "12px", color: batteryColor, fontWeight: 600, minWidth: "34px", textAlign: "right" }}>
              {product.battery_health}%
            </span>
          </div>
        )}

        <div style={{
          marginTop: "auto", paddingTop: "14px",
          borderTop: "1px solid rgba(0,0,0,0.05)",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.5px", lineHeight: 1 }}>
              USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
            </p>
            {ars && (
              <p style={{ fontSize: "13px", color: "#6e6e73", marginTop: "3px" }}>ARS {ars}</p>
            )}
          </div>
          <div style={{
            width: "32px", height: "32px",
            background: "#f5f5f7", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Animación entrada ── */
function FadeIn({ children, delay = 0 }) {
  return (
    <div style={{ animation: `fadeUp 0.65s ease both`, animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Reveal con IntersectionObserver ── */
function RevealCard({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

/* ── SVG Icons ── */
function ShieldCheckSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function BatterySVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <line x1="22" y1="11" x2="22" y2="13" />
      <line x1="6" y1="11" x2="6" y2="13" />
    </svg>
  );
}

function ChatSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BoxSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function PhoneSVG() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c8c8cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <circle cx="12" cy="17" r="1" fill="#c8c8cc" stroke="none" />
    </svg>
  );
}

function InboxSVG() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#c8c8cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
