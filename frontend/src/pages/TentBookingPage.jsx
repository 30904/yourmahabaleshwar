import { Navigate } from 'react-router-dom';

/** Legacy open-assignment URL — tents now book like hotels via listing detail. */
export default function TentBookingPage() {
  return <Navigate to="/tents" replace />;
}
