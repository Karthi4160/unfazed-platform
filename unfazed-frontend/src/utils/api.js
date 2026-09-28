import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Don't auto-logout on 401 anymore — let the components handle it
    if (err.response?.status === 401) {
      console.warn('[API] 401 on', err.config?.url, err.response?.data);
      // Uncomment below if you want auto-logout on token expiry ONLY:
      // const url = err.config?.url || '';
      // if (!url.includes('/auth/')) {
      //   localStorage.removeItem('token');
      //   window.location.href = '/login';
      // }
    }
    return Promise.reject(err);
  }
);

export default api;