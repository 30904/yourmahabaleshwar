import { Menu, Search, Bell, MessageSquare, Plus, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminHeader({ onMenuClick, breadcrumbs = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="flex items-center gap-3">
        <button type="button" className="admin-header-btn lg:hidden" onClick={onMenuClick} aria-label="Menu">
          <Menu size={20} />
        </button>
        <nav className="hidden text-sm text-slate-500 md:flex md:items-center md:gap-1">
          {breadcrumbs.map((b, i) => (
            <span key={b} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'font-medium text-slate-800' : ''}>{b}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="admin-header-search mx-4 hidden max-w-xl flex-1 md:flex">
        <Search size={18} className="text-slate-400" />
        <input type="search" placeholder="Search properties, bookings, customers..." className="admin-header-search-input" />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="admin-header-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="admin-notif-dot" />
        </button>
        <button type="button" className="admin-header-btn hidden sm:flex" aria-label="Messages">
          <MessageSquare size={20} />
        </button>
        <button type="button" className="admin-btn-primary hidden sm:inline-flex" onClick={() => navigate('/admin/listings/new?type=HOTEL')}>
          <Plus size={18} />
          Add Listing
        </button>
        <div className="relative">
          <button type="button" className="admin-profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
            <span className="admin-avatar">{user?.name?.charAt(0) || 'A'}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold text-slate-900">{user?.name}</span>
              <span className="block text-xs text-slate-500">Super Admin</span>
            </span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          {profileOpen && (
            <div className="admin-dropdown">
              <button type="button" onClick={handleLogout} className="admin-dropdown-item text-red-600">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}