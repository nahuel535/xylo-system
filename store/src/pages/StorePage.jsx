import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight, ArrowRight, LayoutGrid, List } from "lucide-react";
import api from "../services/api";
import { XyloLogo, WhatsAppIcon } from "../components/Icons";

const WHATSAPP = "5493518916482";
const ACCENT = "#00C896";
const NEW_DAYS = 7; // días para mostrar "Nuevo ingreso"

function waLink(msg = "") {
  const text = msg ? `?text=${encodeURIComponent(msg)}` : "";
  return `https://wa.me/${WHATSAPP}${text}`;
}

function isNew(createdAt) {
  const diff = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return diff <= NEW_DAYS;
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
//  Hero
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center",
      padding: "100px clamp(20px, 6vw, 80px) 100px",
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

      {/* Logo centrado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}
      >
        <XyloLogo size={120} />
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{
          fontFamily: T.heading,
          fontSize: "clamp(26px, 3.5vw, 44px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: T.text,
          marginBottom: "28px",
          whiteSpace: "nowrap",
        }}
      >
        iPhones{" "}
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
        style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginBottom: "56px" }}
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

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        style={{
          display: "flex", gap: "40px", flexWrap: "wrap", justifyContent: "center",
          padding: "20px 32px",
          background: "rgba(0,0,0,0.025)",
          border: `1px solid ${T.border}`,
          borderRadius: "20px",
        }}
      >
        {[
          { value: "100+", label: "Equipos vendidos" },
          { value: "100%", label: "Revisados y certificados" },
          { value: "0", label: "Sorpresas en el precio" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: "22px", fontWeight: 800, color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "12px", color: T.textMuted, marginTop: "4px" }}>{label}</p>
          </div>
        ))}
      </motion.div>

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
//  Cómo comprás
// ─────────────────────────────────────────────────────────────────────────────
function HowToBuy() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const steps = [
    {
      num: "01",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      title: "Elegís el equipo",
      desc: "Explorá el stock, filtrá por modelo, capacidad y precio. Toda la info está visible antes de consultar.",
      tag: "Vidriera",
    },
    {
      num: "02",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: "Consultás por WhatsApp",
      desc: "Te respondemos al instante. Coordinamos pago y entrega sin vueltas.",
      tag: "Atención directa",
    },
    {
      num: "03",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      title: "Recibís el equipo",
      desc: "Retiro en mano o envío. El equipo llega revisado, listo para usar desde el primer día.",
      tag: "Certificado",
    },
  ];

  return (
    <section style={{
      background: "#07080b",
      padding: "100px clamp(20px, 6vw, 80px) 110px",
      fontFamily: T.body,
      position: "relative",
      overflow: "hidden",
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
      `,
      backgroundSize: "64px 64px",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "40%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "900px", height: "500px",
        background: "radial-gradient(ellipse at center, rgba(0,200,150,0.07) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      {/* Top edge fade */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1040px", margin: "0 auto", position: "relative", zIndex: 1 }} ref={ref}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          style={{ textAlign: "center", marginBottom: "72px" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.18)",
            borderRadius: "980px", padding: "5px 14px",
            marginBottom: "24px",
          }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: ACCENT }} />
            <span style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
              textTransform: "uppercase", color: ACCENT,
            }}>
              Simple y directo
            </span>
          </div>
          <h2 style={{
            fontFamily: T.heading,
            fontSize: "clamp(34px, 4.5vw, 52px)",
            fontWeight: 700, letterSpacing: "-0.04em",
            color: "#f4f4f2", lineHeight: 1.05, margin: 0,
          }}>
            ¿Cómo comprás?
          </h2>
          <p style={{
            marginTop: "16px", fontSize: "16px",
            color: "rgba(255,255,255,0.38)", lineHeight: 1.6,
          }}>
            Tres pasos. Sin complicaciones.
          </p>
        </motion.div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }} className="how-grid">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              whileHover={{ y: -8, transition: { duration: 0.22, ease: "easeOut" } }}
              transition={{ duration: 0.65, delay: 0.1 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "relative",
                padding: "40px 32px 36px",
                background: "rgba(255,255,255,0.026)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "24px",
                overflow: "hidden",
                cursor: "default",
              }}
              className="how-card"
            >
              {/* Top shimmer line */}
              <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)",
                pointerEvents: "none",
              }} />

              {/* Corner accent glow */}
              <div style={{
                position: "absolute", top: "-40px", right: "-40px",
                width: "120px", height: "120px",
                background: "radial-gradient(circle, rgba(0,200,150,0.09) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Watermark number */}
              <div style={{
                position: "absolute", bottom: "-16px", right: "16px",
                fontSize: "130px", fontWeight: 800,
                color: "rgba(255,255,255,0.022)",
                fontFamily: T.heading,
                letterSpacing: "-0.06em",
                lineHeight: 1,
                pointerEvents: "none",
                userSelect: "none",
              }}>
                {step.num}
              </div>

              {/* Icon */}
              <div style={{
                width: "54px", height: "54px",
                background: "rgba(0,200,150,0.10)",
                border: "1px solid rgba(0,200,150,0.22)",
                borderRadius: "17px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: ACCENT,
                marginBottom: "28px",
                boxShadow: "0 0 28px rgba(0,200,150,0.14)",
              }}>
                {step.icon}
              </div>

              {/* Tag pill */}
              <div style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "980px",
                padding: "3px 10px",
                marginBottom: "14px",
              }}>
                <span style={{
                  fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
                }}>
                  {step.tag}
                </span>
              </div>

              {/* Title */}
              <p style={{
                fontFamily: T.heading,
                fontSize: "19px", fontWeight: 600,
                color: "#f0f0ee", letterSpacing: "-0.03em",
                marginBottom: "12px", lineHeight: 1.2,
              }}>
                {step.title}
              </p>

              {/* Desc */}
              <p style={{
                fontSize: "13.5px",
                color: "rgba(255,255,255,0.40)",
                lineHeight: 1.72,
              }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .how-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) and (min-width: 701px) {
          .how-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .how-card:hover {
          border-color: rgba(0,200,150,0.28) !important;
          box-shadow: 0 0 0 1px rgba(0,200,150,0.12), 0 28px 64px rgba(0,0,0,0.55) !important;
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Features
// ─────────────────────────────────────────────────────────────────────────────
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
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
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

const gridVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const cardVariants = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };
const lineVariants = { hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.18 } } };
const iconVariants = { hidden: { opacity: 0, scale: 0.6 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 18, delay: 0.14 } } };
const textVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: 0.22 } } };
const stockGridVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const stockCardVariants = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };

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
        background: "#fff", borderRadius: "18px",
        border: `1px solid ${hovered ? "rgba(0,200,150,0.22)" : T.border}`,
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,200,150,0.07)" : "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)",
        overflow: "hidden", cursor: "default",
        transition: "border-color 0.25s, box-shadow 0.25s", position: "relative",
      }}
    >
      <motion.div variants={lineVariants} style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2.5px",
        background: `linear-gradient(90deg, ${ACCENT}, #00e0aa)`,
        transformOrigin: "left", opacity: hovered ? 1 : 0.55, transition: "opacity 0.25s",
      }} />
      <div style={{ padding: "32px 28px 30px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <motion.div variants={iconVariants} style={{
            width: "42px", height: "42px",
            background: hovered ? "rgba(0,200,150,0.12)" : "rgba(0,200,150,0.07)",
            borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
            color: ACCENT, transition: "background 0.25s", flexShrink: 0,
          }}>
            {feature.icon}
          </motion.div>
          <span style={{ fontSize: "11px", fontWeight: 500, color: T.textMuted, letterSpacing: "0.06em", lineHeight: 1, paddingTop: "2px" }}>
            {feature.num}
          </span>
        </div>
        <motion.div variants={textVariants}>
          <p style={{ fontSize: "14.5px", fontWeight: 600, color: T.text, letterSpacing: "-0.015em", marginBottom: "9px", lineHeight: 1.3 }}>{feature.title}</p>
          <p style={{ fontSize: "13px", color: T.textSec, lineHeight: 1.7 }}>{feature.desc}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FeatureGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section style={{ background: "#f8f8f6", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "96px clamp(20px, 6vw, 80px) 104px", fontFamily: T.body }}>
      <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
        <motion.div ref={ref} initial={{ opacity: 0, y: 18 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ marginBottom: "56px" }}>
          <p style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, marginBottom: "14px" }}>Por qué Xylo</p>
          <h2 style={{ fontFamily: T.heading, fontSize: "clamp(28px, 3.8vw, 40px)", fontWeight: 600, letterSpacing: "-0.025em", color: T.text, lineHeight: 1.12, maxWidth: "460px" }}>
            Lo que diferencia{" "}<em style={{ fontStyle: "italic", color: T.textSec, fontWeight: 400 }}>cada equipo que vendemos.</em>
          </h2>
        </motion.div>
        <motion.div variants={gridVariants} initial="hidden" animate={isInView ? "visible" : "hidden"} className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {FEATURES.map((f) => <FeatureCard key={f.num} feature={f} />)}
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 700px) { .feat-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 960px) and (min-width: 701px) { .feat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  iPhone Catalog Data
// ─────────────────────────────────────────────────────────────────────────────
const CDN = "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is";
const IP = "?hei=556&fmt=png-alpha";

const IPHONE_CATALOG = [
  {
    id: "iphone11", generation: "iPhone 11", year: "2019", tag: "El inicio de una era",
    accent: "#4a9b6f",
    familyImg: null,
    models: [
      {
        name: "iPhone 11",
        img: `${CDN}/iphone11-yellow-select-2019${IP}`,
        display: '6.1" Liquid Retina HD (1792×828)',
        chip: "A13 Bionic",
        camera: "Dual 12MP — Gran angular + Ultra gran angular",
        battery: "Hasta 17 horas de video",
        storage: ["64GB", "128GB", "256GB"],
        colors: [
          { name: "Negro", hex: "#1c1c1e" }, { name: "Blanco", hex: "#f5f5f0" },
          { name: "Rojo", hex: "#bf0000" }, { name: "Verde", hex: "#4a7c59" },
          { name: "Amarillo", hex: "#d4b800" }, { name: "Violeta", hex: "#9b7fd4" },
        ],
        highlights: ["Face ID", "Modo Noche", "Video 4K 60fps", "Carga rápida"],
      },
      {
        name: "iPhone 11 Pro",
        img: `${CDN}/iphone-11-pro-silver-select-2019${IP}`,
        display: '5.8" Super Retina XDR OLED (2436×1125)',
        chip: "A13 Bionic",
        camera: "Triple 12MP — Gran angular + Ultra gran angular + Teleobjetivo 2×",
        battery: "Hasta 18 horas de video",
        storage: ["64GB", "256GB", "512GB"],
        colors: [
          { name: "Space Gray", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Verde Noche", hex: "#1c3a2a" },
        ],
        highlights: ["Face ID", "3× zoom óptico", "Pantalla OLED", "Video 4K 60fps"],
      },
      {
        name: "iPhone 11 Pro Max",
        img: `${CDN}/iphone-11-pro-max-silver-select-2019${IP}`,
        display: '6.5" Super Retina XDR OLED (2688×1242)',
        chip: "A13 Bionic",
        camera: "Triple 12MP — Gran angular + Ultra gran angular + Teleobjetivo 2×",
        battery: "Hasta 20 horas de video",
        storage: ["64GB", "256GB", "512GB"],
        colors: [
          { name: "Space Gray", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Verde Noche", hex: "#1c3a2a" },
        ],
        highlights: ["Pantalla 6.5\"", "3× zoom óptico", "20 horas batería", "OLED"],
      },
    ],
  },
  {
    id: "iphone12", generation: "iPhone 12", year: "2020", tag: "5G. Un salto enorme.",
    accent: "#0a84ff",
    familyImg: null,
    models: [
      {
        name: "iPhone 12",
        img: `${CDN}/iphone-12-blue-select-2020${IP}`,
        display: '6.1" Super Retina XDR OLED (2532×1170)',
        chip: "A14 Bionic",
        camera: "Dual 12MP — Gran angular + Ultra gran angular",
        battery: "Hasta 17 horas de video",
        storage: ["64GB", "128GB", "256GB"],
        colors: [
          { name: "Negro", hex: "#1c1c1e" }, { name: "Blanco", hex: "#f5f5f0" },
          { name: "Rojo", hex: "#bf0000" }, { name: "Verde", hex: "#4a7c59" },
          { name: "Azul", hex: "#2c5d9c" }, { name: "Violeta", hex: "#8e6acc" },
        ],
        highlights: ["5G", "MagSafe", "Diseño plano", "OLED", "Face ID"],
      },
      {
        name: "iPhone 12 Pro",
        img: `${CDN}/refurb-iphone-12-pro-graphite-2020${IP}`,
        display: '6.1" Super Retina XDR OLED (2532×1170)',
        chip: "A14 Bionic",
        camera: "Triple 12MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 2×",
        battery: "Hasta 17 horas de video",
        storage: ["128GB", "256GB", "512GB"],
        colors: [
          { name: "Grafito", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Azul Pacífico", hex: "#2c5d8e" },
        ],
        highlights: ["5G", "LiDAR Scanner", "ProRAW", "2× zoom óptico", "MagSafe"],
      },
      {
        name: "iPhone 12 Pro Max",
        img: `${CDN}/refurb-iphone-12-pro-max-graphite-2020${IP}`,
        display: '6.7" Super Retina XDR OLED (2778×1284)',
        chip: "A14 Bionic",
        camera: "Triple 12MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 2.5×",
        battery: "Hasta 20 horas de video",
        storage: ["128GB", "256GB", "512GB"],
        colors: [
          { name: "Grafito", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Azul Pacífico", hex: "#2c5d8e" },
        ],
        highlights: ["Pantalla 6.7\"", "2.5× zoom óptico", "LiDAR", "20h batería", "5G"],
      },
    ],
  },
  {
    id: "iphone13", generation: "iPhone 13", year: "2021", tag: "Tu película favorita. Por ti.",
    accent: "#ff375f",
    familyImg: null,
    models: [
      {
        name: "iPhone 13",
        img: `${CDN}/iphone-13-pink-select-2021${IP}`,
        display: '6.1" Super Retina XDR OLED (2532×1170)',
        chip: "A15 Bionic",
        camera: "Dual 12MP — Gran angular + Ultra gran angular con modo Cinematográfico",
        battery: "Hasta 19 horas de video",
        storage: ["128GB", "256GB", "512GB"],
        colors: [
          { name: "Medianoche", hex: "#1c1c2e" }, { name: "Blanco estelar", hex: "#f5f5f0" },
          { name: "Rojo", hex: "#bf0000" }, { name: "Azul", hex: "#2c5d9c" },
          { name: "Rosa", hex: "#e8a0b0" }, { name: "Verde", hex: "#4a7c59" },
        ],
        highlights: ["Modo Cinematográfico", "A15 Bionic", "Notch más pequeño", "19h batería"],
      },
      {
        name: "iPhone 13 Pro",
        img: `${CDN}/iphone-13-pro-graphite-select${IP}`,
        display: '6.1" Super Retina XDR ProMotion 120Hz (2532×1170)',
        chip: "A15 Bionic",
        camera: "Triple 12MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 3×",
        battery: "Hasta 22 horas de video",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        colors: [
          { name: "Grafito", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Azul Sierra", hex: "#4a7a9b" },
          { name: "Verde Alpino", hex: "#4a7c59" },
        ],
        highlights: ["ProMotion 120Hz", "ProRes Video", "LiDAR", "3× zoom óptico", "Macro"],
      },
      {
        name: "iPhone 13 Pro Max",
        img: `${CDN}/iphone-13-pro-max-graphite-select${IP}`,
        display: '6.7" Super Retina XDR ProMotion 120Hz (2778×1284)',
        chip: "A15 Bionic",
        camera: "Triple 12MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 3×",
        battery: "Hasta 28 horas de video",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        colors: [
          { name: "Grafito", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Azul Sierra", hex: "#4a7a9b" },
          { name: "Verde Alpino", hex: "#4a7c59" },
        ],
        highlights: ["Pantalla 6.7\"", "ProMotion 120Hz", "28h batería", "ProRes Video", "LiDAR"],
      },
    ],
  },
  {
    id: "iphone14", generation: "iPhone 14", year: "2022", tag: "Seguridad. Siempre.",
    accent: "#5e5ce6",
    familyImg: null,
    models: [
      {
        name: "iPhone 14",
        img: `${CDN}/iphone-14-purple-select-202209${IP}`,
        display: '6.1" Super Retina XDR OLED (2532×1170)',
        chip: "A15 Bionic",
        camera: "Dual 12MP — Gran angular + Ultra gran angular con Photonic Engine",
        battery: "Hasta 20 horas de video",
        storage: ["128GB", "256GB", "512GB"],
        colors: [
          { name: "Medianoche", hex: "#1c1c2e" }, { name: "Blanco estelar", hex: "#f5f5f0" },
          { name: "Rojo", hex: "#bf0000" }, { name: "Azul", hex: "#2c5d9c" },
          { name: "Violeta", hex: "#8e6acc" }, { name: "Amarillo", hex: "#d4b800" },
        ],
        highlights: ["SOS Emergencias vía satélite", "Detección de accidentes", "Photonic Engine", "Action Mode"],
      },
      {
        name: "iPhone 14 Pro",
        img: `${CDN}/iphone-14-pro-spaceblack-select${IP}`,
        display: '6.1" Super Retina XDR ProMotion 120Hz (2556×1179)',
        chip: "A16 Bionic",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 3×",
        battery: "Hasta 23 horas de video",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        colors: [
          { name: "Negro Espacial", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Violeta Oscuro", hex: "#5a3a7c" },
        ],
        highlights: ["Dynamic Island", "Always-On Display", "48MP ProRAW", "A16 Bionic", "ProRes 4K"],
      },
      {
        name: "iPhone 14 Pro Max",
        img: `${CDN}/iphone-14-pro-max-spaceblack-select${IP}`,
        display: '6.7" Super Retina XDR ProMotion 120Hz (2796×1290)',
        chip: "A16 Bionic",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 3×",
        battery: "Hasta 29 horas de video",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        colors: [
          { name: "Negro Espacial", hex: "#1c1c1e" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Dorado", hex: "#e8c97a" }, { name: "Violeta Oscuro", hex: "#5a3a7c" },
        ],
        highlights: ["Pantalla 6.7\"", "Dynamic Island", "Always-On Display", "29h batería", "ProRes 4K"],
      },
    ],
  },
  {
    id: "iphone15", generation: "iPhone 15", year: "2023", tag: "USB-C. Un estándar, por fin.",
    accent: "#ff9f0a",
    familyImg: null,
    models: [
      {
        name: "iPhone 15",
        img: `${CDN}/iphone-15-pink-select-202309${IP}`,
        display: '6.1" Super Retina XDR OLED (2556×1179)',
        chip: "A16 Bionic",
        camera: "Dual 48MP — Gran angular + Ultra gran angular con Photonic Engine",
        battery: "Hasta 20 horas de video",
        storage: ["128GB", "256GB", "512GB"],
        colors: [
          { name: "Negro", hex: "#1c1c1e" }, { name: "Azul", hex: "#2c5d9c" },
          { name: "Verde", hex: "#4a7c59" }, { name: "Amarillo", hex: "#d4b800" },
          { name: "Rosa", hex: "#e8a0b0" },
        ],
        highlights: ["USB-C", "Dynamic Island", "48MP principal", "A16 Bionic", "Photonic Engine"],
      },
      {
        name: "iPhone 15 Pro",
        img: `${CDN}/iphone-15-pro-blacktitanium-select${IP}`,
        display: '6.1" Super Retina XDR ProMotion 120Hz (2556×1179)',
        chip: "A17 Pro",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 3×",
        battery: "Hasta 23 horas de video",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        colors: [
          { name: "Titanio Negro", hex: "#2a2a2a" }, { name: "Titanio Blanco", hex: "#e8e8e8" },
          { name: "Titanio Azul", hex: "#4a7a9b" }, { name: "Titanio Natural", hex: "#c8b8a2" },
        ],
        highlights: ["Titanio", "USB-C 3.0", "Botón de Acción", "A17 Pro", "ProRes 4K 60fps Log"],
      },
      {
        name: "iPhone 15 Pro Max",
        img: `${CDN}/iphone-15-pro-max-blacktitanium-select${IP}`,
        display: '6.7" Super Retina XDR ProMotion 120Hz (2796×1290)',
        chip: "A17 Pro",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Zoom tetraprisma 5×",
        battery: "Hasta 29 horas de video",
        storage: ["256GB", "512GB", "1TB"],
        colors: [
          { name: "Titanio Negro", hex: "#2a2a2a" }, { name: "Titanio Blanco", hex: "#e8e8e8" },
          { name: "Titanio Azul", hex: "#4a7a9b" }, { name: "Titanio Natural", hex: "#c8b8a2" },
        ],
        highlights: ["Zoom 5× tetraprisma", "Titanio", "A17 Pro", "29h batería", "ProRes 4K Log"],
      },
    ],
  },
  {
    id: "iphone16", generation: "iPhone 16", year: "2024", tag: "Diseñado para Apple Intelligence.",
    accent: "#30d158",
    familyImg: null,
    models: [
      {
        name: "iPhone 16",
        img: `${CDN}/iphone-16-teal-select-202409${IP}`,
        display: '6.1" Super Retina XDR OLED (2556×1179)',
        chip: "A18",
        camera: "Dual 48MP — Gran angular + Ultra gran angular con Fusion Camera",
        battery: "Hasta 22 horas de video",
        storage: ["128GB", "256GB", "512GB"],
        colors: [
          { name: "Negro", hex: "#1c1c1e" }, { name: "Blanco", hex: "#f5f5f0" },
          { name: "Rosa", hex: "#e8a0b0" }, { name: "Teal", hex: "#4a9b8e" },
          { name: "Ultramar", hex: "#2c5d9c" },
        ],
        highlights: ["Apple Intelligence", "Botón de Cámara", "A18", "USB-C", "Camera Control"],
      },
      {
        name: "iPhone 16 Pro",
        img: `${CDN}/iphone-16-pro-blacktitanium-select${IP}`,
        display: '6.3" Super Retina XDR ProMotion 120Hz (2622×1206)',
        chip: "A18 Pro",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 5×",
        battery: "Hasta 27 horas de video",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        colors: [
          { name: "Titanio Negro", hex: "#2a2a2a" }, { name: "Titanio Blanco", hex: "#e8e8e8" },
          { name: "Titanio Natural", hex: "#c8b8a2" }, { name: "Titanio Desierto", hex: "#c8a882" },
        ],
        highlights: ["A18 Pro", "Apple Intelligence", "Zoom 5×", "ProRes 4K 120fps", "Camera Control"],
      },
      {
        name: "iPhone 16 Pro Max",
        img: `${CDN}/iphone-16-pro-max-blacktitanium-select${IP}`,
        display: '6.9" Super Retina XDR ProMotion 120Hz (2868×1320)',
        chip: "A18 Pro",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 5×",
        battery: "Hasta 33 horas de video",
        storage: ["256GB", "512GB", "1TB"],
        colors: [
          { name: "Titanio Negro", hex: "#2a2a2a" }, { name: "Titanio Blanco", hex: "#e8e8e8" },
          { name: "Titanio Natural", hex: "#c8b8a2" }, { name: "Titanio Desierto", hex: "#c8a882" },
        ],
        highlights: ["Pantalla 6.9\"", "33h batería", "A18 Pro", "ProRes 4K 120fps", "Apple Intelligence"],
      },
    ],
  },
  {
    id: "iphone17", generation: "iPhone 17", year: "2025", tag: "La próxima generación.",
    accent: "#ff453a",
    familyImg: null,
    models: [
      {
        name: "iPhone 17",
        img: `${CDN}/iphone-17-finish-select-black-202509_AV1${IP}`,
        display: '6.1" Super Retina XDR OLED (2556×1179)',
        chip: "A19",
        camera: "Dual 48MP — Gran angular + Ultra gran angular con Fusion Camera",
        battery: "Hasta 22 horas de video",
        storage: ["128GB", "256GB", "512GB"],
        colors: [
          { name: "Negro", hex: "#1c1c1e" }, { name: "Blanco", hex: "#f5f5f0" },
          { name: "Azul Niebla", hex: "#7fafc8" }, { name: "Lavanda", hex: "#c8b8d8" },
          { name: "Salvia", hex: "#8aad8a" },
        ],
        highlights: ["Apple Intelligence", "A19", "Camera Control", "USB-C", "48MP principal"],
      },

      {
        name: "iPhone 17 Pro",
        img: `${CDN}/iphone-17-pro-finish-select-deepblue-202509${IP}`,
        display: '6.3" ProMotion OLED 120Hz (2622×1206)',
        chip: "A19 Pro",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 5×",
        battery: "Hasta 27 horas de video",
        storage: ["256GB", "512GB", "1TB"],
        colors: [
          { name: "Azul Profundo", hex: "#1a3a5c" }, { name: "Plata", hex: "#e8e8e8" },
          { name: "Naranja Cósmico", hex: "#c85820" },
        ],
        highlights: ["A19 Pro", "Apple Intelligence", "ProRes 4K 120fps", "Zoom 5×", "Camera Control"],
      },
      {
        name: "iPhone 17 Pro Max",
        img: `${CDN}/iphone-17-pro-max-finish-select-cosmicorange-202509${IP}`,
        display: '6.9" ProMotion OLED 120Hz (2868×1320)',
        chip: "A19 Pro",
        camera: "Triple 48MP + LiDAR — Gran angular + Ultra gran angular + Teleobjetivo 5×",
        battery: "Hasta 33 horas de video",
        storage: ["256GB", "512GB", "1TB"],
        colors: [
          { name: "Naranja Cósmico", hex: "#c85820" }, { name: "Azul Profundo", hex: "#1a3a5c" },
          { name: "Plata", hex: "#e8e8e8" },
        ],
        highlights: ["Pantalla 6.9\"", "33h batería", "A19 Pro", "Apple Intelligence", "ProRes 4K 120fps"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Model Detail Card (inside modal)
// ─────────────────────────────────────────────────────────────────────────────
function ModelDetailCard({ model }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${T.border}`,
      borderRadius: "20px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      fontFamily: T.body,
    }}>
      {/* Image */}
      <div style={{
        background: "linear-gradient(145deg, #f5f5f3 0%, #ebebea 100%)",
        height: "220px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {model.img && !imgErr ? (
          <img
            src={model.img}
            alt={model.name}
            onError={() => setImgErr(true)}
            style={{ height: "200px", width: "auto", objectFit: "contain" }}
          />
        ) : (
          <div style={{ textAlign: "center", opacity: 0.3 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: T.text, letterSpacing: "-0.025em", margin: 0 }}>
          {model.name}
        </h3>

        {/* Specs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { label: "Pantalla", value: model.display },
            { label: "Chip", value: model.chip },
            { label: "Cámara", value: model.camera },
            { label: "Batería", value: model.battery },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: T.textMuted, minWidth: "56px", paddingTop: "1px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {label}
              </span>
              <span style={{ fontSize: "12.5px", color: T.textSec, lineHeight: 1.5 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Storage */}
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>Almacenamiento</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {model.storage.map((s) => (
              <span key={s} style={{
                fontSize: "12px", fontWeight: 500, color: T.text,
                background: "rgba(0,0,0,0.04)", border: `1px solid ${T.border}`,
                borderRadius: "8px", padding: "4px 10px",
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>Colores</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {model.colors.map((c) => (
              <div key={c.name} title={c.name} style={{
                width: "18px", height: "18px", borderRadius: "50%",
                background: c.hex,
                border: c.hex === "#f5f5f0" || c.hex === "#e8e8e8" ? "1.5px solid rgba(0,0,0,0.15)" : "1.5px solid transparent",
                flexShrink: 0,
              }} />
            ))}
            <span style={{ fontSize: "11px", color: T.textMuted, marginLeft: "2px" }}>
              {model.colors.map(c => c.name).join(", ")}
            </span>
          </div>
        </div>

        {/* Highlights */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "auto" }}>
          {model.highlights.map((h) => (
            <span key={h} style={{
              fontSize: "11px", fontWeight: 500, color: ACCENT,
              background: T.accentLight, border: `1px solid ${T.accentBorder}`,
              borderRadius: "6px", padding: "3px 8px",
            }}>{h}</span>
          ))}
        </div>

        {/* CTA */}
        <a
          href={waLink(`Hola, me interesa el ${model.name}. ¿Lo tienen disponible?`)}
          target="_blank" rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            background: "#25d366", color: "#fff",
            padding: "12px 16px", borderRadius: "12px",
            fontSize: "13px", fontWeight: 600, textDecoration: "none",
            marginTop: "4px",
          }}
        >
          <WhatsAppIcon size={14} />
          Consultar disponibilidad
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Generation Modal
// ─────────────────────────────────────────────────────────────────────────────
function GenerationModal({ gen, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
        justifyContent: "flex-end",
        fontFamily: T.body,
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{
          background: "#fafaf8",
          borderRadius: "28px 28px 0 0",
          minHeight: "75vh",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "0 0 60px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 0" }}>
          <div style={{ width: "40px", height: "4px", background: "rgba(0,0,0,0.1)", borderRadius: "2px" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "20px clamp(20px, 4vw, 56px) 32px",
          position: "sticky", top: 0, background: "#fafaf8", zIndex: 10,
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <p style={{
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: gen.accent, marginBottom: "6px",
            }}>
              {gen.year} · {gen.models.length} modelos
            </p>
            <h2 style={{
              fontFamily: T.heading,
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 700, letterSpacing: "-0.03em",
              color: T.text, margin: 0, lineHeight: 1.1,
            }}>
              {gen.generation}
            </h2>
            <p style={{ fontSize: "14px", color: T.textSec, marginTop: "6px" }}>{gen.tag}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px", height: "36px",
              background: "rgba(0,0,0,0.06)", border: "none",
              borderRadius: "50%", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.textSec, flexShrink: 0, marginTop: "4px",
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Models grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
          padding: "32px clamp(20px, 4vw, 56px) 0",
        }}
          className="modal-models-grid"
        >
          {gen.models.map((model) => (
            <ModelDetailCard key={model.name} model={model} />
          ))}
        </div>
        <style>{`
          @media (max-width: 640px) { .modal-models-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Models Catalog (Apple-style large image cards)
// ─────────────────────────────────────────────────────────────────────────────
function GenCard({ gen, i, inView, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.58, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.28, ease: "easeOut" } }}
      whileTap={{ scale: 0.983 }}
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: "28px", overflow: "hidden",
        cursor: "pointer", outline: "none",
        textAlign: "left", display: "flex",
        flexDirection: "column", width: "100%",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.35s ease, border-color 0.35s ease",
      }}
      className="gen-card"
    >
      {/* ── Image zone ── */}
      <div style={{
        position: "relative",
        height: "clamp(210px, 26vw, 310px)",
        overflow: "hidden",
        background: `radial-gradient(ellipse 100% 90% at 50% 75%, ${gen.accent}1e 0%, #f5f5f3 52%, #eeecea 100%)`,
      }}>
        {/* Year pill */}
        <div style={{
          position: "absolute", top: "14px", left: "14px", zIndex: 10,
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderRadius: "980px", padding: "5px 11px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: gen.accent, flexShrink: 0 }} />
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: T.textSec }}>{gen.year}</span>
        </div>

        {/* Models count pill */}
        <div style={{
          position: "absolute", top: "14px", right: "14px", zIndex: 10,
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderRadius: "980px", padding: "5px 11px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: T.textMuted }}>
            {gen.models.length} modelos
          </span>
        </div>

        {/* Phone image(s) */}
        {gen.familyImg ? (
          <img
            src={gen.familyImg}
            alt={gen.generation}
            className="gen-card-img"
            style={{
              position: "absolute",
              bottom: "-2px", left: "50%",
              transform: "translateX(-50%)",
              height: "93%", width: "auto",
              maxWidth: "none",
              objectFit: "contain",
              transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            {/* Display order: Pro (left) | base (center) | Pro Max (right) */}
            {(gen.models.length === 3
              ? [gen.models[1], gen.models[0], gen.models[2]]
              : gen.models
            ).map((m, idx) => {
              const isCenter = idx === 1;
              const widths = ["27%", "36%", "29%"];
              const maxHeights = ["78%", "93%", "82%"];
              return (
                <img
                  key={m.name}
                  src={m.img}
                  alt={m.name}
                  className="gen-card-img gen-card-model-img"
                  style={{
                    width: widths[idx] ?? "27%",
                    height: "auto",
                    maxHeight: maxHeights[idx] ?? "78%",
                    objectFit: "contain",
                    objectPosition: "bottom",
                    flexShrink: 0,
                    alignSelf: "flex-end",
                    position: "relative",
                    zIndex: isCenter ? 3 : idx === 0 ? 2 : 1,
                    marginLeft: idx > 0 ? "-9%" : "0",
                    filter: isCenter
                      ? "drop-shadow(0 16px 32px rgba(0,0,0,0.22))"
                      : "drop-shadow(0 8px 18px rgba(0,0,0,0.11))",
                    transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "48px",
          background: "linear-gradient(to bottom, transparent, rgba(238,236,234,0.6))",
          pointerEvents: "none", zIndex: 5,
        }} />
      </div>

      {/* ── Text zone ── */}
      <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontFamily: T.heading,
            fontSize: "clamp(16px, 1.7vw, 20px)", fontWeight: 700,
            letterSpacing: "-0.03em", color: T.text, margin: 0, lineHeight: 1.15,
          }}>
            {gen.generation}
          </h3>
          <p style={{ fontSize: "12.5px", color: T.textSec, marginTop: "4px", lineHeight: 1.5 }}>
            {gen.tag}
          </p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: "12px", borderTop: `1px solid ${T.border}`,
        }}>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {gen.models.map((m) => {
              const label = m.name.replace(gen.generation, "").trim() || "base";
              return (
                <span key={m.name} style={{
                  fontSize: "10px", fontWeight: 600, letterSpacing: "0.03em",
                  color: T.textMuted,
                  background: "rgba(0,0,0,0.055)", borderRadius: "6px", padding: "3px 7px",
                }}>
                  {label}
                </span>
              );
            })}
          </div>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
            background: `${gen.accent}18`, border: `1px solid ${gen.accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: gen.accent,
          }}>
            <ChevronRight size={12} strokeWidth={2.8} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Full-width featured card for the newest generation
function FeaturedGenCard({ gen, i, inView, onClick }) {
  const displayName = gen.generation.replace("iPhone ", "Línea ");

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.992 }}
      style={{
        background: "#fff", border: "none",
        borderRadius: "24px", overflow: "hidden",
        cursor: "pointer", outline: "none",
        textAlign: "left", width: "100%",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        minHeight: "clamp(240px, 28vw, 340px)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 20px 56px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
      className="featured-gen-card"
    >
      {/* Text side */}
      <div style={{
        padding: "clamp(32px, 4vw, 52px)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", gap: "16px",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: `${gen.accent}15`, borderRadius: "980px",
          padding: "5px 14px", width: "fit-content",
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: gen.accent }} />
          <span style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: gen.accent,
          }}>
            {gen.year} · Lo más nuevo
          </span>
        </div>

        <div>
          <h3 style={{
            fontFamily: T.heading,
            fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 700,
            letterSpacing: "-0.04em", color: T.text,
            margin: 0, lineHeight: 1.05,
          }}>
            {displayName}
          </h3>
          <p style={{ fontSize: "15px", color: T.textSec, marginTop: "10px", lineHeight: 1.6, maxWidth: "280px" }}>
            {gen.tag}
          </p>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: gen.accent, color: "#fff",
          borderRadius: "980px", padding: "11px 22px",
          width: "fit-content", fontSize: "14px", fontWeight: 600,
          marginTop: "4px",
        }}>
          Ver {gen.models.length} modelos
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
      </div>

      {/* Image side — 3 back views composed */}
      <div style={{
        background: "linear-gradient(155deg, #f7f7f5 0%, #ebebea 100%)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        position: "relative", overflow: "hidden",
        gap: "clamp(-16px, -2vw, -8px)",
        padding: "28px 12px 0",
      }}>
        {(gen.backImgs || gen.models.map((m) => m.img)).map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`${gen.generation} ${idx + 1}`}
            className="featured-gen-img"
            style={{
              height: idx === 1
                ? "clamp(190px, 21vw, 280px)"
                : "clamp(165px, 18vw, 245px)",
              width: "auto", objectFit: "contain",
              position: "relative", zIndex: idx === 1 ? 2 : 1,
              transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        ))}
      </div>
    </motion.button>
  );
}

function ModelsCatalog() {
  const [activeGen, setActiveGen] = useState(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const regularGens = IPHONE_CATALOG.slice(0, -1);
  const featuredGen = IPHONE_CATALOG[IPHONE_CATALOG.length - 1];

  return (
    <section style={{
      background: "#f5f5f7",
      padding: "96px clamp(20px, 6vw, 80px) 104px",
      fontFamily: T.body,
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }} ref={ref}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: "52px", textAlign: "center" }}
        >
          <p style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.16em",
            textTransform: "uppercase", color: ACCENT, marginBottom: "12px",
          }}>
            Catálogo completo
          </p>
          <h2 style={{
            fontFamily: T.heading,
            fontSize: "clamp(30px, 4vw, 48px)",
            fontWeight: 700, letterSpacing: "-0.04em",
            color: T.text, lineHeight: 1.05, marginBottom: "12px",
          }}>
            Todos los iPhones
          </h2>
          <p style={{ fontSize: "15px", color: T.textSec, lineHeight: 1.6, maxWidth: "420px", margin: "0 auto" }}>
            Explorá cada generación. Specs, colores y almacenamiento.
          </p>
        </motion.div>

        {/* Featured card — newest generation (full width) */}
        <div style={{ marginBottom: "16px" }}>
          <FeaturedGenCard
            gen={featuredGen}
            i={0}
            inView={inView}
            onClick={() => setActiveGen(featuredGen)}
          />
        </div>

        {/* Regular 2-col grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
        }} className="gen-grid-apple">
          {regularGens.map((gen, i) => (
            <GenCard
              key={gen.id}
              gen={gen}
              i={i + 1}
              inView={inView}
              onClick={() => setActiveGen(gen)}
            />
          ))}
        </div>

        <style>{`
          @media (max-width: 640px) {
            .gen-grid-apple { grid-template-columns: 1fr !important; }
            .featured-gen-card { grid-template-columns: 1fr !important; }
            .featured-gen-card > div:last-child { min-height: 220px; }
          }
          .gen-card:hover {
            box-shadow: 0 24px 64px rgba(0,0,0,0.11) !important;
            border-color: rgba(0,0,0,0.11) !important;
          }
          .gen-card:hover .gen-card-model-img {
            transform: scale(1.05) translateY(-6px) !important;
          }
          .featured-gen-card:hover .featured-gen-img {
            transform: scale(1.05) translateY(-4px);
          }
        `}</style>
      </div>

      <AnimatePresence>
        {activeGen && (
          <GenerationModal gen={activeGen} onClose={() => setActiveGen(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Filter Chip
// ─────────────────────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children }) {
  return (
    <motion.button
      onClick={onClick} whileTap={{ scale: 0.96 }}
      style={{
        background: active ? ACCENT : "rgba(0,0,0,0.04)",
        border: `1px solid ${active ? ACCENT : T.border}`,
        color: active ? "#fff" : T.textSec,
        borderRadius: "980px", padding: "7px 18px",
        fontSize: "13px", fontWeight: active ? 600 : 400,
        cursor: "pointer", transition: "all 0.18s ease",
        whiteSpace: "nowrap", fontFamily: T.body, outline: "none",
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.14)"; e.currentTarget.style.color = T.text; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSec; } }}
    >
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Product Card (grid view)
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, exchange }) {
  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars)).toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;

  const batteryColor = !product.battery_health ? T.textMuted : product.battery_health >= 85 ? "#16a34a" : product.battery_health >= 70 ? "#d97706" : "#dc2626";
  const isNewProduct = product.created_at ? isNew(product.created_at) : false;

  return (
    <Link to={`/producto/${product.id}`} style={{ textDecoration: "none", color: "inherit", height: "100%", display: "block" }}>
      <motion.div
        whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(0,0,0,0.10)", borderColor: "rgba(0,0,0,0.14)" }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          display: "flex", flexDirection: "column",
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: "20px", overflow: "hidden",
          height: "100%", cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", fontFamily: T.body,
        }}
      >
        {/* Image */}
        <div style={{ width: "100%", aspectRatio: "4/3", background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderBottom: `1px solid ${T.border}`, position: "relative" }}>
          {product.photo_url ? (
            <img src={product.photo_url} alt={product.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: "linear-gradient(145deg, #f5f5f3 0%, #ebebea 100%)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span style={{ fontSize: "11.5px", fontWeight: 500, color: T.textMuted, letterSpacing: "-0.01em" }}>{product.model || "iPhone"}</span>
            </div>
          )}

          {/* Badges top-left */}
          <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
            {product.is_offer && (
              <div style={{
                background: "linear-gradient(135deg, #f97316, #ef4444)",
                borderRadius: "980px", padding: "3px 10px",
                fontSize: "10px", fontWeight: 700, color: "#fff",
                letterSpacing: "0.04em", boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
              }}>
                🔥 Oportunidad
              </div>
            )}
            {isNewProduct && !product.is_offer && (
              <div style={{
                background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                border: `1px solid ${T.accentBorder}`, borderRadius: "980px",
                padding: "3px 10px", fontSize: "10px", fontWeight: 600,
                color: ACCENT, letterSpacing: "0.02em",
              }}>
                ✦ Nuevo ingreso
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: T.text, letterSpacing: "-0.02em", marginBottom: "3px" }}>{product.model}</p>
            <p style={{ fontSize: "13px", color: T.textSec }}>{[product.storage, product.color].filter(Boolean).join(" · ")}</p>
          </div>

          {product.battery_health && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, height: "3px", background: "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "2px" }} />
              </div>
              <span style={{ fontSize: "11px", color: batteryColor, fontWeight: 600, minWidth: "32px", textAlign: "right" }}>{product.battery_health}%</span>
            </div>
          )}

          <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: product.is_offer ? "#ef4444" : T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
              </p>
              {ars && <p style={{ fontSize: "12px", color: T.textMuted, marginTop: "3px" }}>ARS {ars}</p>}
            </div>
            <div style={{ width: "32px", height: "32px", background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={14} color={ACCENT} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Product Row (list view)
// ─────────────────────────────────────────────────────────────────────────────
function ProductRow({ product, exchange }) {
  const ars = exchange
    ? (Number(product.suggested_sale_price_usd) * Number(exchange.sell_rate_ars)).toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : null;
  const batteryColor = !product.battery_health ? T.textMuted : product.battery_health >= 85 ? "#16a34a" : product.battery_health >= 70 ? "#d97706" : "#dc2626";
  const isNewProduct = product.created_at ? isNew(product.created_at) : false;

  return (
    <Link to={`/producto/${product.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <motion.div
        whileHover={{ backgroundColor: "#fafaf9" }}
        style={{
          display: "flex", alignItems: "center", gap: "14px",
          padding: "14px 16px",
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: "16px", cursor: "pointer",
          fontFamily: T.body, transition: "background 0.15s",
        }}
      >
        {/* Thumb */}
        <div style={{ width: "56px", height: "56px", borderRadius: "10px", background: T.surface, overflow: "hidden", flexShrink: 0 }}>
          {product.photo_url ? (
            <img src={product.photo_url} alt={product.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", flexWrap: "wrap" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: T.text, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.model}</p>
            {product.is_offer && (
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px", padding: "1px 6px", flexShrink: 0 }}>Oportunidad</span>
            )}
            {isNewProduct && !product.is_offer && (
              <span style={{ fontSize: "9px", fontWeight: 600, color: ACCENT, background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderRadius: "5px", padding: "1px 6px", flexShrink: 0 }}>Nuevo</span>
            )}
          </div>
          <p style={{ fontSize: "12px", color: T.textSec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {[product.storage, product.color].filter(Boolean).join(" · ")}
          </p>
          {/* Battery shown inline on mobile */}
          {product.battery_health && (
            <div className="row-battery-mobile" style={{ display: "none", alignItems: "center", gap: "6px", marginTop: "5px" }}>
              <div style={{ width: "40px", height: "2px", background: "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "2px" }} />
              </div>
              <span style={{ fontSize: "10px", color: batteryColor, fontWeight: 600 }}>{product.battery_health}%</span>
            </div>
          )}
        </div>

        {/* Battery — desktop only */}
        {product.battery_health && (
          <div className="row-battery-desktop" style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <div style={{ width: "44px", height: "3px", background: "rgba(0,0,0,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${product.battery_health}%`, height: "100%", background: batteryColor, borderRadius: "2px" }} />
            </div>
            <span style={{ fontSize: "11px", color: batteryColor, fontWeight: 600, minWidth: "28px" }}>{product.battery_health}%</span>
          </div>
        )}

        {/* Price */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: product.is_offer ? "#ef4444" : T.text, letterSpacing: "-0.03em", lineHeight: 1, whiteSpace: "nowrap" }}>
            USD {Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}
          </p>
          {ars && <p style={{ fontSize: "10px", color: T.textMuted, marginTop: "3px", whiteSpace: "nowrap" }}>ARS {ars}</p>}
        </div>

        <ChevronRight size={14} color={T.textMuted} style={{ flexShrink: 0 }} />
      </motion.div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton
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
    <section style={{ background: "#0a0a0a", padding: "120px clamp(20px, 6vw, 80px)", textAlign: "center", position: "relative", overflow: "hidden", fontFamily: T.body }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "700px", height: "500px", background: "radial-gradient(ellipse, rgba(0,200,150,0.14) 0%, transparent 68%)", pointerEvents: "none", animation: "glow-pulse 4s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "120px", height: "1px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
      <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} style={{ position: "relative" }}>
        <p style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: ACCENT, marginBottom: "24px" }}>Contacto directo</p>
        <h2 style={{ fontFamily: T.heading, fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, letterSpacing: "-0.04em", color: "#ffffff", lineHeight: 1.05, marginBottom: "16px" }}>
          ¿No encontrás<br />lo que buscás?
        </h2>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.48)", marginBottom: "48px", lineHeight: 1.6 }}>Escribinos y te conseguimos el equipo ideal.</p>
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
      href={waLink(message)} target="_blank" rel="noreferrer"
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#25d366", color: "white", padding, borderRadius: "980px", fontSize, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 20px rgba(37,211,102,0.28)", cursor: "pointer", fontFamily: T.body }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,211,102,0.38)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,0.28)"}
    >
      <WhatsAppIcon size={iconSize} />
      {children}
    </motion.a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Floating WhatsApp
// ─────────────────────────────────────────────────────────────────────────────
function FloatingWhatsApp() {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
      style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 500, fontFamily: T.body }}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute", bottom: "60px", right: 0,
              background: "#fff", border: `1px solid ${T.border}`,
              borderRadius: "16px", padding: "16px 20px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
              width: "220px",
            }}
          >
            <p style={{ fontSize: "13px", fontWeight: 600, color: T.text, marginBottom: "4px" }}>¿Necesitás ayuda?</p>
            <p style={{ fontSize: "12px", color: T.textSec, marginBottom: "14px", lineHeight: 1.5 }}>Escribinos y te respondemos al instante.</p>
            <a
              href={waLink("Hola, quiero consultar sobre un equipo")}
              target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                background: "#25d366", color: "#fff",
                padding: "10px 16px", borderRadius: "10px",
                fontSize: "13px", fontWeight: 600, textDecoration: "none",
              }}
            >
              <WhatsAppIcon size={14} />
              Abrir WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setExpanded((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          width: "52px", height: "52px",
          background: "#25d366", border: "none",
          borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,211,102,0.40)",
          color: "#fff",
        }}
      >
        {expanded
          ? <X size={20} strokeWidth={2.5} />
          : <WhatsAppIcon size={24} />
        }
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Footer
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: "40px clamp(20px, 6vw, 80px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", background: T.bg, fontFamily: T.body }}>
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <XyloLogo size={20} />
        <span style={{ fontSize: "15px", fontWeight: 600, color: T.text, letterSpacing: "-0.3px" }}>Xylo</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <a href={waLink()} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: T.textSec, textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.color = T.text}
          onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
        >
          <WhatsAppIcon size={13} />
          WhatsApp
        </a>
        <p style={{ fontSize: "13px", color: T.textMuted }}>© {new Date().getFullYear()} Xylo</p>
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
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
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

  const models = useMemo(() => [...new Set(products.map((p) => p.model).filter(Boolean))].sort(), [products]);
  const storages = useMemo(() => [...new Set(products.map((p) => p.storage).filter(Boolean))].sort(), [products]);

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
    if (sortBy === "offers")     result = [...result].sort((a, b) => (b.is_offer ? 1 : 0) - (a.is_offer ? 1 : 0));
    return result;
  }, [products, search, modelFilter, storageFilter, sortBy]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, overflowX: "hidden" }}>
      <Navbar scrolled={scrolled} />
      <Hero />
      <HowToBuy />

      {/* ── Oportunidades ─────────────────────────────────────────────── */}
      <section id="stock" style={{ maxWidth: "1280px", margin: "0 auto", padding: "100px clamp(20px, 6vw, 80px) 120px", fontFamily: T.body }}>

        {/* Header */}
        <motion.div
          ref={stockHeaderRef}
          initial={{ opacity: 0, y: 20 }}
          animate={stockHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "56px" }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontFamily: T.heading, fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.04em", color: T.text, lineHeight: 1, marginBottom: "10px" }}>
                Oportunidades
              </h2>
            </div>

            {/* View toggle */}
            <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.04)", border: `1px solid ${T.border}`, borderRadius: "12px", padding: "4px" }}>
              {[
                { mode: "grid", icon: <LayoutGrid size={16} /> },
                { mode: "list", icon: <List size={16} /> },
              ].map(({ mode, icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    width: "36px", height: "36px",
                    background: viewMode === mode ? "#fff" : "transparent",
                    border: "none", borderRadius: "8px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: viewMode === mode ? T.text : T.textMuted,
                    boxShadow: viewMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ position: "relative", maxWidth: "480px", marginBottom: "20px" }}>
            <Search size={15} color={T.textMuted} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Buscar modelo, color, capacidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "12px 40px 12px 42px", fontSize: "14px", color: T.text, outline: "none", transition: "border-color 0.2s, background 0.2s", fontFamily: T.body }}
              onFocus={(e) => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.background = "#fff"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted }}
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {models.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              <FilterChip active={!modelFilter} onClick={() => setModelFilter("")}>Todos</FilterChip>
              {models.map((m) => <FilterChip key={m} active={modelFilter === m} onClick={() => setModelFilter(modelFilter === m ? "" : m)}>{m}</FilterChip>)}
            </div>
          )}
          {storages.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <FilterChip active={!storageFilter} onClick={() => setStorageFilter("")}>Todas</FilterChip>
              {storages.map((s) => <FilterChip key={s} active={storageFilter === s} onClick={() => setStorageFilter(storageFilter === s ? "" : s)}>{s}</FilterChip>)}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: T.textMuted, marginRight: "4px" }}>Ordenar:</span>
            {[
              { key: "", label: "Relevante" },
              { key: "price_asc", label: "Menor precio" },
              { key: "price_desc", label: "Mayor precio" },
              { key: "battery", label: "Mejor batería" },
            ].map(({ key, label }) => (
              <FilterChip key={key} active={sortBy === key} onClick={() => setSortBy(key)}>{label}</FilterChip>
            ))}
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px" }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ opacity: 0.15, marginBottom: "24px", display: "flex", justifyContent: "center" }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <p style={{ fontFamily: T.heading, fontSize: "24px", fontWeight: 600, color: T.text, marginBottom: "8px" }}>Sin resultados</p>
            <p style={{ fontSize: "15px", color: T.textSec, marginBottom: "28px" }}>Probá con otros filtros o consultanos directamente.</p>
            <button onClick={() => { setSearch(""); setModelFilter(""); setStorageFilter(""); }} style={{ background: T.text, border: "none", color: "#fff", borderRadius: "980px", padding: "10px 24px", fontSize: "14px", cursor: "pointer", fontFamily: T.body }}>
              Limpiar filtros
            </button>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div layout variants={stockGridVariants} initial="hidden" animate="visible"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px" }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <motion.div key={product.id} layout variants={stockCardVariants} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.28 }}>
                  <ProductCard product={product} exchange={exchange} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div layout variants={stockGridVariants} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <motion.div key={product.id} layout variants={stockCardVariants} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                  <ProductRow product={product} exchange={exchange} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <style>{`
        @media (max-width: 540px) {
          .row-battery-desktop { display: none !important; }
          .row-battery-mobile { display: flex !important; }
        }
      `}</style>

      <ModelsCatalog />
      <FeatureGrid />

      <CTABanner />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
