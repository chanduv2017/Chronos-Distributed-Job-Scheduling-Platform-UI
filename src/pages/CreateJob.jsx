import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { createCronJob, createDelayedJob, createImmediateJob } from '../api/client';
import './CreateJob.css';

const JOB_TYPES = [
  { value: 'cron', label: 'Cron (Recurring)', icon: '🔄', desc: 'Runs on a schedule using cron expressions' },
  { value: 'delayed', label: 'Delayed (One-time)', icon: '⏰', desc: 'Runs once at a specific future time' },
  { value: 'immediate', label: 'Immediate', icon: '⚡', desc: 'Runs as soon as possible' },
];

export default function CreateJob() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [type, setType] = useState('cron');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    handlerName: '',
    cronExpression: '',
    scheduledAt: '',
    payload: '{}',
    maxRetries: 5,
    timezone: 'UTC',
    idempotencyKey: '',
  });
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.handlerName.trim()) errs.handlerName = 'Handler is required';

    if (type === 'cron' && !form.cronExpression.trim()) {
      errs.cronExpression = 'Cron expression is required';
    }

    if (type === 'delayed') {
      if (!form.scheduledAt) errs.scheduledAt = 'Scheduled time is required';
      else if (new Date(form.scheduledAt) <= new Date()) errs.scheduledAt = 'Must be in the future';
    }

    try {
      JSON.parse(form.payload);
    } catch {
      errs.payload = 'Invalid JSON';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = JSON.parse(form.payload);
      const base = {
        name: form.name.trim(),
        handlerName: form.handlerName.trim(),
        payload,
        maxRetries: parseInt(form.maxRetries),
        ...(form.idempotencyKey.trim() ? { idempotencyKey: form.idempotencyKey.trim() } : {}),
      };

      let result;
      if (type === 'cron') {
        result = await createCronJob({
          ...base,
          cronExpression: form.cronExpression.trim(),
          timezone: form.timezone,
        });
      } else if (type === 'delayed') {
        result = await createDelayedJob({
          ...base,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
        });
      } else {
        result = await createImmediateJob(base);
      }

      addToast(`Job "${form.name}" created successfully!`, 'success');
      navigate(`/jobs/${result.data.id}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Create Job</h1>
        <p>Schedule a new cron, delayed, or immediate job</p>
      </div>

      {/* Type Selector */}
      <div className="type-selector stagger-children">
        {JOB_TYPES.map((t) => (
          <button
            key={t.value}
            className={`type-option glass-card ${type === t.value ? 'type-option-active' : ''}`}
            onClick={() => setType(t.value)}
            type="button"
          >
            <span className="type-option-icon">{t.icon}</span>
            <span className="type-option-label">{t.label}</span>
            <span className="type-option-desc">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <form className="create-form glass-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Job Name *</label>
            <input
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Hourly Cleanup"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Handler Name *</label>
            <input
              className={`form-input ${errors.handlerName ? 'input-error' : ''}`}
              value={form.handlerName}
              onChange={(e) => updateField('handlerName', e.target.value)}
              placeholder="e.g. db-cleanup"
            />
            {errors.handlerName && <span className="form-error">{errors.handlerName}</span>}
            <span className="form-hint">Must match a registered handler on the backend</span>
          </div>

          {type === 'cron' && (
            <>
              <div className="form-group">
                <label className="form-label">Cron Expression *</label>
                <input
                  className={`form-input ${errors.cronExpression ? 'input-error' : ''}`}
                  value={form.cronExpression}
                  onChange={(e) => updateField('cronExpression', e.target.value)}
                  placeholder="*/5 * * * *"
                  style={{ fontFamily: 'monospace' }}
                />
                {errors.cronExpression && <span className="form-error">{errors.cronExpression}</span>}
                <span className="form-hint">Standard 5-field: minute hour day-of-month month day-of-week</span>
              </div>

              <div className="form-group">
                <label className="form-label">Timezone</label>
                <input
                  className="form-input"
                  value={form.timezone}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  placeholder="UTC"
                />
              </div>
            </>
          )}

          {type === 'delayed' && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Scheduled At *</label>
              <input
                type="datetime-local"
                className={`form-input ${errors.scheduledAt ? 'input-error' : ''}`}
                value={form.scheduledAt}
                onChange={(e) => updateField('scheduledAt', e.target.value)}
              />
              {errors.scheduledAt && <span className="form-error">{errors.scheduledAt}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Max Retries</label>
            <input
              type="number"
              className="form-input"
              value={form.maxRetries}
              onChange={(e) => updateField('maxRetries', e.target.value)}
              min="0"
              max="20"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Idempotency Key</label>
            <input
              className="form-input"
              value={form.idempotencyKey}
              onChange={(e) => updateField('idempotencyKey', e.target.value)}
              placeholder="Optional — prevents duplicate creation"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Payload (JSON)</label>
            <textarea
              className={`form-textarea payload-textarea ${errors.payload ? 'input-error' : ''}`}
              value={form.payload}
              onChange={(e) => updateField('payload', e.target.value)}
              rows={5}
              spellCheck={false}
            />
            {errors.payload && <span className="form-error">{errors.payload}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/jobs')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><span className="spinner" /> Creating...</> : `Create ${type} job`}
          </button>
        </div>
      </form>
    </div>
  );
}
