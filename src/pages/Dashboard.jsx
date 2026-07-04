import { useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { getHealthStatus } from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

export default function Dashboard() {
  const fetchStatus = useCallback(() => getHealthStatus(), []);
  const { data, loading, error } = useApi(fetchStatus, { refreshInterval: 5000 });

  if (loading && !data) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠</div>
        <h3>Connection Error</h3>
        <p>Unable to reach the scheduler backend. Make sure it&apos;s running on port 3000.</p>
        <p style={{ color: 'var(--color-error)', marginTop: '0.5rem', fontSize: 'var(--font-size-xs)' }}>{error}</p>
      </div>
    );
  }

  const status = data;
  const jobs = status.jobs || {};
  const recent = status.recentExecutions || {};
  const totalJobs = Object.values(jobs).reduce((a, b) => a + b, 0);
  const totalRecent = Object.values(recent).reduce((a, b) => a + b, 0);
  const successRate = totalRecent > 0
    ? Math.round(((recent.success || 0) / totalRecent) * 100)
    : 100;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time overview of your distributed job scheduler</p>
      </div>

      {/* Top Stats */}
      <div className="stats-grid stagger-children">
        <StatCard label="Total Jobs" value={totalJobs} icon="📋" color="accent" />
        <StatCard label="Active" value={jobs.active || 0} icon="⚡" color="success" subtitle="Running on schedule" />
        <StatCard label="Paused" value={jobs.paused || 0} icon="⏸" color="warning" />
        <StatCard label="Failed" value={jobs.failed_permanent || 0} icon="✕" color="error" subtitle="Permanently failed" />
        <StatCard label="DLQ" value={status.dlq?.postgres || 0} icon="☠" color="error" subtitle={`${status.dlq?.redis || 0} in Redis stream`} />
        <StatCard label="Success Rate" value={`${successRate}%`} icon="✓" color={successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error'} subtitle="Last 1 hour" />
      </div>

      {/* System Info */}
      <div className="dashboard-grid">
        {/* Recent Executions */}
        <div className="glass-card dashboard-section">
          <h3 className="section-title">Executions (Last Hour)</h3>
          <div className="exec-stats">
            {['success', 'failed', 'running', 'dlq'].map((s) => (
              <div key={s} className="exec-stat-row">
                <StatusBadge status={s} />
                <span className="exec-stat-count">{recent[s] || 0}</span>
              </div>
            ))}
          </div>
          {totalRecent > 0 && (
            <div className="exec-bar">
              {recent.success > 0 && (
                <div className="exec-bar-segment exec-bar-success" style={{ width: `${((recent.success || 0) / totalRecent) * 100}%` }} />
              )}
              {recent.failed > 0 && (
                <div className="exec-bar-segment exec-bar-failed" style={{ width: `${((recent.failed || 0) / totalRecent) * 100}%` }} />
              )}
              {recent.running > 0 && (
                <div className="exec-bar-segment exec-bar-running" style={{ width: `${((recent.running || 0) / totalRecent) * 100}%` }} />
              )}
            </div>
          )}
        </div>

        {/* System Details */}
        <div className="glass-card dashboard-section">
          <h3 className="section-title">System Info</h3>
          <div className="sys-info-list">
            <div className="sys-info-row">
              <span className="sys-label">Worker ID</span>
              <span className="sys-value mono">{status.workerId}</span>
            </div>
            <div className="sys-info-row">
              <span className="sys-label">Uptime</span>
              <span className="sys-value">{formatUptime(status.uptime)}</span>
            </div>
            <div className="sys-info-row">
              <span className="sys-label">Stream Pending</span>
              <span className="sys-value">{status.stream?.pending ?? 0}</span>
            </div>
            <div className="sys-info-row">
              <span className="sys-label">Handlers Registered</span>
              <span className="sys-value">{status.handlers?.length ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Registered Handlers */}
        <div className="glass-card dashboard-section dashboard-handlers">
          <h3 className="section-title">Registered Handlers</h3>
          <div className="handlers-list">
            {(status.handlers || []).map((h) => (
              <div key={h.name} className="handler-item">
                <span className="handler-name">{h.name}</span>
                <span className="handler-desc">{h.description || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatUptime(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
