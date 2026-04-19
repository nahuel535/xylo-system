import {
  Home, Package, PackagePlus, ShoppingBag,
  ReceiptText, TrendingUp, ScanLine, LogOut, Sun, Moon,
  Users, Wallet, LayoutGrid,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

const DESKTOP_SECTIONS = [
  {
    label: "Principal",
    links: [
      { to: "/", label: "Dashboard", icon: Home },
      { to: "/scanner", label: "Escanear", icon: ScanLine },
      { to: "/products", label: "Stock", icon: Package },
      { to: "/sold-products", label: "Vendidos", icon: ShoppingBag },
      { to: "/sales", label: "Ventas", icon: ReceiptText },
    ],
  },
  {
    label: "Herramientas",
    links: [
      { to: "/exchange", label: "Cotización", icon: TrendingUp },
      { to: "/products/new", label: "Cargar stock", icon: PackagePlus },
      { to: "/debtors", label: "Deudores", icon: Wallet },
    ],
  },
  {
    label: "Admin",
    links: [
      { to: "/users", label: "Usuarios", icon: Users },
    ],
  },
];

const TABS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
];

const SHEET_LINKS = [
  { to: "/", label: "Dashboard", icon: Home, color: "#6366f1" },
  { to: "/products", label: "Stock", icon: Package, color: "#3b82f6" },
  { to: "/products/new", label: "Cargar", icon: PackagePlus, color: "#10b981" },
  { to: "/sold-products", label: "Vendidos", icon: ShoppingBag, color: "#f59e0b" },
  { to: "/sales", label: "Ventas", icon: ReceiptText, color: "#8b5cf6" },
  { to: "/exchange", label: "Cotización", icon: TrendingUp, color: "#0ea5e9" },
  { to: "/scanner", label: "Escanear", icon: ScanLine, color: "#ef4444" },
  { to: "/debtors", label: "Deudores", icon: Wallet, color: "#f43f5e" },
  { to: "/users", label: "Usuarios", icon: Users, color: "#64748b" },
];

const PAGE_TITLES = {
  "/": "Dashboard",
  "/products": "Stock",
  "/products/new": "Nuevo producto",
  "/sold-products": "Vendidos",
  "/sales": "Ventas",
  "/exchange": "Cotización",
  "/scanner": "Escanear",
  "/debtors": "Deudores",
  "/users": "Usuarios",
};

