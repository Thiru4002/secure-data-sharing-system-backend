import axios from 'axios';

const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const RENDER_ORIGIN = 'https://secure-data-sharing-system.onrender.com/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || LOCAL_API_BASE_URL;
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const HEALTH_CHECK_ORIGINS = Array.from(
  new Set([
    API_ORIGIN,
    import.meta.env.VITE_HEALTH_CHECK_ORIGIN || RENDER_ORIGIN,
  ])
);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor - attach token
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

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthFormRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (error.response?.status === 401 && !isAuthFormRequest) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
