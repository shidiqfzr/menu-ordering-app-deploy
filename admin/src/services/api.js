import axios from 'axios';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
});

// Flag to prevent multiple redundant redirect / expiration toasts
let isHandlingExpiration = false;

// ── Request Interceptor: Automatically Attach Auth Token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (token) {
      config.headers['token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor: Global 401 / 403 Session Expiration Handling ──
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;

    if ((status === 401 || status === 403) && !isHandlingExpiration) {
      const currentPath = window.location.pathname;

      // Only redirect if not already on the login page
      if (currentPath !== '/login') {
        isHandlingExpiration = true;

        // Clear stale credentials from both storage types
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');

        toast.warn('Sesi Anda telah berakhir. Silakan login kembali.', {
          toastId: 'session-expired-toast',
          autoClose: 4000,
        });

        // Trigger custom event so AuthContext state updates immediately if active
        window.dispatchEvent(new CustomEvent('admin-auth-expired'));

        // Smooth redirect to login
        setTimeout(() => {
          window.location.href = '/login?expired=true';
          isHandlingExpiration = false;
        }, 800);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
