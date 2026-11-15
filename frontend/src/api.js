const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details || {};
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check that the backend is running and try again.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const e = (data && data.error) || {};
    throw new ApiError(res.status, e.code || 'ERROR', e.message || `Request failed (${res.status}).`, e.details);
  }
  return data;
}

export const api = {
  meta: () => request('GET', '/meta'),
  sampleProfile: () => request('GET', '/sample-profile'),
  getProfile: (id) => request('GET', `/profiles/${id}`),
  createProfile: (p) => request('POST', '/profiles', p),
  updateProfile: (id, p) => request('PUT', `/profiles/${id}`, p),
  matches: (id) => request('GET', `/profiles/${id}/matches`),
  matchDetail: (id, oppId) => request('GET', `/profiles/${id}/matches/${oppId}`),
  shortlist: (id) => request('GET', `/profiles/${id}/shortlist`),
  addShortlist: (id, oppId, note = '') => request('PUT', `/profiles/${id}/shortlist/${oppId}`, { note }),
  removeShortlist: (id, oppId) => request('DELETE', `/profiles/${id}/shortlist/${oppId}`),
};
