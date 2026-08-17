import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function AdminModal({ open, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`admin-modal ${wide ? 'admin-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button type="button" className="admin-header-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}
