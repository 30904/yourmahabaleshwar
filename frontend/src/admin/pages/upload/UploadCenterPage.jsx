import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  BedDouble,
  Tent,
  Users,
  Car,
  UserCircle,
  Store,
  Image,
  FileText,
  HelpCircle,
  Ticket,
  Info,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import UploadCard from '../../components/upload/UploadCard';
import { fetchUploadTypes } from '../../../services/enterpriseAdminApi';

const ICON_MAP = {
  properties: Building2,
  rooms: BedDouble,
  tents: Tent,
  guides: Users,
  drivers: Car,
  customers: UserCircle,
  vendors: Store,
  banners: Image,
  blogs: FileText,
  faqs: HelpCircle,
  coupons: Ticket,
};

const SECTIONS = [
  {
    id: 'inventory',
    title: 'Listings & inventory',
    description: 'Hotels, rooms, tents, guides, and taxi partners',
    types: ['properties', 'rooms', 'tents', 'guides', 'drivers'],
  },
  {
    id: 'users',
    title: 'Users & partners',
    description: 'Customer accounts and vendor logins',
    types: ['customers', 'vendors'],
  },
  {
    id: 'cms',
    title: 'CMS & content',
    description: 'Homepage banners, blogs, and FAQs',
    types: ['banners', 'blogs', 'faqs'],
  },
  {
    id: 'marketing',
    title: 'Promotions',
    description: 'Discount coupons and offers',
    types: ['coupons'],
  },
];

export default function UploadCenterPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploadTypes()
      .then(setTypes)
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  }, []);

  const typeMap = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t])), [types]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upload Center"
        subtitle="Download Excel templates, fill in your data, and import in bulk"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Upload Center' }]}
      />

      <div className="upload-center-info admin-card">
        <Info size={20} className="shrink-0 text-primary" />
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-slate-800">How bulk upload works</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Download the template for the collection you need.</li>
            <li>Fill rows below the header — do not change column names.</li>
            <li>Upload the file; successful rows are saved, failed rows are listed with row numbers.</li>
          </ol>
          <p className="mt-2 text-xs text-slate-500">
            For images use public URLs in the template. List fields (amenities, tags) use comma-separated values.
            Boolean fields: TRUE / FALSE.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading upload types…</p>
      ) : (
        SECTIONS.map((section) => (
          <section key={section.id} className="space-y-4">
            <div>
              <h2 className="admin-section-title">{section.title}</h2>
              <p className="text-sm text-slate-500">{section.description}</p>
            </div>
            <div className="upload-center-grid">
              {section.types.map((typeId) => {
                const meta = typeMap[typeId];
                if (!meta) return null;
                return (
                  <UploadCard
                    key={typeId}
                    type={typeId}
                    label={meta.label}
                    description={meta.description}
                    icon={ICON_MAP[typeId] || FileText}
                    columnCount={meta.columns}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
