import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Languages, Star } from 'lucide-react';
import BookingSearchBar from '../../components/search/BookingSearchBar';
import ReviewScore from '../../components/property/ReviewScore';
import { fetchGuides } from '../../services/listingsApi';
import { dummyGuides } from '../../data/dummyListings';
import { formatCurrency } from '../../utils/format';

export default function GuidesPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { fetchGuides({ limit: 50 }).then(setItems).catch(() => setItems(dummyGuides)); }, []);
  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-6"><div className="page-container"><BookingSearchBar compact /></div></div>
      <div className="page-container py-8">
        <h1 className="text-3xl font-bold">Local tour guides</h1>
        <p className="mt-2 text-slate-600">6hr & 12hr packages · Bike add-on available</p>
        
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {items.map((g) => (
            <Link key={g._id} to={`/guides/${g.slug}`} className="card flex gap-4 p-5 hover:shadow-elevated">
              <img src={g.photo || 'https://images.unsplash.com/photo-1507003211169?w=200'} alt="" className="h-24 w-24 rounded-booking object-cover" />
              <div className="flex-1">
                <div className="flex justify-between gap-2"><h3 className="font-bold text-primary">{g.name}</h3><ReviewScore score={g.score || g.rating} label={g.scoreLabel} size="sm" /></div>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Languages size={14} />{g.languages?.join(', ')}</p>
                <p className="mt-2 text-sm">{g.specialties?.join(' · ')}</p>
                <p className="mt-2 font-bold">{formatCurrency(g.package6hr)} <span className="font-normal text-slate-500">/ 6 hours</span></p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
