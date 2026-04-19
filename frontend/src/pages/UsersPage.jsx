import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { UserPlus, X, Check } from "lucide-react";

const initialForm = { name: "", email: "", password: "", role: "seller" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/users/", form);
      setMessage(`Usuario ${form.name} creado correctamente.`);
      setForm(initialForm);
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.detail || "Error al crear usuario.");
    } finally {
      setSaving(false);
    }
  }

  const roleColors = {
    admin: "bg-xylo-50 text-xylo-600",
    seller: "bg-blue-50 text-blue-600",
  };

  return (
    <div>
      <Header title="Usuarios" subtitle="Gestión del equipo" />

      {message && (
        <div className="mb-4 flex items-center gap-2 bg-xylo-50 border border-xylo-100 text-xylo-600 rounded-xl px-4 py-3 text-sm">
          <Check size={15} />
          {message}
          <button onClick={() => setMessage("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-base-muted">{users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); }}
          className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition shadow-sm"
        >
          <UserPlus size={15} />
          Nuevo usuario
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-base-card border border-base-border rounded-2xl p-6 mb-5 shadow-card">
          <p className="text-sm font-medium text-base-text mb-4">Crear nuevo usuario</p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-base-muted mb-2">Nombre</p>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Nombre completo"
                  className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
                />
              </div>
              <div>
                <p className="text-sm text-base-muted mb-2">Email</p>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  placeholder="email@ejemplo.com"
                  className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
                />
              </div>
              <div>
                <p className="text-sm text-base-muted mb-2">Contraseña</p>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
                />
              </div>
              <div>
                <p className="text-sm text-base-muted mb-2">Rol</p>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
                >
                  <option value="seller">Vendedor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" disabled={saving} className="bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition">
                {saving ? "Creando..." : "Crear usuario"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); setForm(initialForm); }} className="bg-base-subtle hover:bg-base-border text-base-muted rounded-xl px-4 py-2.5 text-sm transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla — desktop */}
      <div className="hidden md:block bg-base-card border border-base-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-base-subtle border-b border-base-border">
            <tr>
              {["Nombre", "Email", "Rol", "Estado", "Creado"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-base-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="px-5 py-6 text-base-muted text-sm">Cargando usuarios...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="border-t border-base-border hover:bg-base-subtle/50 transition">
                <td className="px-5 py-3.5 font-medium text-base-text">{user.name}</td>
                <td className="px-5 py-3.5 text-base-muted">{user.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[user.role] || "bg-base-subtle text-base-muted"}`}>
                    {user.role === "admin" ? "Admin" : "Vendedor"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {user.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-base-muted text-xs">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-base-muted text-sm">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-base-muted text-sm">No hay usuarios registrados.</p>
        ) : users.map((user) => (
          <div key={user.id} className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar con iniciales */}
              <div className="w-10 h-10 rounded-full bg-xylo-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-xylo-500">
                  {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base-text text-sm truncate">{user.name}</p>
                <p className="text-xs text-base-muted truncate">{user.email}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${user.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {user.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-base-border">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[user.role] || "bg-base-subtle text-base-muted"}`}>
                {user.role === "admin" ? "Admin" : "Vendedor"}
              </span>
              <span className="text-xs text-base-muted">{formatDate(user.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}