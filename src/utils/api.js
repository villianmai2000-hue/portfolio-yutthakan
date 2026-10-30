const BASE_URL = '/api';

export function getToken() {
  return localStorage.getItem('yutthakan_token');
}

export function setToken(token) {
  localStorage.setItem('yutthakan_token', token);
}

export function removeToken() {
  localStorage.removeItem('yutthakan_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  requestOtp: (contact) => request('/auth/otp/request', { method: 'POST', body: JSON.stringify({ contact }) }),
  verifyOtpAndReset: (otp, newPassword) => request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ otp, newPassword }) }),

  // Profile & Settings
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (name) => request('/categories', { method: 'POST', body: JSON.stringify({ category: name }) }),
  addCategory: (category) => request('/categories', { method: 'POST', body: JSON.stringify({ category }) }),
  deleteCategory: (name) => request(`/categories/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // Projects
  getProjects: () => request('/projects'),
  getProjectById: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Contact & Inquiries
  submitContact: (data) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),
  getMessages: () => request('/contact'),
  updateMessageStatus: (id, status) => request(`/contact/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteMessage: (id) => request(`/contact/${id}`, { method: 'DELETE' }),

  // Rebar BBS & Real-Time Sync (AutoCAD & SketchUp)
  getRebarItems: () => request('/rebar'),
  getRebarSummary: () => request('/rebar/summary'),
  createRebarItem: (data) => request('/rebar', { method: 'POST', body: JSON.stringify(data) }),
  updateRebarItem: (id, data) => request(`/rebar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRebarItem: (id) => request(`/rebar/${id}`, { method: 'DELETE' }),
  syncRebarItems: (items) => request('/rebar/sync', { method: 'POST', body: JSON.stringify({ items }) }),
  getAutoCADPluginUrl: () => `${BASE_URL}/rebar/plugin/autocad.lsp`,
  getSketchUpPluginUrl: () => `${BASE_URL}/rebar/plugin/sketchup.rb`,
  getRebarCsvUrl: () => `${BASE_URL}/rebar/export/bbs.csv`,
  getRebarXlsxUrl: () => `${BASE_URL}/rebar/export/bbs.xlsx`,

  // Rebar Offcut Inventory & Reuse Management
  getRebarOffcuts: () => request('/rebar/offcuts'),
  updateRebarOffcut: (id, data) => request(`/rebar/offcuts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markOffcutUsed: (id, usedFor) => request(`/rebar/offcuts/${id}/use`, { method: 'POST', body: JSON.stringify({ usedFor }) }),
  deleteRebarOffcut: (id) => request(`/rebar/offcuts/${id}`, { method: 'DELETE' }),

  // Private Vault (PIN Lock)
  verifyVaultPin: (pin) => request('/vault/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  setVaultPin: (newPin) => request('/vault/set-pin', { method: 'POST', body: JSON.stringify({ newPin }) }),
  changeVaultPin: (newPin) => request('/vault/set-pin', { method: 'POST', body: JSON.stringify({ newPin }) }),
  getVaultItems: () => request('/vault/items'),
  addVaultItem: (item) => request('/vault/items', { method: 'POST', body: JSON.stringify(item) }),
  deleteVaultItem: (id) => request(`/vault/items/${id}`, { method: 'DELETE' }),

  // Construction Site Logs & Inspection
  getSiteLogs: () => request('/site-logs'),
  createSiteLog: (data) => request('/site-logs', { method: 'POST', body: JSON.stringify(data) }),
  updateSiteLog: (id, data) => request(`/site-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSiteLog: (id) => request(`/site-logs/${id}`, { method: 'DELETE' }),
  submitSiteFeedback: (id, feedback) => request(`/site-logs/${id}/feedback`, { method: 'POST', body: JSON.stringify(feedback) }),
  acknowledgeSiteLog: (id, statusData) => request(`/site-logs/${id}/acknowledge`, { method: 'PUT', body: JSON.stringify(statusData) }),
  respondFeedback: (id, feedbackIndex, responseData) => request(`/site-logs/${id}/feedback/${feedbackIndex}/respond`, { method: 'PUT', body: JSON.stringify(responseData) }),

  // File Upload (Admin & Public)
  uploadFile: (data) => request('/upload', { method: 'POST', body: JSON.stringify(data) }),
  uploadFilePublic: (data) => request('/upload-public', { method: 'POST', body: JSON.stringify(data) }),

  // System Status & Backup
  getStatus: () => request('/status'),
  getSystemStatus: () => request('/status'),
  getBackupUrl: () => `${BASE_URL}/backup`
};
