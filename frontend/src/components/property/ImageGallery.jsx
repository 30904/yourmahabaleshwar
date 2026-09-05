import { useMemo, useState } from 'react';
import { Grid2x2 } from 'lucide-react';
import { resolveMediaUrls } from '../../utils/mediaUrl';

export default function ImageGallery({ images = [], name = 'Property' }) {
  const imgs = useMemo(() => {
    const resolved = resolveMediaUrls(images);
    return resolved.length ? resolved : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'];
  }, [images]);
  const [main, setMain] = useState(0);

  return (
    <div className="relative grid gap-2 overflow-hidden rounded-booking sm:grid-cols-4 sm:grid-rows-2">
      <button type="button" className="relative col-span-2 row-span-2 min-h-[240px] sm:min-h-[380px]" onClick={() => setMain(0)}>
        <img src={imgs[main] || imgs[0]} alt={name} className="h-full w-full object-cover" />
      </button>
      {imgs.slice(1, 5).map((src, i) => (
        <button key={i} type="button" className="relative hidden min-h-[120px] overflow-hidden sm:block" onClick={() => setMain(i + 1)}>
          <img src={src} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
      {imgs.length > 1 && (
        <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-booking border border-white bg-white px-3 py-2 text-sm font-semibold shadow">
          <Grid2x2 size={16} /> {imgs.length} photos
        </span>
      )}
    </div>
  );
}
