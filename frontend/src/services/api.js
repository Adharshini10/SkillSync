import axios from 'axios';
import { getToken } from '../utils/auth';

/**
 * Centralized Axios instance configured for the Spring Boot backend.
 * Base URL points to the running backend API.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Automatically injects the JWT token in the Authorization header
 * for all authenticated backend requests.
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Catches 401 Unauthorized responses if a token expires or is invalid.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected routes (not /auth/login), clear token and redirect to login
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('skillsync_jwt_token');
        localStorage.removeItem('token');
        localStorage.removeItem('skillsync_user_info');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
