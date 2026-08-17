export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100',
  };
  return (
    <button type={type} className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
