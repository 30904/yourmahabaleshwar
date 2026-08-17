import { useState } from 'react';
import { SlidersHorizontal, Star } from 'lucide-react';

const priceRanges = ['Any', 'Under ₹2,000', '₹2,000 - ₹5,000', '₹5,000+'];
const ratings = [9, 8, 7, 6];
const amenitiesList = ['Free WiFi', 'Free parking', 'Breakfast included', 'Pool', 'Restaurant', 'Free cancellation'];

export default function PropertyFilters({ onChange }) {
  const [price, setPrice] = useState('Any');
  const [minRating, setMinRating] = useState(null);
  const [amenities, setAmenities] = useState([]);

  const toggleAmenity = (a) => {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    setAmenities(next);
    onChange?.({ price, minRating, amenities: next });
  };

  return (
    <aside className="card sticky top-24 hidden p-5 lg:block">
      <h3 className="flex items-center gap-2 font-bold text-slate-900"><SlidersHorizontal size={18} /> Filter by</h3>
      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-700">Your budget (per night)</p>
        <div className="mt-2 space-y-2">
          {priceRanges.map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="price" checked={price === p} onChange={() => { setPrice(p); onChange?.({ price: p, minRating, amenities }); }} className="accent-primary" />
              {p}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-700">Review score</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ratings.map((r) => (
            <button key={r} type="button" onClick={() => { setMinRating(r); onChange?.({ price, minRating: r, amenities }); }}
              className={`filter-chip ${minRating === r ? 'filter-chip-active' : ''}`}><Star size={14} className="fill-accent text-accent" /> {r}+</button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-700">Amenities</p>
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {amenitiesList.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} className="accent-primary rounded" />
              {a}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
