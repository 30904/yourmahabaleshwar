import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadField from '../../../components/ui/ImageUploadField';
import {
  fetchAdminServiceHubImages,
  updateAdminServiceHubImages,
} from '../../../services/enterpriseAdminApi';
import { getMediaUrl } from '../../../utils/mediaUrl';
import {
  DEFAULT_SERVICE_HUB_LAYOUT,
  SERVICE_HUB_LAYOUTS,
} from '../../../constants/serviceHubGallery';

const SERVICES = [
  { id: 'GUIDE', label: 'Guides', page: '/guides' },
  { id: 'TAXI', label: 'Taxi', page: '/taxi' },
  { id: 'DRIVER', label: 'Drivers', page: '/drivers' },
  { id: 'HORSE', label: 'Horses', page: '/horses' },
];

const emptyImages = () => ({
  GUIDE: [],
  TAXI: [],
  DRIVER: [],
  HORSE: [],
});

const emptyLayouts = () => ({
  GUIDE: DEFAULT_SERVICE_HUB_LAYOUT,
  TAXI: DEFAULT_SERVICE_HUB_LAYOUT,
  DRIVER: DEFAULT_SERVICE_HUB_LAYOUT,
  HORSE: DEFAULT_SERVICE_HUB_LAYOUT,
});

function normalizeList(list = []) {
  return (list || [])
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return { url: item, caption: '' };
      const url = item.url || item.src || item.key || '';
      if (!url) return null;
      return { url, caption: item.caption || '' };
    })
    .filter(Boolean);
}

export default function ServiceHubImagesPage() {
  const [active, setActive] = useState('GUIDE');
  const [images, setImages] = useState(emptyImages);
  const [layouts, setLayouts] = useState(emptyLayouts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftCaption, setDraftCaption] = useState('');

  const load = () => {
    setLoading(true);
    fetchAdminServiceHubImages()
      .then((data) => {
        const nextImages = emptyImages();
        const nextLayouts = emptyLayouts();
        for (const s of SERVICES) {
          nextImages[s.id] = normalizeList(data?.images?.[s.id]);
          nextLayouts[s.id] = data?.layouts?.[s.id] || DEFAULT_SERVICE_HUB_LAYOUT;
        }
        setImages(nextImages);
        setLayouts(nextLayouts);
      })
      .catch(() => toast.error('Failed to load service images'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const list = images[active] || [];
  const layout = layouts[active] || DEFAULT_SERVICE_HUB_LAYOUT;

  const setList = (nextList) => {
    setImages((prev) => ({ ...prev, [active]: nextList }));
  };

  const setLayout = (id) => {
    setLayouts((prev) => ({ ...prev, [active]: id }));
  };

  const addItem = (url, caption = '') => {
    if (!url) return;
    if (list.some((x) => x.url === url)) {
      toast.error('Image already added');
      return;
    }
    if (list.length >= 12) {
      toast.error('Maximum 12 images per service');
      return;
    }
    setList([...list, { url, caption: String(caption || '').trim() }]);
  };

  const addByUrl = () => {
    const url = draftUrl.trim();
    if (!url) return;
    addItem(url, draftCaption);
    setDraftUrl('');
    setDraftCaption('');
  };

  const removeAt = (index) => {
    setList(list.filter((_, i) => i !== index));
  };

  const move = (index, dir) => {
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
  };

  const setCaptionAt = (index, caption) => {
    setList(list.map((item, i) => (i === index ? { ...item, caption } : item)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await updateAdminServiceHubImages({
        serviceHubImages: images,
        serviceHubLayouts: layouts,
      });
      const nextImages = emptyImages();
      const nextLayouts = emptyLayouts();
      for (const s of SERVICES) {
        nextImages[s.id] = normalizeList(saved?.images?.[s.id]);
        nextLayouts[s.id] = saved?.layouts?.[s.id] || DEFAULT_SERVICE_HUB_LAYOUT;
      }
      setImages(nextImages);
      setLayouts(nextLayouts);
      toast.success('Service page images saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const service = SERVICES.find((s) => s.id === active);
  const layoutMeta = SERVICE_HUB_LAYOUTS.find((l) => l.id === layout);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service page images"
        subtitle="Upload images and choose a gallery layout for Guides, Taxi, Drivers and Horses"
        breadcrumbs={[
          { label: 'CMS', to: '/admin/cms' },
          { label: 'Service page images' },
        ]}
        actions={
          <button type="button" className="admin-btn-primary" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {SERVICES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActive(s.id);
              setDraftUrl('');
              setDraftCaption('');
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === s.id
                ? 'bg-admin-primary text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.label}
            <span className="ml-2 text-xs opacity-80">({(images[s.id] || []).length})</span>
          </button>
        ))}
      </div>

      <div className="admin-card space-y-5 p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{service?.label} page gallery</h2>
          <p className="mt-1 text-sm text-slate-500">
            Shown on{' '}
            <a href={service?.page} target="_blank" rel="noreferrer" className="text-admin-primary underline">
              {service?.page}
            </a>
            . Up to 12 images. Click a photo on the public page to open lightbox.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Layout style</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_HUB_LAYOUTS.map((opt) => (
              <label
                key={opt.id}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  layout === opt.id
                    ? 'border-admin-primary bg-sky-50 ring-1 ring-admin-primary'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={`layout-${active}`}
                  checked={layout === opt.id}
                  onChange={() => setLayout(opt.id)}
                />
                <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
              </label>
            ))}
          </div>
          {layoutMeta && (
            <p className="mt-2 text-xs text-slate-500">
              Active: <strong>{layoutMeta.label}</strong>
              {layout === 'moments' ? ' — add short captions on images below.' : null}
              {layout === 'split' ? ' — Book now moves into the left column with photos on the right.' : null}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item, index) => (
                <div key={`${item.url}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={getMediaUrl(item.url)}
                    alt={`${service?.label} ${index + 1}`}
                    className="h-40 w-full object-cover"
                  />
                  <div className="space-y-2 p-2">
                    <input
                      className="admin-input !py-1.5 text-xs"
                      placeholder="Optional caption (for Moments layout)"
                      value={item.caption || ''}
                      onChange={(e) => setCaptionAt(index, e.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" className="admin-btn-secondary !px-2 !py-1 text-xs" onClick={() => move(index, -1)} disabled={index === 0}>
                        Up
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary !px-2 !py-1 text-xs"
                        onClick={() => move(index, 1)}
                        disabled={index === list.length - 1}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        onClick={() => removeAt(index)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!list.length && (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No images yet for {service?.label}. Upload below.
                </div>
              )}
            </div>

            <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
              <ImageUploadField
                label="Upload new image"
                hint="JPG, PNG or WebP"
                value=""
                category="cms-service-hub"
                meta={{ tenant: active.toLowerCase() }}
                accept="image/*"
                onChange={(url) => addItem(url, draftCaption)}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Or paste image URL</label>
                <input
                  className="admin-input"
                  placeholder="https://…"
                  value={draftUrl}
                  onChange={(e) => setDraftUrl(e.target.value)}
                />
                <input
                  className="admin-input"
                  placeholder="Optional caption"
                  value={draftCaption}
                  onChange={(e) => setDraftCaption(e.target.value)}
                />
                <button type="button" className="admin-btn-secondary" onClick={addByUrl}>
                  <Plus size={16} /> Add image
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
