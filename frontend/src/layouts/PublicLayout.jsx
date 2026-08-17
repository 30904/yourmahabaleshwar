import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const hideBreadcrumb = ['/hotels', '/resorts', '/search'].some((p) => pathname.startsWith(p)) || pathname.includes('/hotels/');

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
