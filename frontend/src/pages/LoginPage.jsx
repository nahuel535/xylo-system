import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-bg text-base-text flex items-center justify-center p-6">
      <div className="bg-base-card border border-base-border rounded-2xl p-8 w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Xylo</h1>
          <p className="text-base-muted text-sm mt-1">Sistema interno — iniciá sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-base-muted mb-2">Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <p className="text-sm text-base-muted mb-2">Contraseña</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-xylo-500 hover:bg-xylo-400 disabled:opacity-60 transition text-white rounded-xl px-4 py-3 font-medium"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}