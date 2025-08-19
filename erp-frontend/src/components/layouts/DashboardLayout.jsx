import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/navigation/Sidebar';
import Header from '@/components/navigation/Header';
import { Link } from 'react-router-dom';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main 
        className="py-10"
        >
          <div 
          className="px-4 sm:px-6 lg:px-8"
          >
            <Outlet />
          </div>
        </main>
        <Link
          to="/chat"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700"
          title="Open Chat"
        >
          <span className="sr-only">Chat</span>
          
        </Link>
      </div>
    </div>
  );
};

export default DashboardLayout; 