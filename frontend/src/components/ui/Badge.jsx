const colors = {
  primary: 'bg-blue-50 text-primary',
  success: 'bg-green-50 text-secondary',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
};

export default function Badge({ children, color = 'primary', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
