import {
  LayoutDashboard,
  Package,
  PlusSquare,
  BadgeDollarSign,
  ReceiptText,
  Landmark,
  ScanLine,
  X,
  Menu,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/sold-products", label: "Vendidos", icon: BadgeDollarSign },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/exchange", label: "Cotización", icon: Landmark },
  { to: "/products/new", label: "Nuevo", icon: PlusSquare },
];

// Links que aparecen en la bottom bar mobile
const bottomLinks = links.slice(0, 5);
const { user, logout } = useAuth();

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cerrar drawer al navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* ── DESKTOP sidebar ── */}
      <aside className="hidden md:flex w-72 bg-base-card border-r border-base-border min-h-screen p-6 flex-col">
        <div className="mb-10">
          <h1 className="text-xl font-semibold text-base-text">Xylo</h1>
          <p className="text-sm text-base-muted">Sistema interno</p>
        </div>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 ${
                  isActive
                    ? "bg-xylo-500 text-white"
                    : "text-base-muted hover:bg-white/5"
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-base-card border-b border-base-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-base-text">Xylo</h1>
          <p className="text-xs text-base-muted">Sistema interno</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-base-muted hover:bg-white/10 transition"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── MOBILE drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-72 bg-base-card border-r border-base-border h-full p-6 flex flex-col z-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-xl font-semibold text-base-text">Xylo</h1>
                <p className="text-sm text-base-muted">Sistema interno</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-base-muted hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 ${
                      isActive
                        ? "bg-xylo-500 text-white"
                        : "text-base-muted hover:bg-white/5"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ── MOBILE bottom navbar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-card border-t border-base-border flex items-center justify-around px-2 py-2">
        {bottomLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition text-xs ${
                isActive
                  ? "text-xylo-400"
                  : "text-base-muted hover:text-white"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        {/* Botón "más" para abrir drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-base-muted hover:text-white transition text-xs"
        >
          <Menu size={20} />
          <span>Más</span>
        </button>
        <div className="mt-auto pt-6 border-t border-base-border">
  <p className="text-sm text-base-muted px-4 mb-2">{user?.name}</p>
  <button
    onClick={logout}
    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base-muted hover:bg-white/5 w-full"
  >
    <LogOut size={18} />
        <span>Cerrar sesión</span>
          </button>
        </div>
      
      
      </nav>
    </>
  );
}