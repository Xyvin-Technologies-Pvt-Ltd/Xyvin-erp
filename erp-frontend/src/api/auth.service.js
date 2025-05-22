import api from './api';
import { tryCatch } from '../utils/tryCatchAsync';

export const login = async (data) => {
  try {
    const response = await api.post('/auth/login', {
      email: data.email,
      password: data.password
    });
    console.log('Auth service login response:', response);

    // Check if the response is in the expected format
    if (!response.data) {
      throw new Error('Invalid API response format');
    }

    // Return the data directly since our interceptor already handles the data extraction
    return response.data;
  } catch (error) {
    console.error('Auth service login error:', error);
    // If the error has a response, return the error message from the server
    if (error.response?.data) {
      throw error.response.data;
    }
    // Otherwise throw a generic error
    throw new Error(error.message || 'Login failed');
  }
};

export const forgotPassword = async (data) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

export const logout = async () => {
  const response = await api.get('/auth/logout');
  return response.data;
};

export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updatePassword = async (data) => {
  const response = await api.put('/auth/update-password', data);
  return response.data;
};
