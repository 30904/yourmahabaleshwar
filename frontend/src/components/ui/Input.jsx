import { preventNumberInputScroll } from '../../utils/preventNumberInputScroll';

export default function Input({ label, error, className = '', type, onWheel, ...props }) {
  const wheelHandler = type === 'number' ? onWheel ?? preventNumberInputScroll : onWheel;

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        className={`input-field ${error ? 'border-red-400' : ''}`}
        type={type}
        onWheel={wheelHandler}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
