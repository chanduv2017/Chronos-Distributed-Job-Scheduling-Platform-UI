import './StatCard.css';

export default function StatCard({ label, value, icon, color = 'accent', subtitle }) {
  return (
    <div className={`stat-card glass-card stat-${color}`}>
      <div className="stat-icon-wrapper">
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value ?? '—'}</span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
