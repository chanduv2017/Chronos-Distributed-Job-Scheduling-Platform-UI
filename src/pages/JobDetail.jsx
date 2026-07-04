import { useCallback, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getJob, getJobHistory, pauseJob, resumeJob, triggerJob, deleteJob } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import './JobDetail.css';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [tab, setTab] = useState('details');

  const fetchJob = useCallback(() => getJob(id), [id]);
  const fetchHistory = useCallback(() => getJobHistory(id), [id]);
  const { data: jobData, loading, error, refetch } = useApi(fetchJob, { deps: [id] });
  const { data: histData } = useApi(fetchHistory, { deps: [id], refreshInterval: 10000 });

  const job = jobData?.data;
  const history = histData?.data || [];

  const handleAction = async (action, label) => {
    try {
      await action(id);
      addToast(`Job ${label}`, 'success');
      refetch();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(id);
      addToast('Job deleted', 'success');
      navigate('/jobs');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading && !job) {
    return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  }

  if (error || !job) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>Job Not Found</h3>
        <p>{error || 'This job does not exist.'}</p>
        <Link to="/jobs" className="btn btn-secondary" style={{ marginTop: '1rem' }}>← Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb & Actions */}
      <div className="detail-top">
        <Link to="/jobs" className="breadcrumb-back">← Jobs</Link>
        <div className="detail-actions">
          {job.status === 'active' && (
            <button className="btn btn-warning btn-sm" onClick={() => handleAction(pauseJob, 'paused')}>⏸ Pause</button>
          )}
          {job.status === 'paused' && (
            <button className="btn btn-success btn-sm" onClick={() => handleAction(resumeJob, 'resumed')}>▶ Resume</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => handleAction(triggerJob, 'triggered')}>⚡ Trigger Now</button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>✕ Delete</button>
        </div>
      </div>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <h1>{job.name}</h1>
        <div className="detail-header-meta">
          <StatusBadge status={job.status} />
          <span className={`type-pill type-${job.type}`}>{job.type}</span>
          <span className="detail-id">{job.id}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Execution History ({history.length})
        </button>
        <button className={`tab ${tab === 'payload' ? 'active' : ''}`} onClick={() => setTab('payload')}>Payload</button>
      </div>

      {/* Tab Content */}
      {tab === 'details' && (
        <div className="detail-grid stagger-children">
          <div className="glass-card detail-card">
            <h3>Schedule</h3>
            <div className="detail-row">
              <span className="detail-label">Type</span>
              <span className="detail-value">{job.type}</span>
            </div>
            {job.cron_expression && (
              <div className="detail-row">
                <span className="detail-label">Cron Expression</span>
                <span className="detail-value" style={{ fontFamily: 'monospace' }}>{job.cron_expression}</span>
              </div>
            )}
            {job.scheduled_at && (
              <div className="detail-row">
                <span className="detail-label">Scheduled At</span>
                <span className="detail-value">{new Date(job.scheduled_at).toLocaleString()}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Next Run</span>
              <span className="detail-value">{job.next_run_at ? new Date(job.next_run_at).toLocaleString() : '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Run</span>
              <span className="detail-value">{job.last_run_at ? new Date(job.last_run_at).toLocaleString() : 'Never'}</span>
            </div>
            {job.timezone && (
              <div className="detail-row">
                <span className="detail-label">Timezone</span>
                <span className="detail-value">{job.timezone}</span>
              </div>
            )}
          </div>

          <div className="glass-card detail-card">
            <h3>Execution</h3>
            <div className="detail-row">
              <span className="detail-label">Handler</span>
              <span className="detail-value" style={{ fontFamily: 'monospace' }}>{job.handler_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Retry Count</span>
              <span className="detail-value">{job.retry_count} / {job.max_retries}</span>
            </div>
            {job.locked_by && (
              <div className="detail-row">
                <span className="detail-label">Locked By</span>
                <span className="detail-value">{job.locked_by}</span>
              </div>
            )}
            {job.last_error && (
              <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                <span className="detail-label">Last Error</span>
                <span className="detail-value error-text" style={{ textAlign: 'left', maxWidth: '100%' }}>{job.last_error}</span>
              </div>
            )}
          </div>

          <div className="glass-card detail-card">
            <h3>Metadata</h3>
            <div className="detail-row">
              <span className="detail-label">Created</span>
              <span className="detail-value">{new Date(job.created_at).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Updated</span>
              <span className="detail-value">{new Date(job.updated_at).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Idempotency Key</span>
              <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>{job.idempotency_key}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="glass-card table-wrapper animate-fade-in">
          {history.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <h3>No executions yet</h3>
              <p>This job hasn't been executed yet.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Worker</th>
                  <th>Attempt</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {history.map((exec) => (
                  <tr key={exec.id}>
                    <td><StatusBadge status={exec.status} /></td>
                    <td className="td-mono">{exec.worker_id}</td>
                    <td>{exec.attempt}</td>
                    <td>{new Date(exec.started_at).toLocaleString()}</td>
                    <td>{exec.duration_ms != null ? `${exec.duration_ms}ms` : '—'}</td>
                    <td className="td-error-cell" title={exec.error_message || ''}>
                      {exec.error_message ? exec.error_message.substring(0, 60) + (exec.error_message.length > 60 ? '…' : '') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'payload' && (
        <div className="glass-card detail-card animate-fade-in">
          <h3>Job Payload</h3>
          <pre className="payload-code">{JSON.stringify(job.payload, null, 2)}</pre>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Job"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete Permanently</button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Delete <strong>{job.name}</strong>? This removes the job and all its execution history permanently.
        </p>
      </Modal>
    </div>
  );
}
