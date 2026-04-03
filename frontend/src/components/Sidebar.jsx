import {
  LayoutDashboard, Package, PlusSquare, BadgeDollarSign,
  ReceiptText, Landmark, ScanLine, X, Menu, LogOut, Sun, Moon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";
import { Users } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/sold-products", label: "Vendidos", icon: BadgeDollarSign },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/exchange", label: "Cotización", icon: Landmark },
  { to: "/products/new", label: "Nuevo", icon: PlusSquare },
  { to: "/users", label: "Usuarios", icon: Users },
];

const bottomLinks = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const NavItems = ({ onNavigate }) => (
    <nav className="flex-1 flex flex-col">
      <div className="space-y-0.5 flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
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
  );

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
        <NavItems />
      </aside>

      {/* ── MOBILE top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-base-card/90 backdrop-blur-xl border-b border-base-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-base-muted hover:bg-base-subtle transition"
          aria-label="Cambiar tema"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Xylo" className="w-6 h-6 rounded-lg" />
          <h1 className="text-sm font-semibold text-base-text">Xylo</h1>
        </div>
        {/* spacer para mantener logo centrado */}
        <div className="w-9" />
      </div>

      {/* ── MOBILE drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-base-card border-r border-base-border h-full p-4 flex flex-col z-10">
            <div className="flex items-center justify-between mb-6 px-2 pt-2">
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="Xylo" className="w-7 h-7 rounded-xl" />
                <h1 className="text-base font-semibold text-base-text">Xylo</h1>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-base-muted hover:bg-base-subtle transition"
              >
                <X size={18} />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── MOBILE bottom navbar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-card/95 backdrop-blur-2xl border-t border-base-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around px-3 pt-2 pb-2">
          {bottomLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-all ${
                  isActive ? "text-xylo-500" : "text-base-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                    isActive ? "bg-xylo-500/12" : ""
                  }`}>
                    <Icon size={isActive ? 21 : 20} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className={`text-[10px] leading-none font-medium transition-all duration-200 ${
                    isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                  }`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 text-base-muted transition-all"
          >
            <span className="flex items-center justify-center w-10 h-7 rounded-full">
              <Menu size={20} strokeWidth={1.8} />
            </span>
            <span className="text-[10px] leading-none font-medium opacity-0 h-0 overflow-hidden">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}