import { useCallback, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { listDLQ, retryDLQ, deleteDLQ } from '../api/client';
import Modal from '../components/Modal';
import './DeadLetterQueue.css';

export default function DeadLetterQueue() {
  const { addToast } = useToast();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDLQ = useCallback(() => listDLQ(), []);
  const { data, loading, error, refetch } = useApi(fetchDLQ, { refreshInterval: 15000 });

  const entries = data?.data || [];
  const total = data?.meta?.total || 0;

  const handleRetry = async (id) => {
    setActionLoading(id);
    try {
      await retryDLQ(id);
      addToast('Job requeued for retry', 'success');
      refetch();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscard = async (id) => {
    setActionLoading(id);
    try {
      await deleteDLQ(id);
      addToast('DLQ entry discarded', 'info');
      refetch();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dead Letter Queue</h1>
        <p>Jobs that permanently failed after exhausting all retries — {total} entries</p>
      </div>

      {loading && !data ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠</div>
          <h3>Failed to load DLQ</h3>
          <p>{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">✓</div>
          <h3>No failed jobs</h3>
          <p>All jobs are executing successfully. The dead letter queue is empty.</p>
        </div>
      ) : (
        <div className="glass-card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Name</th>
                <th>Handler</th>
                <th>Type</th>
                <th>Attempts</th>
                <th>Failed At</th>
                <th>Error</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="td-name">{entry.job_name || '—'}</td>
                  <td className="td-mono">{entry.handler_name}</td>
                  <td>
                    <span className={`type-pill type-${entry.job_type || 'default'}`}>
                      {entry.job_type || '?'}
                    </span>
                  </td>
                  <td>{entry.retry_count}/{entry.max_retries}</td>
                  <td>{formatDate(entry.failed_at)}</td>
                  <td>
                    <button
                      className="error-preview"
                      onClick={() => setSelectedEntry(entry)}
                      title={entry.error_message}
                    >
                      {entry.error_message ? entry.error_message.substring(0, 50) + (entry.error_message.length > 50 ? '…' : '') : '—'}
                    </button>
                  </td>
                  <td>
                    {entry.requeued_at ? (
                      <span className="dlq-requeued">Requeued</span>
                    ) : (
                      <span className="dlq-failed">Dead</span>
                    )}
                  </td>
                  <td>
                    <div className="td-actions">
                      {!entry.requeued_at && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleRetry(entry.id)}
                          disabled={actionLoading === entry.id}
                        >
                          ↻ Retry
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDiscard(entry.id)}
                        disabled={actionLoading === entry.id}
                      >
                        ✕ Discard
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Error Detail Modal */}
      <Modal
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Error Details"
      >
        {selectedEntry && (
          <div className="error-detail">
            <div className="error-detail-row">
              <span className="error-detail-label">Job</span>
              <span>{selectedEntry.job_name || selectedEntry.job_id}</span>
            </div>
            <div className="error-detail-row">
              <span className="error-detail-label">Handler</span>
              <span className="td-mono">{selectedEntry.handler_name}</span>
            </div>
            <div className="error-detail-row">
              <span className="error-detail-label">Attempts</span>
              <span>{selectedEntry.retry_count} / {selectedEntry.max_retries}</span>
            </div>
            <div className="error-detail-section">
              <span className="error-detail-label">Error Message</span>
              <pre className="error-code">{selectedEntry.error_message}</pre>
            </div>
            {selectedEntry.error_stack && (
              <div className="error-detail-section">
                <span className="error-detail-label">Stack Trace</span>
                <pre className="error-code error-stack">{selectedEntry.error_stack}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
}
