import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="admin-page-header">
      {breadcrumbs.length > 0 && (
        <nav className="admin-breadcrumbs">
          {breadcrumbs.map((b, i) => (
            <span key={b.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} className="text-slate-400" />}
              {b.to ? (
                <Link to={b.to} className="hover:text-primary">
                  {b.label}
                </Link>
              ) : (
                <span className="text-slate-600">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="admin-page-title">{title}</h1>
          {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}