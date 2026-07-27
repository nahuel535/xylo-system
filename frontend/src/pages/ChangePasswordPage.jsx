import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, markPasswordChanged } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      markPasswordChanged();
      navigate(user?.role === "admin" ? "/" : "/products", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto pt-8">
      <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-card">
        <h1 className="text-xl font-semibold text-base-text mb-2">Creá tu contraseña</h1>
        <p className="text-sm text-base-muted mb-6">
          Por seguridad, tenés que reemplazar la contraseña temporal antes de usar el sistema.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput label="Contraseña temporal" value={currentPassword} onChange={setCurrentPassword} />
          <PasswordInput label="Nueva contraseña" value={newPassword} onChange={setNewPassword} />
          <PasswordInput label="Repetir nueva contraseña" value={confirmPassword} onChange={setConfirmPassword} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-xylo-500 text-white px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-sm text-base-muted mb-2">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        autoComplete="new-password"
        className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500"
      />
    </label>
  );
}
