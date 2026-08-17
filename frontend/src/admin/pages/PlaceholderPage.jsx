import PageHeader from '../components/PageHeader';

export default function PlaceholderPage({ title, subtitle, module }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle || `${module} module — extend with full CRUD`} />
      <div className="admin-card p-12 text-center">
        <p className="text-lg font-semibold text-slate-800">{title}</p>
        <p className="mt-2 text-slate-500">This section is wired in navigation. Connect additional APIs as needed.</p>
      </div>
    </div>
  );
}
