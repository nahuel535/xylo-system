export default function StatCard({ label, value, icon, sub, trend }) {
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card hover:shadow-soft transition-shadow">
      {icon && (
        <div className="mb-3">{icon}</div>
      )}
      <p className="text-xs text-base-muted font-medium uppercase tracking-wide mb-1">{label}</p>
      <h3 className="text-2xl font-semibold text-base-text tracking-tight">{value}</h3>
      {sub && <p className="text-xs text-base-muted mt-1">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs mt-2 font-medium ${trend >= 0 ? "text-xylo-500" : "text-red-500"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
}