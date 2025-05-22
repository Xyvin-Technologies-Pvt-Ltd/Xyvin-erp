import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/auth.store';
import api from '../api/auth.service';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    clearError
  } = useAuthStore();

  // Set up axios interceptor for authentication
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token, logout, navigate]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    clearError,

    // Helper methods
    isAdmin: () => user?.role === 'admin',
    hasPermission: (permission) => user?.permissions?.includes(permission),
  };
};

// Also export as default for flexibility
export default useAuth; 