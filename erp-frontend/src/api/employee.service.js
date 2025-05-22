import api from './api';
import { tryCatch } from '../utils/tryCatchAsync';
import { ssrExportAllKey } from 'vite/runtime';



export const getEmployees = tryCatch(async () => {
  const response = await api.get('/hrm/employees');
  return response.data;
});

export const getEmployee = tryCatch(async (id) => {
  const response = await api.get(`/hrm/employees/${id}`);
  return response.data;
});

