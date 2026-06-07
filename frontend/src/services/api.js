import axios from 'axios';

// ── Create Axios Instance with Base Config ──────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
    // Request timeout after 10 seconds

  timeout: 10000,
});

// ── Response Interceptor — Handle 401 Unauthorized Errors ────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

    // If 401 (token expired/invalid) — clear auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
            // Redirect to login page

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;