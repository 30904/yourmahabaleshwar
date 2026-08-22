import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, HelpCircle, User, Bell, Heart, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';
import { fetchNotifications, markAllNotificationsRead } from '../../services/userApi';

const primaryLinks = [
  { to: '/hotels', key: 'stays' },
  { to: '/resorts', key: 'resorts' },
  { to: '/homestays', key: 'homestays' },
  { to: '/tents', key: 'tents' },
  { to: '/guides', key: 'guides' },
  { to: '/taxi', key: 'taxi' },
  { to: '/horses', key: 'horses' },
];

const shopLinks = [
  { to: '/strawberries', key: 'strawberries', comingSoon: true },
  { to: '/mapro', key: 'mapro', comingSoon: true },
  { to: '/combos', key: 'combos', comingSoon: true },
];

const allMobileLinks = [...primaryLinks, ...shopLinks];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const shopRef = useRef(null);
  const { user, logout, isAuthenticated } = useAuth();
  const dash =
    user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_STAFF_HOTEL' || user?.role === 'OFFICE_STAFF_GUIDE'
      ? '/admin'
      : ['HOTEL_VENDOR', 'HOMESTAY_VENDOR', 'TENT_OPERATOR', 'GUIDE', 'DRIVER', 'HORSE_OPERATOR', 'PRODUCT_VENDOR'].includes(
          user?.role
        )
        ? '/dashboard/vendor'
        : '/dashboard/customer';

  const shopActive = shopLinks.some((l) => !l.comingSoon && location.pathname.startsWith(l.to));

  const switchLang = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications(true)
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [isAuthenticated, notifOpen]);

  useEffect(() => {
    setShopOpen(false);
    setOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDoc = (e) => {
      if (shopRef.current && !shopRef.current.contains(e.target)) setShopOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-50 overflow-x-clip border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="page-container flex min-h-[72px] items-center gap-2 py-2 sm:min-h-[80px] sm:gap-3">
        <Logo variant="navbar" />

        <nav className="nav-desktop">
          {primaryLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
            >
              {t(`nav.${l.key}`)}
            </NavLink>
          ))}

          <div className="relative" ref={shopRef}>
            <button
              type="button"
              className={`nav-link inline-flex items-center gap-0.5 ${shopActive ? 'nav-link-active' : ''}`}
              onClick={() => setShopOpen((v) => !v)}
              aria-expanded={shopOpen}
            >
              {t('nav.shop')}
              <ChevronDown size={14} className={`transition ${shopOpen ? 'rotate-180' : ''}`} />
            </button>
            {shopOpen && (
              <div className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {shopLinks.map((l) =>
                  l.comingSoon ? (
                    <span
                      key={l.to}
                      className="block cursor-not-allowed whitespace-nowrap px-3 py-2 text-[13px] font-medium text-slate-500"
                      aria-disabled="true"
                    >
                      {t(`nav.${l.key}`)}{' '}
                      <span className="text-red-500">{t('nav.comingSoon')}</span>
                    </span>
                  ) : (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      className={({ isActive }) =>
                        `block whitespace-nowrap px-3 py-2 text-[13px] font-medium ${
                          isActive ? 'bg-blue-50 text-primary' : 'text-slate-700 hover:bg-slate-50'
                        }`
                      }
                    >
                      {t(`nav.${l.key}`)}
                    </NavLink>
                  )
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Link to="/register-vendor" className="nav-btn-outline !px-2.5 !py-1.5 !text-[13px] xl:!px-3">
            {t('nav.listProperty')}
          </Link>
          <div className="hidden items-center gap-0.5 sm:flex">
            <button
              type="button"
              className={`nav-icon-btn text-xs font-bold ${i18n.language === 'en' ? 'text-primary' : ''}`}
              onClick={() => switchLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`nav-icon-btn text-xs font-bold ${i18n.language === 'mr' ? 'text-primary' : ''}`}
              onClick={() => switchLang('mr')}
            >
              मर
            </button>
          </div>
          <NavLink to="/faq" className="nav-icon-btn hidden sm:flex" aria-label="Help">
            <HelpCircle size={18} />
          </NavLink>

          {isAuthenticated && (
            <>
              {user?.role === 'CUSTOMER' && (
                <NavLink to="/dashboard/customer/favorites" className="nav-icon-btn hidden sm:flex" aria-label="Favorites">
                  <Heart size={18} />
                </NavLink>
              )}
              <div className="relative">
                <button
                  type="button"
                  className="nav-icon-btn relative"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen((v) => !v)}
                >
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">{t('nav.notifications')}</p>
                      <button
                        type="button"
                        className="text-xs text-primary"
                        onClick={async () => {
                          await markAllNotificationsRead();
                          setNotifications([]);
                        }}
                      >
                        {t('nav.markAllRead')}
                      </button>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="py-4 text-center text-xs text-slate-500">{t('nav.noNotifications')}</p>
                      )}
                      {notifications.map((n) => (
                        <div key={n._id} className="rounded-lg bg-slate-50 p-2 text-left">
                          <p className="text-xs font-semibold">{n.title}</p>
                          <p className="text-xs text-slate-600">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {isAuthenticated ? (
            <>
              <NavLink to={dash} className="nav-btn-outline !inline-flex !gap-1.5 !px-2.5 !py-1.5 !text-[13px]">
                <User size={16} />
                <span className="max-w-[5rem] truncate">{user?.name?.split(' ')[0]}</span>
              </NavLink>
              <button type="button" onClick={logout} className="nav-text-link hidden sm:inline">
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-btn-primary hidden !px-3 !py-1.5 !text-[13px] sm:inline-flex">
                {t('nav.register')}
              </Link>
              <Link to="/login" className="nav-btn-signin !px-3 !py-1.5 !text-[13px]">
                {t('nav.signIn')}
              </Link>
            </>
          )}

          <button
            type="button"
            className="nav-icon-btn xl:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-[70vh] overflow-y-auto border-t border-slate-100 bg-white px-4 py-4 xl:hidden">
          {allMobileLinks.map((l) =>
            l.comingSoon ? (
              <span
                key={l.to}
                className="mb-1 block cursor-not-allowed rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500"
                aria-disabled="true"
              >
                {t(`nav.${l.key}`)} <span className="text-red-500">{t('nav.comingSoon')}</span>
              </span>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `mb-1 block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-primary' : 'text-slate-700'
                  }`
                }
              >
                {t(`nav.${l.key}`)}
              </NavLink>
            )
          )}
        </div>
      )}
    </header>
  );
}
