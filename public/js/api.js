/* ===========================================================
   FILE: js/api.js — Talks to the Hono backend over fetch.
   The backend now uses Hono and Neon PostgreSQL, while the
   browser still keeps the auth token in localStorage.
   =========================================================== */

const API = {
  base: '/api',

  getToken() { return localStorage.getItem('hv_token'); },
  setToken(t) { localStorage.setItem('hv_token', t); },
  clearToken() { localStorage.removeItem('hv_token'); },

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(this.base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.clearToken();
      showLoginScreen();
      throw new Error('Session expired, please sign in again');
    }

    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }

    if (!res.ok) throw new Error((data && data.error) || 'Request failed');
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  delete(path) { return this.request('DELETE', path); },
};
