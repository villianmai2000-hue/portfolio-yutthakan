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

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Projects
  getProjects: () => request('/projects'),
  getProjectById: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Contact Messages
  submitContact: (data) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),
  getMessages: () => request('/contact'),
  updateMessageStatus: (id, status) => request(`/contact/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // System & Backup
  getStatus: () => request('/status'),
  getBackupUrl: () => `${BASE_URL}/backup`
};
