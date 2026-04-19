import {
  LayoutDashboard, Package, PlusSquare, BadgeDollarSign,
  ReceiptText, Landmark, ScanLine, X, LogOut, Sun, Moon,
  Users, ChevronRight, Settings,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

const DESKTOP_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/sold-products", label: "Vendidos", icon: BadgeDollarSign },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/exchange", label: "Cotización", icon: Landmark },
  { to: "/products/new", label: "Nuevo", icon: PlusSquare },
  { to: "/users", label: "Usuarios", icon: Users },
];

const MOBILE_TABS = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/products", label: "Stock", icon: Package },
  null, // centro — FAB
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/scanner", label: "Scan", icon: ScanLine },
];

const SHEET_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/products/new", label: "Cargar stock", icon: PlusSquare },
  { to: "/sold-products", label: "Vendidos", icon: BadgeDollarSign },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/exchange", label: "Cotización", icon: Landmark },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
  { to: "/users", label: "Usuarios", icon: Users },
];

export default function Sidebar() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  useEffect(() => {
    closeSheet();
  }, [location.pathname]);

  function openSheet() {
    setSheetVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetOpen(true)));
  }

  function closeSheet() {
    setSheetOpen(false);
    setTimeout(() => setSheetVisible(false), 320);
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      {/* ── DESKTOP sidebar ── */}
      <aside className="hidden md:flex w-64 bg-base-card border-r border-base-border min-h-screen p-4 flex-col">
        <div className="mb-6 px-2 pt-2">
          <div className="flex items-center gap-2.5 mb-0.5">
            <img src={logo} alt="Xylo" className="w-8 h-8 rounded-xl" />
            <h1 className="text-base font-semibold text-base-text tracking-tight">Xylo</h1>
          </div>
          <p className="text-xs text-base-muted pl-10">Sistema interno</p>
        </div>
        <nav className="flex-1 flex flex-col">
          <div className="space-y-0.5 flex-1">
            {DESKTOP_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    isActive
                      ? "bg-xylo-500 text-white font-medium shadow-sm"
                      : "text-base-muted hover:bg-base-subtle hover:text-base-text"
                  }`
                }
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
          <div className="pt-4 mt-4 border-t border-base-border">
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-medium text-base-text truncate">{user?.name}</p>
              <p className="text-xs text-base-muted capitalize">{user?.role}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-base-muted hover:bg-base-subtle hover:text-base-text w-full transition-all"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
              <span>{dark ? "Modo claro" : "Modo oscuro"}</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-base-muted hover:bg-red-50 hover:text-red-500 w-full transition-all"
            >
              <LogOut size={17} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── MOBILE top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5"
        style={{
          height: "56px",
          background: dark ? "rgba(18,18,20,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        }}
      >
        <div style={{ width: 36 }} />
        <div className="flex items-center gap-2">
          <img src={logo} alt="Xylo" className="w-6 h-6 rounded-lg" />
          <span className="text-sm font-semibold text-base-text tracking-tight">Xylo</span>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-full text-base-muted transition-all active:scale-90"
          style={{ width: 36, height: 36, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* ── MOBILE bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: dark ? "rgba(18,18,20,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
          paddingBottom: "env(safe-area-inset-bottom, 4px)",
        }}
      >
        <div className="flex items-end justify-around px-2 pt-2 pb-1">
          {MOBILE_TABS.map((tab, idx) => {
            if (!tab) {
              // FAB central — Nuevo
              return (
                <button
                  key="fab"
                  onClick={() => navigate("/products/new")}
                  className="flex flex-col items-center transition-all active:scale-90"
                  style={{ minWidth: 56, paddingBottom: 4 }}
                >
                  <div style={{
                    width: 48, height: 48,
                    background: "linear-gradient(145deg, #34d399, #10b981)",
                    borderRadius: "16px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(16,185,129,0.40)",
                    marginTop: "-14px",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}>
                    <PlusSquare size={22} color="#fff" strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: "9px", fontWeight: 600, color: "#10b981", marginTop: 3, lineHeight: 1 }}>
                    Nuevo
                  </span>
                </button>
              );
            }
            const { to, label, icon: Icon } = tab;
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center transition-all active:scale-90"
                style={{ minWidth: 56, paddingBottom: 4 }}
              >
                {({ isActive }) => (
                  <>
                    <div style={{
                      width: 44, height: 32,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "12px",
                      background: isActive ? "rgba(16,185,129,0.12)" : "transparent",
                      transition: "background 0.2s ease",
                    }}>
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.2 : 1.7}
                        color={isActive ? "#10b981" : dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"}
                        style={{ transition: "color 0.2s, stroke-width 0.2s" }}
                      />
                    </div>
                    <span style={{
                      fontSize: "9.5px", fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#10b981" : dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
                      lineHeight: 1, marginTop: 2,
                      transition: "color 0.2s, font-weight 0.2s",
                    }}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Botón Más */}
          <button
            onClick={openSheet}
            className="flex flex-col items-center transition-all active:scale-90"
            style={{ minWidth: 56, paddingBottom: 4 }}
          >
            <div style={{
              width: 44, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "12px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "3.5px" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
                    }} />
                  ))}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: "9.5px", fontWeight: 500,
              color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
              lineHeight: 1, marginTop: 2,
            }}>
              Más
            </span>
          </button>
        </div>
      </nav>

      {/* ── BOTTOM SHEET ── */}
      {sheetVisible && (
        <div className="md:hidden fixed inset-0 z-50" style={{ pointerEvents: sheetOpen ? "auto" : "none" }}>
          {/* Backdrop */}
          <div
            onClick={closeSheet}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              opacity: sheetOpen ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: dark ? "#1c1c1e" : "#ffffff",
              borderRadius: "24px 24px 0 0",
              padding: "0 0 env(safe-area-inset-bottom, 16px)",
              maxHeight: "88vh",
              overflowY: "auto",
              transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
            }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
              }} />
            </div>

            {/* User card */}
            <div style={{
              margin: "12px 16px 20px",
              padding: "16px",
              background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              borderRadius: "18px",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "16px", flexShrink: 0,
                background: "linear-gradient(135deg, #34d399, #10b981)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", fontWeight: 700, color: "#fff",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: dark ? "#fff" : "#111", letterSpacing: "-0.01em", margin: 0 }}>
                  {user?.name}
                </p>
                <p style={{ fontSize: "12px", color: dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)", margin: 0, textTransform: "capitalize" }}>
                  {user?.role} · Xylo Sistema
                </p>
              </div>
              <ChevronRight size={16} color={dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"} />
            </div>

            {/* Nav grid */}
            <div style={{ padding: "0 16px", marginBottom: "12px" }}>
              <p style={{
                fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                marginBottom: "12px", paddingLeft: "4px",
              }}>
                Navegación
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {SHEET_LINKS.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to;
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={closeSheet}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "14px 16px",
                        background: isActive
                          ? "rgba(16,185,129,0.10)"
                          : dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        borderRadius: "16px",
                        textDecoration: "none",
                        border: isActive
                          ? "1px solid rgba(16,185,129,0.20)"
                          : `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? "rgba(16,185,129,0.15)" : dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                      }}>
                        <Icon size={17} color={isActive ? "#10b981" : dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"} strokeWidth={isActive ? 2.2 : 1.8} />
                      </div>
                      <span style={{
                        fontSize: "13px", fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#10b981" : dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)",
                        letterSpacing: "-0.01em",
                      }}>
                        {label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Settings row */}
            <div style={{ padding: "0 16px 8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{
                height: "1px",
                background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                margin: "4px 0 10px",
              }} />
              <button
                onClick={() => { toggleTheme(); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px",
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                  borderRadius: "16px", border: "none", cursor: "pointer", width: "100%",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: dark ? "rgba(255,200,0,0.12)" : "rgba(0,0,0,0.05)",
                  }}>
                    {dark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="rgba(0,0,0,0.5)" />}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)" }}>
                    {dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  </span>
                </div>
                <ChevronRight size={15} color={dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} />
              </button>

              <button
                onClick={() => { closeSheet(); logout(); }}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 16px",
                  background: "rgba(239,68,68,0.06)",
                  borderRadius: "16px", border: "1px solid rgba(239,68,68,0.12)",
                  cursor: "pointer", width: "100%",
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(239,68,68,0.10)",
                }}>
                  <LogOut size={17} color="#ef4444" />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#ef4444" }}>
                  Cerrar sesión
                </span>
              </button>
            </div>

            <div style={{ height: 8 }} />
          </div>
        </div>
      )}
    </>
  );
}
