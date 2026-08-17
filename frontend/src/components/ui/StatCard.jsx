export default function StatCard({ icon: Icon, label, value, trend, color = 'primary' }) {
  const iconBg = {
    primary: 'bg-blue-50 text-primary',
    success: 'bg-green-50 text-secondary',
    accent: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg[color]}`}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {trend && <p className="mt-1 text-xs text-secondary font-medium">{trend}</p>}
      </div>
    </div>
  );
}
