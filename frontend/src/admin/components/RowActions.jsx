import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 3-dot action menu for admin master-data tables.
 * items: [{ key, label, onClick?, to?, href?, tone?: 'danger'|'muted', disabled? }]
 */
export default function RowActions({ items = [], align = 'right', label = 'Actions' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const placeMenu = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 180;
    const left =
      align === 'left'
        ? rect.left
        : Math.min(window.innerWidth - width - 8, Math.max(8, rect.right - width));
    const top = Math.min(window.innerHeight - 8, rect.bottom + 6);
    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return undefined;
    placeMenu();
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    // Use click (not mousedown) so menu item onClick always fires first
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, align]);

  if (!items.length) return null;

  return (
    <div className="admin-row-actions" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className="admin-row-actions-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            className="admin-row-actions-menu"
            style={{ top: coords.top, left: coords.left }}
          >
            {items.map((item) => {
              if (!item || item.hidden) return null;
              const className = `admin-dropdown-item ${
                item.tone === 'danger' ? 'text-rose-600' : item.tone === 'muted' ? 'text-slate-500' : 'text-slate-700'
              }`;
              const close = () => setOpen(false);
              if (item.to) {
                return (
                  <Link
                    key={item.key || item.label}
                    role="menuitem"
                    to={item.to}
                    className={className}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                );
              }
              if (item.href) {
                return (
                  <a
                    key={item.key || item.label}
                    role="menuitem"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                    onClick={close}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <button
                  key={item.key || item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  className={className}
                  onMouseDown={(e) => {
                    // Run action on mousedown so outside-click handlers cannot cancel it
                    e.preventDefault();
                    e.stopPropagation();
                    close();
                    item.onClick?.();
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

/** Standard master-data menu: View · Edit · Activate/Deactivate · Delete */
export function buildMasterActions({
  isActive = true,
  onView,
  viewTo,
  viewHref,
  onEdit,
  editTo,
  onToggleActive,
  onDelete,
  deleteLabel = 'Delete',
}) {
  const items = [];
  if (onView || viewTo || viewHref) {
    items.push({
      key: 'view',
      label: 'View',
      onClick: onView,
      to: viewTo,
      href: viewHref,
    });
  }
  if (onEdit || editTo) {
    items.push({
      key: 'edit',
      label: 'Edit',
      onClick: onEdit,
      to: editTo,
    });
  }
  if (onToggleActive) {
    items.push({
      key: 'active',
      label: isActive !== false ? 'Mark as Inactive' : 'Mark as Active',
      onClick: onToggleActive,
      tone: isActive !== false ? 'muted' : undefined,
    });
  }
  if (onDelete) {
    items.push({
      key: 'delete',
      label: deleteLabel,
      onClick: onDelete,
      tone: 'danger',
    });
  }
  return items;
}
