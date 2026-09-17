import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { getMediaUrl } from '../../utils/mediaUrl';
import { DEFAULT_SERVICE_HUB_LAYOUT } from '../../constants/serviceHubGallery';

function normalizeItems(images = []) {
  return (images || [])
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return { url: item, caption: '' };
      const url = item.url || item.src || item.key || '';
      if (!url) return null;
      return { url, caption: item.caption || '' };
    })
    .filter(Boolean);
}

function HubLightbox({ items, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onPrev, onNext]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-4" onClick={onClose}>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close gallery"
      >
        <X size={22} />
      </button>
      {items.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      <div className="max-h-[85vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img src={getMediaUrl(item.url)} alt={item.caption || ''} className="mx-auto max-h-[75vh] w-auto max-w-full rounded-xl object-contain" />
        {(item.caption || items.length > 1) && (
          <p className="mt-3 text-center text-sm text-white/90">
            {item.caption || `Photo ${index + 1} of ${items.length}`}
          </p>
        )}
      </div>
    </div>
  );
}

function Thumb({ item, className = '', onClick, eager = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block overflow-hidden bg-slate-100 text-left ${className}`}
    >
      <img
        src={getMediaUrl(item.url)}
        alt={item.caption || ''}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading={eager ? 'eager' : 'lazy'}
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/45 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
        <Expand size={14} />
      </span>
    </button>
  );
}

function CollageLayout({ items, openAt }) {
  const [hero, ...rest] = items;
  const side = rest.slice(0, 4);
  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr] lg:grid-rows-2 lg:gap-4">
      <Thumb
        item={hero}
        eager
        onClick={() => openAt(0)}
        className="aspect-[16/10] rounded-2xl lg:row-span-2 lg:aspect-auto lg:min-h-[360px]"
      />
      <div className={`grid gap-3 ${side.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} lg:contents`}>
        {side.map((item, i) => (
          <Thumb
            key={`${item.url}-${i}`}
            item={item}
            onClick={() => openAt(i + 1)}
            className="aspect-[4/3] rounded-2xl lg:aspect-auto lg:min-h-[170px]"
          />
        ))}
      </div>
    </div>
  );
}

function CarouselLayout({ items, openAt }) {
  const scrollerRef = useRef(null);
  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 420), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <Thumb
            key={`${item.url}-${i}`}
            item={item}
            eager={i === 0}
            onClick={() => openAt(i)}
            className="aspect-[4/3] w-[78%] shrink-0 snap-center rounded-2xl sm:w-[48%] lg:w-[32%]"
          />
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="btn-outline !px-3 !py-2" onClick={() => scrollBy(-1)} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="btn-outline !px-3 !py-2" onClick={() => scrollBy(1)} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function MasonryLayout({ items, openAt }) {
  const heights = ['min-h-[180px]', 'min-h-[240px]', 'min-h-[200px]', 'min-h-[280px]', 'min-h-[220px]', 'min-h-[190px]'];
  return (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
      {items.map((item, i) => (
        <Thumb
          key={`${item.url}-${i}`}
          item={item}
          eager={i === 0}
          onClick={() => openAt(i)}
          className={`mb-3 w-full break-inside-avoid rounded-2xl ${heights[i % heights.length]}`}
        />
      ))}
    </div>
  );
}

function StripLayout({ items, openAt }) {
  const shown = items.slice(0, 3);
  return (
    <div className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl">
      <div className={`grid ${shown.length === 1 ? 'grid-cols-1' : shown.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1 sm:gap-2`}>
        {shown.map((item, i) => (
          <Thumb
            key={`${item.url}-${i}`}
            item={item}
            eager={i === 0}
            onClick={() => openAt(i)}
            className="aspect-[16/10] sm:rounded-xl"
          />
        ))}
      </div>
      {items.length > 3 && (
        <button type="button" className="mt-3 text-sm font-semibold text-primary hover:underline" onClick={() => openAt(0)}>
          View all {items.length} photos
        </button>
      )}
    </div>
  );
}

function MomentsLayout({ items, openAt }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <figure key={`${item.url}-${i}`} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80">
          <Thumb item={item} eager={i < 3} onClick={() => openAt(i)} className="aspect-[4/3] rounded-none" />
          {item.caption ? (
            <figcaption className="px-3 py-2.5 text-sm font-medium text-slate-700">{item.caption}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function LightboxPreviewLayout({ items, openAt }) {
  const preview = items.slice(0, 6);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {preview.map((item, i) => (
          <Thumb
            key={`${item.url}-${i}`}
            item={item}
            eager={i === 0}
            onClick={() => openAt(i)}
            className="aspect-[4/3] rounded-2xl"
          />
        ))}
      </div>
      {items.length > 6 && (
        <button type="button" className="mt-4 text-sm font-semibold text-primary hover:underline" onClick={() => openAt(0)}>
          View full gallery ({items.length})
        </button>
      )}
    </div>
  );
}

export default function ServiceHubGallery({
  images = [],
  layout = DEFAULT_SERVICE_HUB_LAYOUT,
  splitTitle,
  splitDescription,
  bookPath,
  bookLabel = 'Book now',
  secondaryAction = null,
}) {
  const items = useMemo(() => normalizeItems(images), [images]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const mode = layout || DEFAULT_SERVICE_HUB_LAYOUT;

  if (!items.length) return null;

  const openAt = (i) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i == null ? i : (i - 1 + items.length) % items.length));
  const next = () => setLightboxIndex((i) => (i == null ? i : (i + 1) % items.length));

  if (mode === 'split') {
    return (
      <>
        <div className="mx-auto mt-10 grid max-w-5xl items-center gap-8 lg:grid-cols-2">
          <div className="text-left">
            {splitTitle && <h2 className="text-2xl font-bold text-slate-900">{splitTitle}</h2>}
            {splitDescription && <p className="mt-3 text-slate-600">{splitDescription}</p>}
            {(bookPath || secondaryAction) && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {bookPath && (
                  <Link to={bookPath} className="btn-primary inline-flex px-8 py-3 text-base">
                    {bookLabel}
                  </Link>
                )}
                {secondaryAction}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.slice(0, 4).map((item, i) => (
              <Thumb
                key={`${item.url}-${i}`}
                item={item}
                eager={i === 0}
                onClick={() => openAt(i)}
                className={`rounded-2xl ${i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`}
              />
            ))}
          </div>
        </div>
        {lightboxIndex != null && (
          <HubLightbox items={items} index={lightboxIndex} onClose={close} onPrev={prev} onNext={next} />
        )}
      </>
    );
  }

  let body = null;
  if (mode === 'carousel') body = <CarouselLayout items={items} openAt={openAt} />;
  else if (mode === 'masonry') body = <MasonryLayout items={items} openAt={openAt} />;
  else if (mode === 'strip') body = <StripLayout items={items} openAt={openAt} />;
  else if (mode === 'moments') body = <MomentsLayout items={items} openAt={openAt} />;
  else if (mode === 'lightbox') body = <LightboxPreviewLayout items={items} openAt={openAt} />;
  else body = <CollageLayout items={items} openAt={openAt} />;

  return (
    <>
      <div className={`mx-auto mt-10 ${mode === 'strip' ? 'max-w-6xl' : 'max-w-5xl'}`}>{body}</div>
      {lightboxIndex != null && (
        <HubLightbox items={items} index={lightboxIndex} onClose={close} onPrev={prev} onNext={next} />
      )}
    </>
  );
}
