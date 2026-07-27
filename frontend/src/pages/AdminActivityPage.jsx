import { useCallback, useEffect, useState } from "react";
import { History, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";


const ACTIONS = {
  created: ["Creado", "bg-blue-50 text-blue-600"],
  updated: ["Editado", "bg-xylo-500/10 text-xylo-500"],
  deleted: ["En papelera", "bg-red-50 text-red-500"],
  restored: ["Restaurado", "bg-green-50 text-green-600"],
  activated: ["Activado", "bg-green-50 text-green-600"],
  deactivated: ["Desactivado", "bg-amber-50 text-amber-600"],
  password_reset: ["Contraseña restablecida", "bg-purple-50 text-purple-600"],
  sold: ["Vendido", "bg-green-50 text-green-600"],
};

const ENTITIES = {
  product: "Producto",
  sale: "Venta",
  client: "Cliente",
  appointment: "Turno",
  quote: "Presupuesto",
  user: "Usuario",
};


export default function AdminActivityPage() {
  const [tab, setTab] = useState("activity");
  const [activity, setActivity] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activityResponse, trashResponse] = await Promise.all([
        api.get("/admin/activity"),
        api.get("/admin/trash"),
      ]);
      setActivity(activityResponse.data);
      setTrash(trashResponse.data);
    } catch {
      setError("No se pudo cargar la actividad administrativa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function restore(item) {
    setRestoring(item.id);
    setError("");
    try {
      const { data } = await api.post(`/admin/trash/${item.id}/restore`);
      setMessage(data.message);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "No se pudo restaurar el elemento.");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div>
      <Header title="Auditoría y papelera" subtitle="Control administrativo" />

      {message && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-5">
        <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={History}>
          Actividad
        </TabButton>
        <TabButton active={tab === "trash"} onClick={() => setTab("trash")} icon={Trash2}>
          Papelera {trash.length > 0 && `(${trash.length})`}
        </TabButton>
      </div>

      {loading ? (
        <p className="text-sm text-base-muted py-6">Cargando...</p>
      ) : tab === "activity" ? (
        <ActivityList rows={activity} />
      ) : (
        <TrashList rows={trash} restoring={restoring} onRestore={restore} />
      )}
    </div>
  );
}

function ActivityList({ rows }) {
  if (rows.length === 0) return <Empty icon={History} text="Todavía no hay actividad registrada." />;
  return (
    <div className="bg-base-card border border-base-border rounded-2xl shadow-card overflow-hidden">
      <div className="divide-y divide-base-border">
        {rows.map((row) => {
          const [actionLabel, actionClass] = ACTIONS[row.action] || [row.action, "bg-base-subtle text-base-muted"];
          return (
            <div key={row.id} className="flex items-start gap-3 px-4 md:px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-base-subtle text-base-muted flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionClass}`}>{actionLabel}</span>
                  <span className="text-sm font-medium text-base-text">
                    {ENTITIES[row.entity_type] || row.entity_type} #{row.entity_id}
                  </span>
                </div>
                <p className="text-xs text-base-muted mt-1">
                  {row.user_name} · {formatDate(row.created_at)}
                </p>
                {row.changes && (
                  <p className="text-xs text-base-muted mt-2 truncate">
                    Campos: {Object.keys(row.changes).join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrashList({ rows, restoring, onRestore }) {
  if (rows.length === 0) return <Empty icon={Trash2} text="La papelera está vacía." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map((row) => (
        <div key={row.id} className="bg-base-card border border-base-border rounded-2xl p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-50 text-red-500">
              <Trash2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-base-text truncate">{row.label}</p>
              <p className="text-xs text-base-muted mt-1">
                {ENTITIES[row.entity_type] || row.entity_type} · eliminado por {row.deleted_by_name}
              </p>
              <p className="text-[11px] text-base-muted mt-0.5">{formatDate(row.deleted_at)}</p>
            </div>
          </div>
          <button
            onClick={() => onRestore(row)}
            disabled={restoring === row.id}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 py-2.5 text-sm font-semibold transition disabled:opacity-60"
          >
            <RotateCcw size={14} />
            {restoring === row.id ? "Restaurando..." : "Restaurar"}
          </button>
        </div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${active
        ? "bg-xylo-500 text-white"
        : "bg-base-card border border-base-border text-base-muted hover:text-base-text"}`}
    >
      <Icon size={15} /> {children}
    </button>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-12 text-center">
      <Icon size={30} className="text-base-muted mx-auto mb-3 opacity-50" />
      <p className="text-sm text-base-muted">{text}</p>
    </div>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
