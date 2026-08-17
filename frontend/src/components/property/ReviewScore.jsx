export default function ReviewScore({ score, label, reviewCount, size = 'md' }) {
  if (!score) return null;
  const sizes = {
    sm: { box: 'min-w-[2rem] text-sm px-1.5 py-0.5', label: 'text-xs' },
    md: { box: 'min-w-[2.75rem] px-2 py-1', label: 'text-sm' },
    lg: { box: 'min-w-[3.25rem] px-3 py-1.5 text-lg', label: 'text-base' },
  };
  const s = sizes[size];
  return (
    
    <div className="flex items-center gap-2">
      <div className={`score-badge ${s.box}`}>
        <span className="text-sm font-bold leading-none">{Number(score).toFixed(1)}</span>
      </div>
      <div>
        {label && <p className={`font-semibold text-slate-900 ${s.label}`}>{label}</p>}
        {reviewCount != null && <p className="text-xs text-slate-500">{reviewCount.toLocaleString('en-IN')} reviews</p>}
      </div>
    </div>
  );
}
