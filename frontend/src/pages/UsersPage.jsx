import { useEffect, useMemo, useState } from "react";
import {
  Check,
  KeyRound,
  Pencil,
  Power,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";

const initialCreateForm = {
  name: "",
  email: "",
  password: "",
  role: "seller",
  commission_rate: "0",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(initialCreateForm);
  const [resetPassword, setResetPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadUsers(); }, []);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.is_active).length,
    sellers: users.filter((user) => user.role === "seller" && user.is_active).length,
    admins: users.filter((user) => user.role === "admin" && user.is_active).length,
  }), [users]);

  async function loadUsers() {
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setPanel("create");
    setSelectedUser(null);
    setForm(initialCreateForm);
    setError("");
  }

  function openEdit(user) {
    setPanel("edit");
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      commission_rate: String(user.commission_rate ?? 0),
    });
    setError("");
  }

  function openPasswordReset(user) {
    setPanel("password");
    setSelectedUser(user);
    setResetPassword("");
    setError("");
  }

  function closePanel() {
    setPanel(null);
    setSelectedUser(null);
    setResetPassword("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (panel === "create") {
        await api.post("/users/", {
          ...form,
          commission_rate: Number(form.commission_rate || 0),
        });
        setMessage(`Usuario ${form.name} creado correctamente.`);
      } else {
        await api.patch(`/users/${selectedUser.id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          commission_rate: Number(form.commission_rate || 0),
        });
        setMessage(`Datos de ${form.name} actualizados.`);
      }
      closePanel();
      await loadUsers();
    } catch (err) {
      setError(readError(err, "No se pudo guardar el usuario."));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/users/${selectedUser.id}/reset-password`, {
        new_password: resetPassword,
      });
      setMessage(`Contraseña temporal generada para ${selectedUser.name}.`);
      closePanel();
      await loadUsers();
    } catch (err) {
      setError(readError(err, "No se pudo restablecer la contraseña."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user) {
    const action = user.is_active ? "desactivar" : "activar";
    if (!window.confirm(`¿Querés ${action} a ${user.name}?`)) return;
    setError("");
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
      setMessage(`${user.name} quedó ${user.is_active ? "inactivo" : "activo"}.`);
      await loadUsers();
    } catch (err) {
      setError(readError(err, `No se pudo ${action} el usuario.`));
    }
  }

  return (
    <div>
      <Header title="Usuarios" subtitle="Gestión del equipo" />

      {message && <Alert tone="success" onClose={() => setMessage("")}>{message}</Alert>}
      {error && !panel && <Alert tone="error" onClose={() => setError("")}>{error}</Alert>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <SummaryCard icon={Users} label="Usuarios" value={stats.total} />
        <SummaryCard icon={Check} label="Activos" value={stats.active} color="text-green-600" />
        <SummaryCard icon={UserPlus} label="Vendedores" value={stats.sellers} color="text-blue-600" />
        <SummaryCard icon={ShieldCheck} label="Administradores" value={stats.admins} color="text-xylo-500" />
      </div>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-base-muted">
          Administrá accesos, roles, comisiones y contraseñas.
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition shadow-sm"
        >
          <UserPlus size={15} />
          Nuevo usuario
        </button>
      </div>

      {panel && (
        <div className="bg-base-card border border-base-border rounded-2xl p-5 md:p-6 mb-5 shadow-card">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="font-semibold text-base-text">
                {panel === "create" && "Crear nuevo usuario"}
                {panel === "edit" && `Editar a ${selectedUser?.name}`}
                {panel === "password" && `Restablecer contraseña de ${selectedUser?.name}`}
              </p>
              <p className="text-xs text-base-muted mt-1">
                {panel === "password"
                  ? "La contraseña será temporal y deberá cambiarse en el próximo ingreso."
                  : "Los vendedores solo acceden a sus propios datos operativos."}
              </p>
            </div>
            <button onClick={closePanel} className="p-2 text-base-muted hover:text-base-text">
              <X size={17} />
            </button>
          </div>

          {panel === "password" ? (
            <form onSubmit={handlePasswordReset}>
              <Field label="Nueva contraseña temporal">
                <input
                  type="password"
                  minLength={8}
                  maxLength={128}
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className={inputClass}
                />
              </Field>
              {error && <InlineError>{error}</InlineError>}
              <FormActions saving={saving} onCancel={closePanel} submitLabel="Restablecer contraseña" />
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Field label="Nombre completo">
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Nombre completo"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    required
                    placeholder="email@ejemplo.com"
                    className={inputClass}
                  />
                </Field>
                {panel === "create" && (
                  <Field label="Contraseña temporal">
                    <input
                      type="password"
                      minLength={8}
                      maxLength={128}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      required
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      className={inputClass}
                    />
                  </Field>
                )}
                <Field label="Rol">
                  <select
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                    className={inputClass}
                  >
                    <option value="seller">Vendedor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </Field>
                <Field label="Comisión sobre ganancia (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.commission_rate}
                    onChange={(event) => setForm((current) => ({ ...current, commission_rate: event.target.value }))}
                    required
                    className={inputClass}
                  />
                </Field>
              </div>
              {error && <InlineError>{error}</InlineError>}
              <FormActions
                saving={saving}
                onCancel={closePanel}
                submitLabel={panel === "create" ? "Crear usuario" : "Guardar cambios"}
              />
            </form>
          )}
        </div>
      )}

      <div className="hidden md:block bg-base-card border border-base-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-base-subtle border-b border-base-border">
            <tr>
              {["Usuario", "Rol", "Comisión", "Estado", "Creado", "Acciones"].map((heading) => (
                <th key={heading} className="text-left px-5 py-3.5 text-xs font-medium text-base-muted uppercase tracking-wide">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-5 py-6 text-base-muted">Cargando usuarios...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-6 text-base-muted">No hay usuarios registrados.</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="border-t border-base-border hover:bg-base-subtle/50 transition">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-base-text">{user.name}</p>
                  <p className="text-xs text-base-muted mt-0.5">{user.email}</p>
                </td>
                <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                <td className="px-5 py-3.5 text-base-text">{Number(user.commission_rate || 0).toFixed(2)}%</td>
                <td className="px-5 py-3.5"><StatusBadge active={user.is_active} /></td>
                <td className="px-5 py-3.5 text-base-muted text-xs">{formatDate(user.created_at)}</td>
                <td className="px-5 py-3.5">
                  <UserActions
                    user={user}
                    onEdit={openEdit}
                    onPassword={openPasswordReset}
                    onToggle={toggleStatus}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-base-muted text-sm">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-base-muted text-sm">No hay usuarios registrados.</p>
        ) : users.map((user) => (
          <div key={user.id} className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-xylo-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-xylo-500">{initials(user.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base-text text-sm truncate">{user.name}</p>
                <p className="text-xs text-base-muted truncate">{user.email}</p>
              </div>
              <StatusBadge active={user.is_active} />
            </div>
            <div className="flex items-center justify-between py-3 border-y border-base-border mb-3">
              <RoleBadge role={user.role} />
              <span className="text-xs text-base-muted">Comisión {Number(user.commission_rate || 0).toFixed(2)}%</span>
            </div>
            <UserActions
              user={user}
              onEdit={openEdit}
              onPassword={openPasswordReset}
              onToggle={toggleStatus}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-2.5 text-base-text text-sm outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-base-muted mb-2">{label}</span>
      {children}
    </label>
  );
}

function FormActions({ saving, onCancel, submitLabel }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <button type="submit" disabled={saving} className="bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition">
        {saving ? "Guardando..." : submitLabel}
      </button>
      <button type="button" onClick={onCancel} className="bg-base-subtle hover:bg-base-border text-base-muted rounded-xl px-4 py-2.5 text-sm transition">
        Cancelar
      </button>
    </div>
  );
}

function UserActions({ user, onEdit, onPassword, onToggle }) {
  return (
    <div className="flex items-center gap-1.5">
      <ActionButton title="Editar usuario" onClick={() => onEdit(user)} icon={Pencil} />
      <ActionButton title="Restablecer contraseña" onClick={() => onPassword(user)} icon={KeyRound} />
      <ActionButton
        title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
        onClick={() => onToggle(user)}
        icon={Power}
        danger={user.is_active}
      />
    </div>
  );
}

function ActionButton({ title, onClick, icon: Icon, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`p-2 rounded-lg border transition ${danger
        ? "border-red-100 text-red-500 hover:bg-red-50"
        : "border-base-border text-base-muted hover:text-base-text hover:bg-base-subtle"}`}
    >
      <Icon size={15} />
    </button>
  );
}

function SummaryCard({ icon: Icon, label, value, color = "text-base-text" }) {
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 text-base-muted mb-2">
        <Icon size={15} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${role === "admin"
      ? "bg-xylo-50 text-xylo-600"
      : "bg-blue-50 text-blue-600"}`}
    >
      {role === "admin" ? "Administrador" : "Vendedor"}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${active
      ? "bg-green-50 text-green-600"
      : "bg-red-50 text-red-500"}`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function Alert({ tone, onClose, children }) {
  const success = tone === "success";
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${success
      ? "bg-xylo-50 border-xylo-100 text-xylo-600"
      : "bg-red-50 border-red-100 text-red-600"}`}
    >
      {success ? <Check size={15} /> : <X size={15} />}
      <span>{children}</span>
      <button onClick={onClose} className="ml-auto"><X size={14} /></button>
    </div>
  );
}

function InlineError({ children }) {
  return <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{children}</p>;
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function readError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(". ");
  return detail || fallback;
}
