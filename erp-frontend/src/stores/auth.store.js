import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import * as authService from '../api/auth.service';
import useHrmStore from './useHrmStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Update user data
      updateUser: (userData) => {
        set({
          user: userData,
          isLoading: false
        });
        localStorage.setItem("user", JSON.stringify(userData));
      },

      // Auth Actions
      login: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authService.login(data);
          console.log("Auth store login response:", response);

          if (!response.success) {
            throw new Error(response.message || "Login failed");
          }

          const token = response.token;
          const userData = response.user;

          if (!userData || !token) {
            throw new Error("Invalid login response format");
          }

          // Set the authentication state
          set({ 
            isAuthenticated: true, 
            user: userData,
            token: token,
            isLoading: false 
          });

          // Store in localStorage
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));
          
          // Set the last login date for daily session management
          const today = new Date().toDateString();
          localStorage.setItem("lastLoginDate", today);

          console.log("User data stored:", userData);
          console.log("Token stored:", token);

          try {
            const nowIso = new Date().toISOString();
            const hrm = useHrmStore.getState();
            await hrm.createBulkAttendance([
              {
                employee: userData.id,
                date: nowIso,
                status: 'Present',
                checkIn: { time: nowIso, device: 'Web' }
              }
            ]);
          } catch (e) {
            console.warn('Auto check-in error:', e?.message || e);
          }

          return { success: true, user: userData };
        } catch (error) {
          console.error("Login error:", error.message);
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          set({
            user: response.data.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          });
          return response;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const currentUser = get().user;
          if (currentUser?.id) {
            const nowIso = new Date().toISOString();
            const hrm = useHrmStore.getState();
            await hrm.createBulkAttendance([
              {
                employee: currentUser.id,
                date: nowIso,
                checkOut: { time: nowIso, device: 'Web' }
              }
            ]);
          }
        } catch (e) {
          console.warn('Auto checkout error:', e?.message || e);
        }

        authService.logout();
        // Clear localStorage items
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("lastLoginDate");
        // Reset store state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.updateProfile(userData);
          set({
            user: response.data.user,
            isLoading: false
          });
          return response;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Profile update failed',
            isLoading: false
          });
          throw error;
        }
      },

      updatePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.updatePassword(passwordData);
          set({
            token: response.token,
            isLoading: false
          });
          return response;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Password update failed',
            isLoading: false
          });
          throw error;
        }
      },

      // Selectors
      getUser: () => get().user,
      getToken: () => get().token,
      isUserAuthenticated: () => get().isAuthenticated,
    }),
    {
      name: 'auth-storage',
      storage: localStorage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore; 