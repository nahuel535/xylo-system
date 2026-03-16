import {
  LayoutDashboard, Package, PlusSquare, BadgeDollarSign,
  ReceiptText, Landmark, ScanLine, X, Menu, LogOut,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/sold-products", label: "Vendidos", icon: BadgeDollarSign },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/exchange", label: "Cotización", icon: Landmark },
  { to: "/products/new", label: "Nuevo", icon: PlusSquare },
];

const bottomLinks = links.slice(0, 5);

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

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
        <div className="mb-6 px-3 pt-2">
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-7 h-7 bg-xylo-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">X</span>
            </div>
            <h1 className="text-base font-semibold text-base-text tracking-tight">Xylo</h1>
          </div>
          <p className="text-xs text-base-muted pl-9">Sistema interno</p>
        </div>
        <NavItems />
      </aside>

      {/* ── MOBILE top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-base-card/90 backdrop-blur-xl border-b border-base-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-xylo-500 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">X</span>
          </div>
          <h1 className="text-sm font-semibold text-base-text">Xylo</h1>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-base-muted hover:bg-base-subtle transition"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── MOBILE drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-base-card border-r border-base-border h-full p-4 flex flex-col z-10">
            <div className="flex items-center justify-between mb-6 px-3 pt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-xylo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">X</span>
                </div>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-card/90 backdrop-blur-xl border-t border-base-border flex items-center justify-around px-2 py-2">
        {bottomLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition text-xs ${
                isActive ? "text-xylo-500 font-medium" : "text-base-muted hover:text-base-text"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-base-muted hover:text-base-text transition text-xs"
        >
          <Menu size={20} />
          <span>Más</span>
        </button>
      </nav>
    </>
  );
}