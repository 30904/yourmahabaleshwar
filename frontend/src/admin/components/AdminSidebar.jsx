import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../components/common/Logo';
import { adminNavGroups } from '../config/navigation';

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(adminNavGroups.filter((g) => g.label).map((g) => [g.id, true]))
  );

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sidebarContent = (
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''}`}>
      <div className="admin-sidebar-brand">
        {!collapsed && (
          <div>
            <Logo variant="sm" className="!h-10" />
            <p className="mt-2 text-xs font-semibold text-slate-500">SM Enterprises</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Owner Panel</p>
          </div>
        )}
        <button type="button" onClick={onToggle} className="admin-sidebar-toggle hidden lg:flex" aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="admin-sidebar-nav theme-scrollbar">
        {adminNavGroups.map((group) => (
          <div key={group.id} className="admin-nav-group">
            {group.label && !collapsed && (
              <button type="button" className="admin-nav-group-label" onClick={() => toggleGroup(group.id)}>
                <span>{group.label}</span>
                <ChevronDown size={14} className={`transition ${openGroups[group.id] ? 'rotate-180' : ''}`} />
              </button>
            )}
            <AnimatePresence initial={false}>
              {(!group.label || openGroups[group.id] || collapsed) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onMobileClose}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-link-active' : ''}`}
                      >
                        <Icon size={18} className="shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      {mobileOpen && <div className="admin-sidebar-overlay lg:hidden" onClick={onMobileClose} aria-hidden />}
      <div className={`admin-sidebar-wrap ${mobileOpen ? 'admin-sidebar-mobile-open' : ''}`}>{sidebarContent}</div>
    </>
  );
}