import {
  LayoutDashboard,
  Package,
  PlusSquare,
  BadgeDollarSign,
  ReceiptText,
  Landmark,
  ScanLine,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scanner", label: "Escanear", icon: ScanLine },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/sold-products", label: "Vendidos", icon: BadgeDollarSign },
  { to: "/sales", label: "Ventas", icon: ReceiptText },
  { to: "/exchange", label: "Cotización", icon: Landmark },
  { to: "/products/new", label: "Nuevo producto", icon: PlusSquare },
];
export default function Sidebar() {
  return (
    <aside className="w-72 bg-base-card border-r border-base-border min-h-screen p-6">
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
  );
}