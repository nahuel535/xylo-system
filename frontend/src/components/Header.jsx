export default function Header({ title, subtitle }) {
  return (
    <div className="mb-8">
      {subtitle && (
        <p className="text-sm text-base-muted mb-1 font-medium tracking-wide uppercase text-xs">
          {subtitle}
        </p>
      )}
      <h2 className="text-2xl font-semibold text-base-text tracking-tight">{title}</h2>
    </div>
  );
}