function TabButton({ to, label, icon: Icon, inactive }) {
  const [pressed, setPressed] = useState(false);
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textDecoration: "none", paddingTop: 4,
        transform: pressed ? "scale(0.84)" : "scale(1)",
        transition: pressed
          ? "transform 0.07s ease-in"
          : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {({ isActive }) => (
        <>
          <div style={{
            width: isActive ? 20 : 4,
            height: 3,
            borderRadius: 99,
            background: "#10b981",
            opacity: isActive ? 1 : 0,
            marginBottom: 7,
            transition: "all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }} />
          <Icon
            size={22}
            strokeWidth={isActive ? 2.3 : 1.6}
            style={{ color: isActive ? "#10b981" : inactive, transition: "color 0.2s" }}
          />
          <span style={{
            fontSize: 10, fontWeight: isActive ? 650 : 400, lineHeight: 1,
            color: isActive ? "#10b981" : inactive,
            marginTop: 4, transition: "color 0.2s",
          }}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [morePressed, setMorePressed] = useState(false);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  const location = useLocation();
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const bg = dark ? "rgba(20,20,22,0.94)" : "rgba(252,252,253,0.94)";
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const inactive = dark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.32)";
  const sheetBg = dark ? "#1c1c1e" : "#f2f2f7";
  const cardBg = dark ? "rgba(255,255,255,0.07)" : "#ffffff";

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
  )?.[1] ?? "Xylo";

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  useEffect(() => { closeSheet(); }, [location.pathname]);

  function openSheet() {
    setSheetVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetOpen(true)));
  }

  function closeSheet() {
    setSheetOpen(false);
    setDragOffset(0);
    setTimeout(() => setSheetVisible(false), 340);
  }

  function onHandleTouchStart(e) {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }

  function onHandleTouchMove(e) {
    if (!isDragging.current) return;
    const dy = Math.max(0, e.touches[0].clientY - dragStartY.current);
    setDragOffset(dy);
  }

  function onHandleTouchEnd() {
    isDragging.current = false;
    if (dragOffset > 90) {
      closeSheet();
    } else {
      setDragOffset(0);
    }
  }

  return (
    <>
      {/* ── DESKTOP sidebar ── */}
      <aside className="hidden md:flex w-64 bg-base-card border-r border-base-border min-h-screen p-4 flex-col">
        <div className="mb-7 px-2 pt-2">
          <div className="flex items-center gap-2.5 mb-0.5">
            <img src={logo} alt="Xylo" className="w-8 h-8 rounded-xl" />
            <h1 className="text-base font-semibold text-base-text tracking-tight">Xylo</h1>
          </div>
          <p className="text-xs text-base-muted pl-10">Sistema interno</p>
        </div>

        <nav className="flex-1 flex flex-col">
          <div className="flex-1 space-y-5">
            {DESKTOP_SECTIONS.map(({ label, links }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-base-muted px-3 mb-1.5 opacity-50">
                  {label}
                </p>
                <div className="space-y-0.5">
                  {links.map(({ to, label: linkLabel, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                          isActive
                            ? "bg-xylo-500 text-white font-medium shadow-sm"
                            : "text-base-muted hover:bg-base-subtle hover:text-base-text"
                        }`}
                    >
                      <Icon size={16} /><span>{linkLabel}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-base-border">
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: "linear-gradient(135deg, #34d399, #10b981)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff",
              }}>{initials}</div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-base-text truncate">{user?.name}</p>
                <p className="text-xs text-base-muted capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-base-muted hover:bg-base-subtle hover:text-base-text w-full transition-all"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{dark ? "Modo claro" : "Modo oscuro"}</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-base-muted hover:bg-red-50 hover:text-red-500 w-full transition-all"
            >
              <LogOut size={16} /><span>Cerrar sesión</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── MOBILE: top bar ── */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-5"
        style={{
          height: 52,
          background: bg,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <img src={logo} alt="" style={{ width: 26, height: 26, borderRadius: 8, opacity: 0.9 }} />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: dark ? "#fff" : "#111" }}>
          {pageTitle}
        </span>
        <button
          onClick={toggleTheme}
          style={{
            width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer",
            background: dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: inactive,
          }}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </header>

      {/* ── MOBILE: bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40"
        style={{
          background: bg,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderTop: `1px solid ${border}`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch", height: 56 }}>
          {TABS.map(({ to, label, icon: Icon }) => (
            <TabButton key={to} to={to} label={label} icon={Icon} inactive={inactive} />
          ))}

          {/* Más */}
          <button
            onClick={openSheet}
            onPointerDown={() => setMorePressed(true)}
            onPointerUp={() => setMorePressed(false)}
            onPointerLeave={() => setMorePressed(false)}
            style={{
              flex: 1,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer", paddingTop: 4,
              transform: morePressed ? "scale(0.84)" : "scale(1)",
              transition: morePressed
                ? "transform 0.07s ease-in"
                : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div style={{
              width: sheetOpen ? 20 : 4,
              height: 3,
              borderRadius: 99,
              background: "#10b981",
              opacity: sheetOpen ? 1 : 0,
              marginBottom: 7,
              transition: "all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }} />
            <LayoutGrid
              size={22}
              strokeWidth={1.6}
              style={{ color: sheetOpen ? "#10b981" : inactive, transition: "color 0.2s" }}
            />
            <span style={{
              fontSize: 10, fontWeight: sheetOpen ? 650 : 400, lineHeight: 1,
              color: sheetOpen ? "#10b981" : inactive,
              marginTop: 4, transition: "color 0.2s",
            }}>
              Más
            </span>
          </button>
        </div>
      </nav>

      {/* ── BOTTOM SHEET ── */}
      {sheetVisible && (
        <div
          className="md:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: sheetOpen ? "auto" : "none" }}
        >
          {/* Backdrop */}
          <div
            onClick={closeSheet}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.48)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              opacity: sheetOpen ? Math.max(0, 1 - dragOffset / 280) : 0,
              transition: dragOffset > 0 ? "none" : "opacity 0.28s ease",
            }}
          />

          {/* Sheet panel */}
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: sheetBg,
              borderRadius: "22px 22px 0 0",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
              transform: sheetOpen ? `translateY(${dragOffset}px)` : "translateY(100%)",
              transition: dragOffset > 0 ? "none" : "transform 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.05)",
              boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
            }}
          >
            {/* Drag handle — full-width touch target */}
            <div
              onTouchStart={onHandleTouchStart}
              onTouchMove={onHandleTouchMove}
              onTouchEnd={onHandleTouchEnd}
              style={{
                padding: "14px 0 2px",
                display: "flex", justifyContent: "center",
                cursor: "grab", userSelect: "none", touchAction: "none",
              }}
            >
              <div style={{
                width: 36, height: 4, borderRadius: 4,
                background: dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",
              }} />
            </div>

            {/* User row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px 16px" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 15, flexShrink: 0,
                background: "linear-gradient(135deg, #34d399, #10b981)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#fff",
                boxShadow: "0 3px 12px rgba(16,185,129,0.35)",
              }}>
                {initials}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: dark ? "#fff" : "#111" }}>
                  {user?.name}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: inactive, textTransform: "capitalize" }}>
                  {user?.role}
                </p>
              </div>
            </div>

            {/* App icon grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, padding: "4px 12px 8px" }}>
              {SHEET_LINKS.map(({ to, label, icon: Icon, color }) => {
                const isActive = to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={closeSheet}
                    style={{
                      textDecoration: "none",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                      padding: "14px 8px 10px",
                      borderRadius: 16,
                      background: isActive
                        ? (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")
                        : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 4px 12px ${color}55`,
                    }}>
                      <Icon size={24} color="#fff" strokeWidth={1.8} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: dark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.72)",
                      lineHeight: 1.1, textAlign: "center",
                    }}>
                      {label}
                    </span>
                  </NavLink>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ margin: "4px 12px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                onClick={toggleTheme}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "13px 16px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: cardBg,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: dark ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {dark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#78716c" />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.72)" }}>
                  {dark ? "Modo claro" : "Modo oscuro"}
                </span>
              </button>

              <button
                onClick={() => { closeSheet(); logout(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "13px 16px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: cardBg,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(239,68,68,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LogOut size={16} color="#ef4444" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#ef4444" }}>Salir</span>
              </button>
            </div>

            <div style={{ height: 12 }} />
          </div>
        </div>
      )}
    </>
  );
}
