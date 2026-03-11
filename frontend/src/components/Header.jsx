export default function Header({ title, subtitle }) {
  return (
    <div className="mb-8">
      <p className="text-sm text-base-muted">{subtitle}</p>
      <h2 className="text-3xl font-semibold">{title}</h2>
    </div>
  );
}