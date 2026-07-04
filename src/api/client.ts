const BASE = "";

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE}${path}`;
  const config: RequestInit = {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  };
  const res = await fetch(url, config);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  }
  return data;
}

/* Health */
export const getHealthStatus = () => request("/health/status");
export const getHealthReady = () => request("/health/ready");

/* Jobs */
export function listJobs(params: Record<string, string> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && search.set(k, v));
  const qs = search.toString();
  return request(`/api/jobs${qs ? `?${qs}` : ""}`);
}
export const getJob = (id: string) => request(`/api/jobs/${id}`);
export const getJobHistory = (id: string) => request(`/api/jobs/${id}/history`);
export const createCronJob = (body: object) =>
  request("/api/jobs/cron", { method: "POST", body: JSON.stringify(body) });
export const createDelayedJob = (body: object) =>
  request("/api/jobs/delayed", { method: "POST", body: JSON.stringify(body) });
export const createImmediateJob = (body: object) =>
  request("/api/jobs/immediate", { method: "POST", body: JSON.stringify(body) });
export const updateJob = (id: string, body: object) =>
  request(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const pauseJob = (id: string) => request(`/api/jobs/${id}/pause`, { method: "POST" });
export const resumeJob = (id: string) => request(`/api/jobs/${id}/resume`, { method: "POST" });
export const triggerJob = (id: string) => request(`/api/jobs/${id}/trigger`, { method: "POST" });
export const deleteJob = (id: string) => request(`/api/jobs/${id}`, { method: "DELETE" });

/* DLQ */
export function listDLQ(params: Record<string, string> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && search.set(k, v));
  const qs = search.toString();
  return request(`/api/dlq${qs ? `?${qs}` : ""}`);
}
export const retryDLQ = (id: string) => request(`/api/dlq/${id}/retry`, { method: "POST" });
export const deleteDLQ = (id: string) => request(`/api/dlq/${id}`, { method: "DELETE" });
