import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'frontend', 'src');

const write = (rel, content) => {
  const fp = path.join(root, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content.trimStart() + '\n');
};

const pageTemplate = (name, title, extra = '') => `import { Helmet } from 'react-helmet-async';\n\nexport default function ${name}() {\n  return (\n    <div className="page-container py-10 sm:py-14">\n      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">${title}</h1>\n      <p className="mt-4 max-w-3xl text-slate-600 leading-relaxed">\n        Premium tourism experience on YOURMAHABALESHWAR.COM — explore Mahabaleshwar with trusted hotels, guides, tents and taxi services.\n      </p>\n      ${extra}\n    </div>\n  );\n}\n`;

// We'll skip react-helmet - use simple pages
const simplePage = (name, title, body) => `export default function ${name}() {\n  return (\n    <div className="page-container py-10 sm:py-14">\n      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">${title}</h1>\n      ${body}\n    </div>\n  );\n}\n`.replace(/<motion><\/motion>/g, '');

write('hooks/useMediaQuery.js', `import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const fn = (e) => setMatches(e.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, [query]);
  return matches;
}
`);

write('utils/format.js', `export const formatCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
`);

write('routes/ProtectedRoute.jsx', `import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
`.replace(/<motion><\/motion>/g, ''));

console.log('Scaffold partial done');
