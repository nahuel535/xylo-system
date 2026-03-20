import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight, ArrowRight } from "lucide-react";
import api from "../services/api";
import { XyloLogo, WhatsAppIcon } from "../components/Icons";

const WHATSAPP = "5493512345678";
const ACCENT = "#00C896";

function waLink(msg = "") {
  const text = msg ? `?text=${encodeURIComponent(msg)}` : "";
  return `https://wa.me/${WHATSAPP}${text}`;
}

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

// ─────────────────────────────────────────────────────────────────────────────
//  Navbar
// ─────────────────────────────────────────────────────────────────────────────
function Navbar({ scrolled }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: "60px",
        background: scrolled ? "rgba(255,255,255,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 48px)",
        transition: "background 0.4s, border-color 0.4s",
        fontFamily: T.body,
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
        <XyloLogo size={22} />
        <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.4px", color: T.text }}>
          Xylo
        </span>
      </Link>

      <WhatsAppButton size="sm">Consultar</WhatsAppButton>
    </motion.nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  iPhone Mockup
// ─────────────────────────────────────────────────────────────────────────────
function IPhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginTop: "64px", position: "relative", zIndex: 1 }}
    >
      {/* Glow underneath */}
      <div style={{
        position: "absolute", bottom: "-20px", left: "50%",
        transform: "translateX(-50%)",
        width: "180px", height: "48px",
        background: `radial-gradient(ellipse, rgba(0,200,150,0.28) 0%, transparent 70%)`,
        filter: "blur(14px)",
        animation: "glow-pulse 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Phone body */}
      <div style={{
        width: "162px", height: "304px",
        borderRadius: "36px",
        background: "linear-gradient(160deg, #f4f4f4 0%, #e6e6e6 100%)",
        border: "1px solid rgba(0,0,0,0.09)",
        boxShadow: [
          "inset 0 0 0 1px rgba(255,255,255,0.7)",
          "0 2px 0 rgba(0,0,0,0.04)",
          "0 40px 100px rgba(0,0,0,0.13)",
          "0 8px 24px rgba(0,0,0,0.07)",
        ].join(", "),
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Side power button */}
        <div style={{
          position: "absolute", right: "-2px", top: "80px",
          width: "3px", height: "44px",
          background: "linear-gradient(to bottom, #ccc, #bbb)",
          borderRadius: "0 2px 2px 0",
        }} />
        {/* Volume up */}
        <div style={{
          position: "absolute", left: "-2px", top: "64px",
          width: "3px", height: "28px",
          background: "linear-gradient(to bottom, #ccc, #bbb)",
          borderRadius: "2px 0 0 2px",
        }} />
        {/* Volume down */}
        <div style={{
          position: "absolute", left: "-2px", top: "100px",
          width: "3px", height: "28px",
          background: "linear-gradient(to bottom, #ccc, #bbb)",
          borderRadius: "2px 0 0 2px",
        }} />

        {/* Screen */}
        <div style={{
          position: "absolute",
          top: "7px", left: "7px", right: "7px", bottom: "7px",
          borderRadius: "29px",
          background: "#080808",
          overflow: "hidden",
        }}>
          {/* Dynamic Island */}
          <div style={{
            position: "absolute", top: "11px", left: "50%",
            transform: "translateX(-50%)",
            width: "64px", height: "20px",
            background: "#000", borderRadius: "11px",
            zIndex: 2,
          }} />

          {/* Screen glow */}
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse at 50% 75%, rgba(0,200,150,0.22) 0%, transparent 62%)`,
          }} />

          {/* Product info card */}
          <div style={{
            position: "absolute", bottom: "20px",
            left: "10px", right: "10px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "14px",
            padding: "12px 14px",
            backdropFilter: "blur(8px)",
          }}>
            <p style={{
              fontSize: "7.5px", color: "rgba(255,255,255,0.38)",
              letterSpacing: "0.07em", marginBottom: "5px",
              fontFamily: T.body,
            }}>
              CERTIFICADO · COMO NUEVO
            </p>
            <p style={{
              fontSize: "14px", fontWeight: 700, color: "#fff",
              letterSpacing: "-0.03em", lineHeight: 1,
              fontFamily: T.heading,
            }}>
              iPhone 15 Pro
            </p>
            <p style={{
              fontSize: "9px", color: "rgba(255,255,255,0.45)",
              marginTop: "3px", marginBottom: "10px",
              fontFamily: T.body,
            }}>
              256 GB · Natural Titanium
            </p>
            <div style={{
              height: "1.5px",
              background: `linear-gradient(90deg, ${ACCENT}, #00e0aa)`,
              borderRadius: "1px",
            }} />
          </div>

          {/* Home indicator */}
          <div style={{
            position: "absolute", bottom: "7px", left: "50%",
            transform: "translateX(-50%)",
            width: "56px", height: "4px",
            background: "rgba(255,255,255,0.18)",
            borderRadius: "2px",
          }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Hero
// ─────────────────────────────────────────────────────────────────────────────
function Hero({ count }) {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center",
      padding: "100px clamp(20px, 6vw, 80px) 120px",
      background: T.bg,
      position: "relative", overflow: "hidden",
      fontFamily: T.body,
    }}>
      {/* Soft teal glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(900px, 120vw)", height: "600px",
        background: "radial-gradient(ellipse at center, rgba(0,200,150,0.10) 0%, rgba(0,200,150,0.04) 45%, transparent 70%)",
        pointerEvents: "none",
        animation: "glow-pulse 5s ease-in-out infinite",
      }} />

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        pointerEvents: "none",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
      }} />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: T.accentLight,
          border: `1px solid ${T.accentBorder}`,
          borderRadius: "980px", padding: "6px 16px",
          marginBottom: "36px", position: "relative",
        }}
      >
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: "13px", fontWeight: 500, color: ACCENT, letterSpacing: "0.04em" }}>
          {count > 0 ? `${count} equipos en stock` : "Stock disponible"}
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{
          fontFamily: T.heading,
          fontSize: "clamp(52px, 8.5vw, 104px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 0.92,
          color: T.text,
          marginBottom: "28px",
          maxWidth: "820px",
        }}
      >
        iPhones<br />
        <em style={{
          fontStyle: "italic",
          background: `linear-gradient(135deg, ${ACCENT} 0%, #00e0aa 60%, ${ACCENT} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          certificados.
        </em>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        style={{
          fontSize: "clamp(16px, 2vw, 20px)",
          color: T.textSec, lineHeight: 1.7,
          maxWidth: "460px", marginBottom: "52px",
        }}
      >
        Equipos seleccionados, revisados y listos para usar.
        <br />Precio justo, sin sorpresas.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}
      >
        <a
          href="#stock"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: T.text, color: "#fff",
            padding: "14px 28px", borderRadius: "980px",
            fontSize: "15px", fontWeight: 600, textDecoration: "none",
            transition: "opacity 0.2s", cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          Ver stock
          <ArrowRight size={15} strokeWidth={2.5} />
        </a>
        <a
          href={waLink()}
          target="_blank" rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(0,0,0,0.04)",
            border: `1px solid ${T.border}`,
            color: T.text,
            padding: "14px 28px", borderRadius: "980px",
            fontSize: "15px", fontWeight: 500, textDecoration: "none",
            transition: "background 0.2s", cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.07)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
        >
          <WhatsAppIcon size={15} />
          Consultar por WhatsApp
        </a>
      </motion.div>

      <IPhoneMockup />

      {/* Scroll line */}
      <div style={{
        position: "absolute", bottom: "40px", left: "50%",
        transform: "translateX(-50%)", opacity: 0.25,
        overflow: "hidden", height: "48px", width: "1px",
      }}>
        <div style={{
          width: "1px", height: "100%",
          background: `linear-gradient(to bottom, transparent, ${ACCENT})`,
          animation: "scroll-line 2s ease-in-out infinite",
        }} />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Features — Apple-style clean grid
// ─────────────────────────────────────────────────────────────────────────────
// ── Feature card data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    num: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Revisados y certificados",
    desc: "Cada equipo pasa por una inspección técnica completa antes de publicarse. Sabés exactamente qué comprás.",
  },
  {
    num: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="18" height="11" rx="2" />
        <path d="M22 11v2" strokeWidth="2.2" />
        <rect x="5.5" y="10.5" width="4" height="3" rx="0.5" fill="currentColor" stroke="none" />
        <rect x="11.5" y="10.5" width="2.5" height="3" rx="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: "Batería verificada",
    desc: "El porcentaje real de salud de batería es visible antes de comprar. Sin sorpresas.",
  },
  {
    num: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <circle cx="12" cy="12" r="5" />
      </svg>
    ),
    title: "Precio transparente",
    desc: "USD y ARS siempre visibles. Sin cargos ocultos, sin letra chica, sin sorpresas de último momento.",
  },
  {
    num: "04",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Atención directa",
    desc: "Respondemos por WhatsApp al instante. Sin formularios, sin bots, sin tiempos de espera.",
  },
  {
    num: "05",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.4" />
      </svg>
    ),
    title: "Listo para usar",
    desc: "Desbloqueado para cualquier operadora. Sin activaciones ni restricciones pendientes.",
  },
  {
    num: "06",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    title: "Sin letra chica",
    desc: "Lo que ves es lo que recibís. Condición, batería y especificaciones reales, siempre.",
  },
];

