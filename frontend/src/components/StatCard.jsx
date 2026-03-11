export default function StatCard({ label, value }) {
  return (
    <div className="bg-base-card border border-base-border rounded-xl p-6">
      <p className="text-sm text-base-muted">{label}</p>
      <h3 className="text-2xl font-semibold mt-2">{value}</h3>
    </div>
  );
}