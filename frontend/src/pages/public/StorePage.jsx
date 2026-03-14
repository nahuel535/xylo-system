import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { XyloLogo, WhatsAppIcon } from "../../components/public/Icons";

const WHATSAPP = "5493512345678"; // reemplazá con el número real

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [storageFilter, setStorageFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
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

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const models = useMemo(() => [...new Set(products.map((p) => p.model).filter(Boolean))].sort(), [products]);
  const storages = useMemo(() => [...new Set(products.map((p) => p.storage).filter(Boolean))].sort(), [products]);
  const colors = useMemo(() => [...new Set(products.map((p) => p.color).filter(Boolean))].sort(), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) =>
      (!q || p.model?.toLowerCase().includes(q) || p.storage?.toLowerCase().includes(q) || p.color?.toLowerCase().includes(q)) &&
      (!modelFilter || p.model === modelFilter) &&
      (!storageFilter || p.storage === storageFilter) &&
      (!colorFilter || p.color === colorFilter)
    );
  }, [products, search, modelFilter, storageFilter, colorFilter]);

  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", background: "#f5f5f7", minHeight: "100vh", color: "#1d1d1f" }}>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.85)" : "rgba(245,245,247,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
        transition: "all 0.3s ease",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "52px",
      }}>
        <Link to="/store" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <XyloLogo size={24} />
          <span style={{ fontSize: "17px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.3px" }}>Xylo</span>
        </Link>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          style={{
            background: "#4a9d7f", color: "white", padding: "7px 16px",
            borderRadius: "980px", fontSize: "13px", fontWeight: 500,
            textDecoration: "none", transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#3d8a6e"}
        onMouseLeave={(e) => e.currentTarget.style.background = "#4a9d7f"}
        >
          Consultar
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: "120px", paddingBottom: "64px",
        textAlign: "center", maxWidth: "800px", margin: "0 auto", padding: "120px 24px 64px",
      }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#4a9d7f", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
          Stock disponible
        </p>
        <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 700, letterSpacing: "-1.5px", lineHeight: 1.05, color: "#1d1d1f", marginBottom: "16px" }}>
          iPhone.<br />
          <span style={{ color: "#4a9d7f" }}>Certificados.</span>
        </h1>
        <p style={{ fontSize: "17px", color: "#6e6e73", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 40px" }}>
          Equipos seleccionados, revisados y listos para usar. Precio justo, sin sorpresas.
        </p>
        <a href="#stock" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "#1d1d1f", color: "white", padding: "12px 28px",
          borderRadius: "980px", fontSize: "15px", fontWeight: 500,
          textDecoration: "none", transition: "opacity 0.2s",
        }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          Ver stock
        </a>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            { n: products.length, label: "Equipos disponibles" },
            { n: [...new Set(products.map((p) => p.model))].length, label: "Modelos distintos" },
            { n: "100%", label: "Revisados y certificados" },
          ].map(({ n, label }) => (
            <div key={label} style={{
              background: "white", borderRadius: "18px", padding: "28px 20px",
              textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <p style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-1px", color: "#1d1d1f", marginBottom: "4px" }}>{n}</p>
              <p style={{ fontSize: "13px", color: "#6e6e73" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Filtros */}
      <section id="stock" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
          <input
            type="text"
            placeholder="Buscar modelo, color, capacidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1 1 220px", background: "white", border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "12px", padding: "11px 16px", fontSize: "15px",
              color: "#1d1d1f", outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          />
          {[
            { value: modelFilter, setter: setModelFilter, options: models, placeholder: "Modelo" },
            { value: storageFilter, setter: setStorageFilter, options: storages, placeholder: "Capacidad" },
            { value: colorFilter, setter: setColorFilter, options: colors, placeholder: "Color" },
          ].map(({ value, setter, options, placeholder }) => (
            <select
              key={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              style={{
                flex: "1 1 140px", background: "white", border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "12px", padding: "11px 16px", fontSize: "15px",
                color: value ? "#1d1d1f" : "#6e6e73", outline: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)", cursor: "pointer",
              }}
            >
              <option value="">{placeholder}</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {(search || modelFilter || storageFilter || colorFilter) && (
            <button
              onClick={() => { setSearch(""); setModelFilter(""); setStorageFilter(""); setColorFilter(""); }}
              style={{
                background: "transparent", border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: "12px", padding: "11px 16px", fontSize: "14px",
                color: "#6e6e73", cursor: "pointer",
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        <p style={{ fontSize: "13px", color: "#6e6e73", marginBottom: "20px" }}>
          {filtered.length} equipo{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Grid de productos */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "white", borderRadius: "18px", height: "200px", opacity: 0.5 + i * 0.05 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6e6e73" }}>
            <p style={{ fontSize: "48px", marginBottom: "12px" }}>📭</p>
            <p style={{ fontSize: "19px", fontWeight: 600, color: "#1d1d1f", marginBottom: "6px" }}>Sin resultados</p>
            <p style={{ fontSize: "15px" }}>Probá con otros filtros.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} exchange={exchange} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.08)", padding: "40px 24px", textAlign: "center", marginTop: "80px" }}>
        <XyloLogo size={32} style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: "13px", color: "#6e6e73", marginBottom: "16px" }}>
          © {new Date().getFullYear()} Xylo — Todos los derechos reservados
        </p>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#25d366", color: "white", padding: "10px 22px",
            borderRadius: "980px", fontSize: "14px", fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <WhatsAppIcon /> Escribinos por WhatsApp
        </a>
      </footer>
    </div>
  );
}

function ProductCard({ product, exchange, index }) {
  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars)).toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  const batteryColor = product.battery_health >= 85 ? "#34c759" : product.battery_health >= 70 ? "#ff9f0a" : "#ff3b30";

  return (
    <Link
      to={`/store/${product.id}`}
      style={{
        display: "block", background: "white", borderRadius: "18px",
        padding: "24px", textDecoration: "none", color: "inherit",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "transform 0.2s, box-shadow 0.2s",
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${index * 40}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      {/* Icono iPhone */}
      <div style={{
        width: "48px", height: "48px", background: "#f5f5f7",
        borderRadius: "14px", display: "flex", alignItems: "center",
        justifyContent: "center", marginBottom: "16px", fontSize: "24px",
      }}>
        📱
      </div>

      <p style={{ fontSize: "17px", fontWeight: 600, color: "#1d1d1f", marginBottom: "4px", letterSpacing: "-0.3px" }}>
        {product.model}
      </p>
      <p style={{ fontSize: "14px", color: "#6e6e73", marginBottom: "16px" }}>
        {product.storage} · {product.color}
      </p>

      {product.battery_health && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
          <div style={{ flex: 1, height: "3px", background: "#f0f0f0", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "2px" }} />
          </div>
          <span style={{ fontSize: "12px", color: batteryColor, fontWeight: 600, minWidth: "36px" }}>
            {product.battery_health}%
          </span>
        </div>
      )}

      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.5px" }}>
            USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
          </p>
          {ars && (
            <p style={{ fontSize: "13px", color: "#6e6e73" }}>ARS {ars}</p>
          )}
        </div>
        <div style={{
          background: "#f5f5f7", borderRadius: "980px",
          padding: "6px 14px", fontSize: "13px", color: "#4a9d7f", fontWeight: 500,
        }}>
          Ver →
        </div>
      </div>
    </Link>
  );
}