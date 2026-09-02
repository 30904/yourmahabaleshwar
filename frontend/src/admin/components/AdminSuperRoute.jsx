import { Navigate } from 'react-router-dom';
import useAdminAccess from '../../hooks/useAdminAccess';

/** Redirects staff away from super-admin-only routes (finance, settings, staff management). */
export default function AdminSuperRoute({ children, finance }) {
  const { canSeeFinance, canManageStaff } = useAdminAccess();

  if (finance && !canSeeFinance) {
    return <Navigate to="/admin" replace />;
  }

  if (!finance && !canManageStaff) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
