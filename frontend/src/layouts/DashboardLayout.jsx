import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/common/DashboardSidebar';

export default function DashboardLayout({ navItems, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar items={navItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3"><button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Menu">
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">{title || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" aria-label="Notifications"><Bell size={20} /></button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
