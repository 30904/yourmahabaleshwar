import { getAmenityIcon } from '../../utils/amenityIcons';

export default function AmenityPicker({ options = [], selected = [], onChange, loading }) {
  const toggle = (name) => {
    if (selected.includes(name)) onChange(selected.filter((a) => a !== name));
    else onChange([...selected, name]);
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading amenities…</p>;
  }

  if (!options.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No amenities configured. Add them under Property Management → Amenities, or run{' '}
        <code className="text-xs">npm run seed:catalog</code> in the backend.
      </p>
    );
  }

  return (
    <div className="admin-amenity-grid">
      {options.map((item) => {
        const Icon = getAmenityIcon(item.icon);
        const on = selected.includes(item.name);
        return (
          <button
            key={item._id || item.name}
            type="button"
            onClick={() => toggle(item.name)}
            className={`admin-amenity-chip ${on ? 'admin-amenity-chip-active' : ''}`}
          >
            <Icon size={18} strokeWidth={on ? 2.25 : 1.75} />
            <span>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

