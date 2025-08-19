import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '@/components/navigation/Sidebar';
import Header from '@/components/navigation/Header';
import useChatStore from '@/stores/chatStore';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';
  const { fetchConversations, unreadCount } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        {!isChatRoute && (
          <Link
            to="/chat"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1e2251' }}
            title="Open Chat"
          >
            <span className="sr-only">Chat</span>
            <div className="relative flex items-center justify-center h-full w-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;