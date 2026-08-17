import { motion } from 'framer-motion';

export default function KpiCard({ icon: Icon, label, value, change, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-kpi-card"
    >
      <div className={`admin-kpi-icon ${colors[color] || colors.blue}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="admin-kpi-label">{label}</p>
        <p className="admin-kpi-value">{value}</p>
        {change && <p className="admin-kpi-change">{change}</p>}
      </div>
    </motion.div>
  );
}