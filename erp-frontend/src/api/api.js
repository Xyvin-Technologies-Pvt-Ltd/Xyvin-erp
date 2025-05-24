import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  // baseURL: 'https://erp-backend-189792861103.us-central1.run.app/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // Increased timeout to 30 seconds
  retryDelay: 1000, // Wait 1 second between retries
  maxRetries: 3, // Maximum number of retries
});

// Request Interceptor
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

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is a timeout error and we haven't retried yet
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        return await api(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
