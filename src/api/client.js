/**
 * API client for the job scheduler backend.
 * All requests go through the Vite dev proxy (see vite.config.js).
 */

const BASE = '';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(url, config);

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return data;
}

/* ---- Health ---- */
export function getHealthStatus() {
  return request('/health/status');
}

export function getHealthReady() {
  return request('/health/ready');
}

/* ---- Jobs ---- */
export function listJobs(params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.type) search.set('type', params.type);
  if (params.limit) search.set('limit', params.limit);
  if (params.offset) search.set('offset', params.offset);
  const qs = search.toString();
  return request(`/api/jobs${qs ? `?${qs}` : ''}`);
}

export function getJob(id) {
  return request(`/api/jobs/${id}`);
}

export function getJobHistory(id) {
  return request(`/api/jobs/${id}/history`);
}

export function createCronJob(body) {
  return request('/api/jobs/cron', { method: 'POST', body: JSON.stringify(body) });
}

export function createDelayedJob(body) {
  return request('/api/jobs/delayed', { method: 'POST', body: JSON.stringify(body) });
}

export function createImmediateJob(body) {
  return request('/api/jobs/immediate', { method: 'POST', body: JSON.stringify(body) });
}

export function updateJob(id, body) {
  return request(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function pauseJob(id) {
  return request(`/api/jobs/${id}/pause`, { method: 'POST' });
}

export function resumeJob(id) {
  return request(`/api/jobs/${id}/resume`, { method: 'POST' });
}

export function triggerJob(id) {
  return request(`/api/jobs/${id}/trigger`, { method: 'POST' });
}

export function deleteJob(id) {
  return request(`/api/jobs/${id}`, { method: 'DELETE' });
}

/* ---- DLQ ---- */
export function listDLQ(params = {}) {
  const search = new URLSearchParams();
  if (params.limit) search.set('limit', params.limit);
  if (params.offset) search.set('offset', params.offset);
  const qs = search.toString();
  return request(`/api/dlq${qs ? `?${qs}` : ''}`);
}

export function retryDLQ(id) {
  return request(`/api/dlq/${id}/retry`, { method: 'POST' });
}

export function deleteDLQ(id) {
  return request(`/api/dlq/${id}`, { method: 'DELETE' });
}
