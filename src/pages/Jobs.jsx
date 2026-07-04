import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { listJobs, pauseJob, resumeJob, triggerJob, deleteJob } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import './Jobs.css';

export default function Jobs() {
  const { addToast } = useToast();
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchJobs = useCallback(() => listJobs(filters), [filters.status, filters.type]);
  const { data, loading, error, refetch } = useApi(fetchJobs, {
    deps: [filters.status, filters.type],
    refreshInterval: 10000,
  });

  const handleAction = async (action, id, label) => {
    setActionLoading(id);
    try {
      await action(id);
      addToast(`Job ${label} successfully`, 'success');
      refetch();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await handleAction(deleteJob, deleteTarget, 'deleted');
    setDeleteTarget(null);
  };

  const jobs = data?.data || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Jobs</h1>
            <p>Manage all scheduled, delayed, and immediate jobs</p>
          </div>
          <Link to="/jobs/new" className="btn btn-primary">＋ Create Job</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="failed_permanent">Failed</option>
        </select>
        <select
          className="form-select"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="cron">Cron</option>
          <option value="delayed">Delayed</option>
          <option value="immediate">Immediate</option>
        </select>
        <span className="filter-count">{jobs.length} jobs</span>
      </div>

      {/* Table */}
      {loading && !data ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠</div>
          <h3>Failed to load jobs</h3>
          <p>{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No jobs found</h3>
          <p>Create your first job to get started.</p>
          <Link to="/jobs/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>＋ Create Job</Link>
        </div>
      ) : (
        <div className="glass-card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Handler</th>
                <th>Schedule</th>
                <th>Next Run</th>
                <th>Retries</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link to={`/jobs/${job.id}`} className="td-name job-name-link">{job.name}</Link>
                  </td>
                  <td>
                    <span className={`type-pill type-${job.type}`}>{job.type}</span>
                  </td>
                  <td><StatusBadge status={job.status} /></td>
                  <td className="td-mono">{job.handler_name}</td>
                  <td className="td-mono">
                    {job.type === 'cron' ? job.cron_expression : job.type === 'delayed' ? formatDate(job.scheduled_at) : '—'}
                  </td>
                  <td>{job.next_run_at ? formatDate(job.next_run_at) : '—'}</td>
                  <td>{job.retry_count}/{job.max_retries}</td>
                  <td>
                    <div className="td-actions">
                      {job.status === 'active' && (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleAction(pauseJob, job.id, 'paused')}
                          disabled={actionLoading === job.id}
                        >⏸ Pause</button>
                      )}
                      {job.status === 'paused' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAction(resumeJob, job.id, 'resumed')}
                          disabled={actionLoading === job.id}
                        >▶ Resume</button>
                      )}
                      {(job.status === 'active' || job.status === 'paused') && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAction(triggerJob, job.id, 'triggered')}
                          disabled={actionLoading === job.id}
                        >⚡ Trigger</button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(job.id)}
                        disabled={actionLoading === job.id}
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Job"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Are you sure you want to permanently delete this job? This action cannot be undone.
          All execution history will also be removed.
        </p>
      </Modal>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
}
