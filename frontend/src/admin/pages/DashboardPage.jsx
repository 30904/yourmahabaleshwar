import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import {
  Calendar,
  Building2,
  Shield,
  Users,
  Car,
  TrendingUp,
  MessageSquare,
  Store,
  Tent,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import CurrencyIcon from '../../components/common/CurrencyIcon';
import { fetchEnterpriseDashboard } from '../../services/enterpriseAdminApi';
import { CURRENCY_SYMBOL, formatCurrency } from '../../utils/format';

const PIE_COLORS = ['#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#E53935'];
const STATUS_COLORS = { CONFIRMED: '#43A047', PENDING: '#FB8C00', COMPLETED: '#1E88E5', CANCELLED: '#E53935', REFUNDED: '#78909C' };

const monthLabel = (item) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[(item._id?.month || 1) - 1]} ${item._id?.year || ''}`;
};

const bookingTitle = (b) =>
  b.hotel?.name || b.tent?.name || b.guide?.name || b.driver?.name || b.type || 'Booking';

function DashboardSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div className="admin-dash-hero admin-dash-skeleton h-36" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="admin-dash-skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="admin-dash-skeleton h-80 rounded-2xl lg:col-span-2" />
        <div className="admin-dash-skeleton h-80 rounded-2xl" />
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnterpriseDashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const k = data?.kpis || {};
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const revenueChart = useMemo(
    () =>
      (data?.monthlyRevenue || []).map((m) => ({
        name: monthLabel(m),
        revenue: m.revenue,
        bookings: m.bookings,
      })),
    [data?.monthlyRevenue]
  );

  const dailyChart = useMemo(() => {
    const map = Object.fromEntries(
      (data?.dailyBookings || []).map((d) => [
        d._id,
        { name: d._id.slice(5), bookings: d.bookings, revenue: d.revenue },
      ])
    );
    const days = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(map[key] || { name: key.slice(5), bookings: 0, revenue: 0 });
    }
    return days;
  }, [data?.dailyBookings]);

  const pieType = (data?.bookingsByType || []).map((b) => ({
    name: b._id || 'Other',
    value: b.count,
  }));

  const pieStatus = (data?.bookingsByStatus || []).map((b) => ({
    name: b._id || 'Unknown',
    value: b.count,
  }));

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="admin-dashboard space-y-6">
      {/* Welcome hero */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-dash-hero"
      >
        <motion.div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="admin-dash-hero-eyebrow">SM Enterprises · Owner Panel</p>
            <h1 className="admin-dash-hero-title">Platform Overview</h1>
            <p className="admin-dash-hero-date">
              <Clock size={14} className="inline -mt-0.5 mr-1" />
              {today}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/listings/new?type=HOTEL" className="admin-dash-hero-btn admin-dash-hero-btn-primary">
              <Plus size={16} />
              Add Listing
            </Link>
            <Link to="/admin/bookings" className="admin-dash-hero-btn admin-dash-hero-btn-ghost">
              View Bookings
              <ArrowRight size={14} />
            </Link>
            {k.pendingKyc > 0 && (
              <Link to="/admin/kyc" className="admin-dash-hero-btn admin-dash-hero-btn-warn">
                <Shield size={16} />
                {k.pendingKyc} KYC pending
              </Link>
            )}
          </div>
        </motion.div>
        <div className="admin-dash-hero-stats">
          <div>
            <span>Total bookings</span>
            <strong>{k.totalBookings ?? 0}</strong>
          </div>
          <div>
            <span>This month</span>
            <strong>{k.monthBookings ?? 0}</strong>
          </div>
          <div>
            <span>Active listings</span>
            <strong>{k.activeProperties ?? 0}</strong>
          </div>
          <div>
            <span>New enquiries</span>
            <strong className="text-amber-300">{k.newEnquiries ?? 0}</strong>
          </div>
        </div>
      </motion.section>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          icon={CurrencyIcon}
          label="Total Revenue"
          value={formatCurrency(k.totalRevenue)}
          color="green"
          change={`Commission ${formatCurrency(k.commission)}`}
        />
        <KpiCard
          icon={TrendingUp}
          label="This Month"
          value={formatCurrency(k.monthRevenue)}
          color="blue"
          change={`${k.monthBookings ?? 0} paid bookings`}
        />
        <KpiCard icon={Calendar} label="Today's Bookings" value={String(k.todayBookings ?? 0)} color="violet" />
        <KpiCard icon={Building2} label="Active Properties" value={String(k.activeProperties ?? 0)} color="blue" change={`${k.hotels ?? 0} hotels · ${k.resorts ?? 0} resorts`} />
        <KpiCard icon={Shield} label="Pending KYC" value={String(k.pendingKyc ?? 0)} color="orange" />
        <KpiCard icon={MessageSquare} label="New Enquiries" value={String(k.newEnquiries ?? 0)} color="orange" />
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {[
          { icon: Users, label: 'Customers', value: k.customers, color: 'text-blue-600 bg-blue-50' },
          { icon: Store, label: 'Vendors', value: k.vendors, color: 'text-violet-600 bg-violet-50' },
          { icon: Users, label: 'Guides', value: k.activeGuides, color: 'text-emerald-600 bg-emerald-50' },
          { icon: Car, label: 'Drivers', value: k.activeDrivers, color: 'text-teal-600 bg-teal-50' },
          { icon: Tent, label: 'Tent camps', value: k.tents, color: 'text-orange-600 bg-orange-50' },
          { icon: Users, label: 'Platform users', value: k.totalUsers, color: 'text-slate-600 bg-slate-100' },
        ].map((item) => (
          <div key={item.label} className="admin-dash-mini-stat">
            <div className={`admin-dash-mini-icon ${item.color}`}>
              <item.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-slate-900">{item.value ?? 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="admin-card admin-chart-card lg:col-span-2"
        >
          <motion.div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="admin-card-title">Revenue & Bookings</h3>
              <p className="text-xs text-slate-500">Last 6 months · paid bookings</p>
            </div>
            <Link to="/admin/finance" className="text-sm font-medium text-admin-primary hover:underline">
              Finance →
            </Link>
          </motion.div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1E88E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${CURRENCY_SYMBOL}${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'revenue' ? formatCurrency(value) : value
                  }
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#1E88E5" fill="url(#revGrad)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="bookings" name="Bookings" stroke="#43A047" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="admin-card admin-chart-card"
        >
          <h3 className="admin-card-title">Booking Status</h3>
          <p className="mb-2 text-xs text-slate-500">All-time distribution</p>
          <motion.div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2}>
                  {pieStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || PIE_COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
          <div className="mt-2 flex flex-wrap gap-2">
            {pieStatus.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.name] || '#94a3b8' }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-card admin-chart-card lg:col-span-2"
        >
          <h3 className="admin-card-title">Daily Activity</h3>
          <p className="mb-4 text-xs text-slate-500">Bookings in the last 14 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" name="Bookings" fill="#1E88E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-card admin-chart-card">
          <h3 className="admin-card-title">By Service Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieType.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tables & lists */}
      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="admin-card-title">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-sm font-medium text-admin-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentBookings || []).map((b) => (
                  <tr key={b._id}>
                    <td>
                      <p className="font-medium text-slate-900">{b.bookingNumber}</p>
                      <p className="text-xs text-slate-500">{bookingTitle(b)}</p>
                    </td>
                    <td className="text-sm">{b.customer?.name || '—'}</td>
                    <td>
                      <span className="admin-badge-info text-xs">{b.type}</span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="text-right font-semibold">{formatCurrency(b.total)}</td>
                  </tr>
                ))}
                {!data?.recentBookings?.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No bookings yet. Run seed or create a test booking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card">
          <h3 className="admin-card-title">Top Properties</h3>
          <p className="mb-4 text-xs text-slate-500">By booking volume</p>
          <motion.div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topHotels || []} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#1E88E5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="admin-card-title">Pending KYC Approvals</h3>
            <Link to="/admin/kyc" className="admin-btn-secondary !py-1.5 !px-3 text-xs">
              Review all
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.pendingKycList || []).map((kyc) => (
              <div key={kyc._id} className="admin-dash-list-item">
                <div className="admin-avatar !h-9 !w-9 text-sm">
                  {(kyc.user?.name || '?').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{kyc.user?.name}</p>
                  <p className="text-xs text-slate-500">{kyc.user?.role} · {kyc.user?.email}</p>
                </div>
                <StatusBadge status={kyc.status} />
              </div>
            ))}
            {!data?.pendingKycList?.length && (
              <p className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-700">
                All KYC verifications are up to date.
              </p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card">
          <h3 className="admin-card-title">Recent Enquiries</h3>
          <div className="mt-4 space-y-2">
            {(data?.recentEnquiries || []).map((e) => (
              <motion.div key={e._id} className="admin-dash-list-item !items-start">
                <MessageSquare size={18} className="mt-0.5 shrink-0 text-admin-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-500">{e.type} · {e.email || e.phone}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{e.message}</p>
                </div>
              </motion.div>
            ))}
            {!data?.recentEnquiries?.length && (
              <p className="text-center text-sm text-slate-500 py-6">No enquiries yet.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card">
        <h3 className="admin-card-title mb-4">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/admin/listings/new?type=HOTEL', label: 'Add Listing', desc: 'Hotel, resort, guide, taxi & more', icon: Building2 },
            { to: '/admin/bookings', label: 'Manage Bookings', desc: 'View & update status', icon: Calendar },
            { to: '/admin/vendors', label: 'Vendors', desc: 'Partner accounts', icon: Store },
            { to: '/admin/cms', label: 'CMS & Banners', desc: 'Homepage content', icon: MapPin },
          ].map((action) => (
            <Link key={action.to} to={action.to} className="admin-dash-action-card group">
              <action.icon size={22} className="text-admin-primary" />
              <motion.div>
                <p className="font-semibold text-slate-900 group-hover:text-admin-primary">{action.label}</p>
                <p className="text-xs text-slate-500">{action.desc}</p>
              </motion.div>
              <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-admin-primary" />
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
