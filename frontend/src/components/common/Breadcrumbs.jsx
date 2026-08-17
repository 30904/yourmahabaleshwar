import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation() || { pathname: '/' };
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div className="page-container py-3 text-sm text-slate-500">
      <Link to="/" className="inline-flex items-center gap-1 hover:text-primary"><Home size={14} /> Home</Link>
      {parts.map((p, i) => (
        <span key={p} className="inline-flex items-center">
          <ChevronRight size={14} className="mx-1" />
          <span className={i === parts.length - 1 ? 'font-medium text-slate-800 capitalize' : 'capitalize'}>{p.replace(/-/g, ' ')}</span>
        </span>
      ))}
    </div>
  );
}
