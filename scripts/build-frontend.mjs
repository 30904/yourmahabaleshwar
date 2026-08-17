import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'src');
const w = (rel, content) => {
  const fp = path.join(root, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content);
};

w('components/common/DashboardSidebar.jsx', `import { NavLink } from 'react-router-dom';
import { Mountain, X } from 'lucide-react';

export default function DashboardSidebar({ items, open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} role="presentation" />}
      <aside className={\`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-100 bg-white transition lg:translate-x-0 \${open ? 'translate-x-0' : '-translate-x-full'}\`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white"><Mountain size={18} /></div>
            <span className="text-xs font-bold text-primary">YMB Dashboard</span>
          </div>
          <button type="button" className="lg:hidden" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-4">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              className={({ isActive }) => \`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition \${isActive ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'}\`}>
              {item.icon && <item.icon size={18} />}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
`.replace('', ''));

w('layouts/DashboardLayout.jsx', `import { useState } from 'react';
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
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Menu">
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
`.replace('\n            ', ''));

w('routes/ProtectedRoute.jsx', `import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
`.replaceAll('\n        ', '').replaceAll('\n        ', ''));

const listingPage = (name, title, apiPath, linkPrefix, type, dataKey) => `import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import ListingCard from '../../components/common/ListingCard';
import Skeleton from '../../components/ui/Skeleton';
import { ${dataKey} } from '../../data/dummyListings';

export default function ${name}() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('${apiPath}', { params: { search, limit: 24 } })
      .then((res) => setItems(res.data.data?.items || res.data.data || []))
      .catch(() => setItems(${dataKey}))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="page-container py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">${title}</h1>
          <p className="mt-2 text-slate-600">Curated stays and experiences in Mahabaleshwar</p>
        </div>
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="input-field pl-10" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />) :
          items.map((item) => <ListingCard key={item._id} item={item} type="${type}" linkPrefix="${linkPrefix}" />)}
      </div>
    </div>
  );
}
`;

w('pages/public/HotelsPage.jsx', listingPage('HotelsPage', 'Hotels in Mahabaleshwar', '/hotels?type=HOTEL', '/hotels', 'hotel', 'dummyHotels'));
w('pages/public/ResortsPage.jsx', listingPage('ResortsPage', 'Resorts in Mahabaleshwar', '/hotels?type=RESORT', '/hotels', 'hotel', 'dummyResorts'));
w('pages/public/TentsPage.jsx', listingPage('TentsPage', 'Tent Camping', '/tents', '/tents', 'tent', 'dummyTents'));
w('pages/public/GuidesPage.jsx', listingPage('GuidesPage', 'Local Guides', '/guides', '/guides', 'guide', 'dummyGuides'));
w('pages/public/TaxiPage.jsx', listingPage('TaxiPage', 'Taxi & Cabs', '/drivers', '/taxi', 'taxi', 'dummyDrivers'));

w('pages/public/StaticPage.jsx', `export default function StaticPage({ title, children }) {
  return (
    <div className="page-container max-w-4xl py-10 sm:py-14">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <div className="prose prose-slate mt-6 max-w-none text-slate-600">{children}</div>
    </div>
  );
}
`.replace('', ''));

console.log('Generated core pages');
