import './StatusBadge.css';

const STATUS_CONFIG = {
  active: { label: 'Active', className: 'badge-success' },
  paused: { label: 'Paused', className: 'badge-warning' },
  completed: { label: 'Completed', className: 'badge-info' },
  failed_permanent: { label: 'Failed', className: 'badge-error' },
  running: { label: 'Running', className: 'badge-accent' },
  success: { label: 'Success', className: 'badge-success' },
  failed: { label: 'Failed', className: 'badge-error' },
  timeout: { label: 'Timeout', className: 'badge-warning' },
  dlq: { label: 'DLQ', className: 'badge-error' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge-default' };

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="badge-dot" />
      {config.label}
    </span>
  );
}
