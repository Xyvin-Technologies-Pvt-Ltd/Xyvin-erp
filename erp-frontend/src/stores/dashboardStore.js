import { create } from 'zustand';
import dashboardService from '@/api/dashboard.service';

const useDashboardStore = create((set) => ({
  stats: null,
  attendanceData: null,
  departmentData: null,
  loading: {
    stats: false,
    attendance: false,
    departments: false
  },
  error: null,

  fetchStats: async () => {
    set((state) => ({ loading: { ...state.loading, stats: true } }));
    try {
      const response = await dashboardService.getStats();
      set((state) => ({
        stats: response,
        loading: { ...state.loading, stats: false }
      }));
    } catch (error) {
      set((state) => ({
        error: error.message,
        loading: { ...state.loading, stats: false }
      }));
    }
  },

  fetchAttendance: async () => {
    set((state) => ({ loading: { ...state.loading, attendance: true } }));
    try {
      const response = await dashboardService.getAttendance();
      set((state) => ({
        attendanceData: response,
        loading: { ...state.loading, attendance: false }
      }));
    } catch (error) {
      set((state) => ({
        error: error.message,
        loading: { ...state.loading, attendance: false }
      }));
    }
  },

  fetchDepartments: async () => {
    set((state) => ({ loading: { ...state.loading, departments: true } }));
    try {
      const response = await dashboardService.getDepartments();
      set((state) => ({
        departmentData: response,
        loading: { ...state.loading, departments: false }
      }));
    } catch (error) {
      set((state) => ({
        error: error.message,
        loading: { ...state.loading, departments: false }
      }));
    }
  }
}));

export default useDashboardStore; 