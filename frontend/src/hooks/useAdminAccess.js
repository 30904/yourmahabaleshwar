import { useAuth } from '../context/AuthContext';
import { useAdminAccess as resolveAccess } from '../utils/adminAccess';

export default function useAdminAccess() {
  const { user } = useAuth();
  return resolveAccess(user);
}