// ── Framer Motion variants ───────────────────────────────────────────────────
const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.18 },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 18, delay: 0.14 },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: 0.22 },
  },
};

// Stock grid stagger
const stockGridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const stockCardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Feature card component ───────────────────────────────────────────────────
function FeatureCard({ feature }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={hovered ? { y: -6 } : { y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{
        background: "#fff",
        borderRadius: "18px",
        border: `1px solid ${hovered ? "rgba(0,200,150,0.22)" : T.border}`,
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,200,150,0.07)"
          : "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)",
        overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.25s, box-shadow 0.25s",
        position: "relative",
      }}
    >
      {/* Accent top bar — draws in on entrance */}
      <motion.div
        variants={lineVariants}
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "2.5px",
          background: `linear-gradient(90deg, ${ACCENT}, #00e0aa)`,
          transformOrigin: "left",
          opacity: hovered ? 1 : 0.55,
          transition: "opacity 0.25s",
        }}
      />

      <div style={{ padding: "32px 28px 30px" }}>
        {/* Number + icon row */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}>
          {/* Icon */}
          <motion.div
            variants={iconVariants}
            style={{
              width: "42px", height: "42px",
              background: hovered ? "rgba(0,200,150,0.12)" : "rgba(0,200,150,0.07)",
              borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: ACCENT,
              transition: "background 0.25s",
              flexShrink: 0,
            }}
          >
            {feature.icon}
          </motion.div>

          {/* Number */}
          <span style={{
            fontSize: "11px", fontWeight: 500,
            color: T.textMuted,
            letterSpacing: "0.06em",
            lineHeight: 1,
            paddingTop: "2px",
          }}>
            {feature.num}
          </span>
        </div>

        {/* Text */}
        <motion.div variants={textVariants}>
          <p style={{
            fontSize: "14.5px", fontWeight: 600,
            color: T.text, letterSpacing: "-0.015em",
            marginBottom: "9px", lineHeight: 1.3,
          }}>
            {feature.title}
          </p>
          <p style={{
            fontSize: "13px", color: T.textSec,
            lineHeight: 1.7,
          }}>
            {feature.desc}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── FeatureGrid section ──────────────────────────────────────────────────────
function FeatureGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section style={{
      background: "#f8f8f6",
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      padding: "96px clamp(20px, 6vw, 80px) 104px",
      fontFamily: T.body,
    }}>
      <div style={{ maxWidth: "1060px", margin: "0 auto" }}>

        {/* Section header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "56px" }}
        >
          <p style={{
            fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", color: ACCENT, marginBottom: "14px",
          }}>
            Por qué Xylo
          </p>
          <h2 style={{
            fontFamily: T.heading,
            fontSize: "clamp(28px, 3.8vw, 40px)",
            fontWeight: 600, letterSpacing: "-0.025em",
            color: T.text, lineHeight: 1.12,
            maxWidth: "460px",
          }}>
            Lo que diferencia{" "}
            <em style={{ fontStyle: "italic", color: T.textSec, fontWeight: 400 }}>
              cada equipo que vendemos.
            </em>
          </h2>
        </motion.div>

        {/* Cards grid with orchestrated stagger */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="feat-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.num} feature={f} />
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .feat-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 960px) and (min-width: 701px) {
          .feat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Filter Chip
// ─────────────────────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      style={{
        background: active ? ACCENT : "rgba(0,0,0,0.04)",
        border: `1px solid ${active ? ACCENT : T.border}`,
        color: active ? "#fff" : T.textSec,
        borderRadius: "980px",
        padding: "7px 18px",
        fontSize: "13px", fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
        fontFamily: T.body,
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(0,0,0,0.07)";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.14)";
          e.currentTarget.style.color = T.text;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(0,0,0,0.04)";
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.color = T.textSec;
        }
      }}
    >
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Product Card
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, exchange }) {
  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars))
        .toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  const batteryColor =
    !product.battery_health ? T.textMuted :
    product.battery_health >= 85 ? "#16a34a" :
    product.battery_health >= 70 ? "#d97706" : "#dc2626";

  return (
    <Link to={`/producto/${product.id}`} style={{ textDecoration: "none", color: "inherit", height: "100%", display: "block" }}>
      <motion.div
        whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(0,0,0,0.10)", borderColor: "rgba(0,0,0,0.14)" }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          display: "flex", flexDirection: "column",
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: "20px",
          overflow: "hidden",
          height: "100%", cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          fontFamily: T.body,
        }}
      >
        {/* Image */}
        <div style={{
          width: "100%", aspectRatio: "4/3",
          background: T.surface,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          borderBottom: `1px solid ${T.border}`,
          position: "relative",
        }}>
          {product.photo_url ? (
            <img src={product.photo_url} alt={product.model}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "10px",
              background: "linear-gradient(145deg, #f5f5f3 0%, #ebebea 100%)",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span style={{
                fontSize: "11.5px", fontWeight: 500,
                color: T.textMuted, letterSpacing: "-0.01em",
              }}>
                {product.model || "iPhone"}
              </span>
            </div>
          )}

          {/* Condition badge */}
          {product.condition && (
            <div style={{
              position: "absolute", top: "10px", left: "10px",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: "980px",
              padding: "3px 10px",
              fontSize: "10.5px", fontWeight: 600,
              color: T.text, letterSpacing: "0.01em",
            }}>
              {product.condition}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: T.text, letterSpacing: "-0.02em", marginBottom: "3px" }}>
              {product.model}
            </p>
            <p style={{ fontSize: "13px", color: T.textSec }}>
              {[product.storage, product.color].filter(Boolean).join(" · ")}
            </p>
          </div>

          {product.battery_health && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, height: "3px", background: "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "2px" }} />
              </div>
              <span style={{ fontSize: "11px", color: batteryColor, fontWeight: 600, minWidth: "32px", textAlign: "right" }}>
                {product.battery_health}%
              </span>
            </div>
          )}

          <div style={{
            marginTop: "auto", paddingTop: "14px",
            borderTop: `1px solid ${T.border}`,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
              </p>
              {ars && <p style={{ fontSize: "12px", color: T.textMuted, marginTop: "3px" }}>ARS {ars}</p>}
            </div>
            <div style={{
              width: "32px", height: "32px",
              background: T.accentLight,
              border: `1px solid ${T.accentBorder}`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronRight size={14} color={ACCENT} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton Card
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", overflow: "hidden" }}>
      <div className="skeleton" style={{ width: "100%", aspectRatio: "4/3" }} />
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div className="skeleton" style={{ height: "16px", width: "65%", borderRadius: "8px" }} />
        <div className="skeleton" style={{ height: "13px", width: "45%", borderRadius: "8px" }} />
        <div className="skeleton" style={{ height: "3px", width: "100%", borderRadius: "2px", marginTop: "8px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <div className="skeleton" style={{ height: "20px", width: "80px", borderRadius: "8px" }} />
          <div className="skeleton" style={{ height: "32px", width: "32px", borderRadius: "50%" }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CTA Banner
// ─────────────────────────────────────────────────────────────────────────────
function CTABanner() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section style={{
      background: "#0a0a0a",
      padding: "120px clamp(20px, 6vw, 80px)",
      textAlign: "center",
      position: "relative", overflow: "hidden",
      fontFamily: T.body,
    }}>
      {/* Teal glow — more visible on dark */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "700px", height: "500px",
        background: "radial-gradient(ellipse, rgba(0,200,150,0.14) 0%, transparent 68%)",
        pointerEvents: "none",
        animation: "glow-pulse 4s ease-in-out infinite",
      }} />
      {/* Subtle top border in teal */}
      <div style={{
        position: "absolute", top: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "120px", height: "1px",
        background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
      }} />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ position: "relative" }}
      >
        <p style={{
          fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.15em",
          textTransform: "uppercase", color: ACCENT, marginBottom: "24px",
        }}>
          Contacto directo
        </p>
        <h2 style={{
          fontFamily: T.heading,
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 700, letterSpacing: "-0.04em",
          color: "#ffffff", lineHeight: 1.05, marginBottom: "16px",
        }}>
          ¿No encontrás<br />lo que buscás?
        </h2>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.48)", marginBottom: "48px", lineHeight: 1.6 }}>
          Escribinos y te conseguimos el equipo ideal.
        </p>
        <WhatsAppButton size="lg">Escribinos por WhatsApp</WhatsAppButton>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  WhatsApp Button
// ─────────────────────────────────────────────────────────────────────────────
function WhatsAppButton({ children, size = "md", message = "" }) {
  const padding = size === "lg" ? "16px 36px" : size === "sm" ? "7px 16px" : "13px 28px";
  const fontSize = size === "lg" ? "16px" : size === "sm" ? "14px" : "15px";
  const iconSize = size === "lg" ? 19 : 14;
  return (
    <motion.a
      href={waLink(message)}
      target="_blank" rel="noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "#25d366", color: "white",
        padding, borderRadius: "980px",
        fontSize, fontWeight: 600, textDecoration: "none",
        boxShadow: "0 4px 20px rgba(37,211,102,0.28)",
        cursor: "pointer", fontFamily: T.body,
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,211,102,0.38)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,0.28)"}
    >
      <WhatsAppIcon size={iconSize} />
      {children}
    </motion.a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Footer
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${T.border}`,
      padding: "40px clamp(20px, 6vw, 80px)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "16px",
      background: T.bg, fontFamily: T.body,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <XyloLogo size={20} />
        <span style={{ fontSize: "15px", fontWeight: 600, color: T.text, letterSpacing: "-0.3px" }}>Xylo</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <a
          href={waLink()}
          target="_blank" rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "13px", fontWeight: 500, color: T.textSec,
            textDecoration: "none", transition: "color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = T.text}
          onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
        >
          <WhatsAppIcon size={13} />
          WhatsApp
        </a>
        <p style={{ fontSize: "13px", color: T.textMuted }}>
          © {new Date().getFullYear()} Xylo
        </p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  StorePage
// ─────────────────────────────────────────────────────────────────────────────
export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [storageFilter, setStorageFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const stockHeaderRef = useRef(null);
  const stockHeaderInView = useInView(stockHeaderRef, { once: true, margin: "-60px" });

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

  const models = useMemo(
    () => [...new Set(products.map((p) => p.model).filter(Boolean))].sort(),
    [products]
  );
  const storages = useMemo(
    () => [...new Set(products.map((p) => p.storage).filter(Boolean))].sort(),
    [products]
  );
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = products.filter(
      (p) =>
        (!q || p.model?.toLowerCase().includes(q) || p.storage?.toLowerCase().includes(q) || p.color?.toLowerCase().includes(q)) &&
        (!modelFilter || p.model === modelFilter) &&
        (!storageFilter || p.storage === storageFilter)
    );
    if (sortBy === "price_asc")  result = [...result].sort((a, b) => Number(a.suggested_sale_price_usd) - Number(b.suggested_sale_price_usd));
    if (sortBy === "price_desc") result = [...result].sort((a, b) => Number(b.suggested_sale_price_usd) - Number(a.suggested_sale_price_usd));
    if (sortBy === "battery")    result = [...result].sort((a, b) => (b.battery_health || 0) - (a.battery_health || 0));
    return result;
  }, [products, search, modelFilter, storageFilter, sortBy]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, overflowX: "hidden" }}>
      <Navbar scrolled={scrolled} />
      <Hero count={products.length} />
      <FeatureGrid />

      {/* ── Stock ─────────────────────────────────────────────────── */}
      <section id="stock" style={{
        maxWidth: "1280px", margin: "0 auto",
        padding: "100px clamp(20px, 6vw, 80px) 120px",
        fontFamily: T.body,
      }}>
        {/* Header */}
        <motion.div
          ref={stockHeaderRef}
          initial={{ opacity: 0, y: 20 }}
          animate={stockHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "56px" }}
        >
          <p style={{
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: ACCENT, marginBottom: "16px",
          }}>
            Stock disponible
          </p>
          <h2 style={{
            fontFamily: T.heading,
            fontSize: "clamp(34px, 5vw, 52px)",
            fontWeight: 700, letterSpacing: "-0.04em", color: T.text,
            lineHeight: 1, marginBottom: "10px",
          }}>
            Equipos disponibles
          </h2>
          <p style={{ fontSize: "15px", color: T.textSec }}>
            {loading ? "Cargando..." : `${filtered.length} equipo${filtered.length !== 1 ? "s" : ""} en stock`}
          </p>
        </motion.div>

        {/* Filters */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ position: "relative", maxWidth: "480px", marginBottom: "20px" }}>
            <Search size={15} color={T.textMuted}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Buscar modelo, color, capacidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px", padding: "12px 40px 12px 42px",
                fontSize: "14px", color: T.text, outline: "none",
                transition: "border-color 0.2s, background 0.2s",
                fontFamily: T.body,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.borderAccent;
                e.currentTarget.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = T.surface;
              }}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: T.textMuted,
                  }}
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {models.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              <FilterChip active={!modelFilter} onClick={() => setModelFilter("")}>Todos</FilterChip>
              {models.map((m) => (
                <FilterChip key={m} active={modelFilter === m} onClick={() => setModelFilter(modelFilter === m ? "" : m)}>{m}</FilterChip>
              ))}
            </div>
          )}
          {storages.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <FilterChip active={!storageFilter} onClick={() => setStorageFilter("")}>Todas</FilterChip>
              {storages.map((s) => (
                <FilterChip key={s} active={storageFilter === s} onClick={() => setStorageFilter(storageFilter === s ? "" : s)}>{s}</FilterChip>
              ))}
            </div>
          )}

          {/* Sort row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            marginTop: "16px", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: T.textMuted, marginRight: "4px" }}>Ordenar:</span>
            {[
              { key: "", label: "Relevante" },
              { key: "price_asc",  label: "Menor precio" },
              { key: "price_desc", label: "Mayor precio" },
              { key: "battery",    label: "Mejor batería" },
            ].map(({ key, label }) => (
              <FilterChip key={key} active={sortBy === key} onClick={() => setSortBy(key)}>{label}</FilterChip>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px" }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ opacity: 0.15, marginBottom: "24px", display: "flex", justifyContent: "center" }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <p style={{ fontFamily: T.heading, fontSize: "24px", fontWeight: 600, color: T.text, marginBottom: "8px" }}>
              Sin resultados
            </p>
            <p style={{ fontSize: "15px", color: T.textSec, marginBottom: "28px" }}>
              Probá con otros filtros o consultanos directamente.
            </p>
            <button
              onClick={() => { setSearch(""); setModelFilter(""); setStorageFilter(""); }}
              style={{
                background: T.text, border: "none", color: "#fff",
                borderRadius: "980px", padding: "10px 24px",
                fontSize: "14px", cursor: "pointer", fontFamily: T.body,
              }}
            >
              Limpiar filtros
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            variants={stockGridVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px" }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <motion.div key={product.id} layout
                  variants={stockCardVariants}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.28 }}>
                  <ProductCard product={product} exchange={exchange} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <CTABanner />
      <Footer />
    </div>
  );
}
