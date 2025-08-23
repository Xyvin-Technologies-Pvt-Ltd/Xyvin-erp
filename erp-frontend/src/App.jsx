import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';
import { useEffect } from 'react';
import useAuthStore from './stores/auth.store';
import { toast } from 'react-hot-toast';

const DailySessionManager = () => {
  const { logout, user } = useAuthStore();

  useEffect(() => {
    const checkDailySession = () => {
      const token = localStorage.getItem("token");
      if (!token || !user) return;

      const now = new Date();
      const today = now.toDateString();
      
      const lastLoginDate = localStorage.getItem("lastLoginDate");
      
      if (!lastLoginDate || lastLoginDate !== today) {
        localStorage.setItem("lastLoginDate", today);
        return;
      }

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour === 23 && currentMinute >= 59) {
        console.log("End of day reached, auto-logging out user");
        toast.success("End of day reached. You have been automatically logged out. Please login again tomorrow.");
        logout();
        return;
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = localStorage.getItem("token");
        if (!token || !user) return;

        const now = new Date();
        const today = now.toDateString();
        const lastLoginDate = localStorage.getItem("lastLoginDate");

        if (!lastLoginDate || lastLoginDate !== today) {
          console.log("New day detected on page visibility, logging out user");
          toast.success("New day detected. You have been automatically logged out. Please login again.");
          logout();
        }
      }
    };

    checkDailySession();

    const interval = setInterval(checkDailySession, 60000); // Check every minute

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logout, user]);

  return null; // This component doesn't render anything
};

function App() {
  return (
    <>
      <DailySessionManager />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App; 