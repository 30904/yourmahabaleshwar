import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from './Logo';

export default function DashboardSidebar({ items, open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} role="presentation" />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-white transition lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-border px-4">
          <Logo variant="sidebar" />
          <button type="button" className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-booking px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {item.icon && <item.icon size={18} />}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
