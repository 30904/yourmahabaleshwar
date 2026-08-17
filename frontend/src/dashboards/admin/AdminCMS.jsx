import Card from '../../components/ui/Card';
import { Image, HelpCircle, FileText } from 'lucide-react';
export default function AdminCMS() {
  const modules = ['Banners', 'Blogs', 'FAQ', 'SMS Templates', 'Email Templates', 'Settings'];
  return (
    <div>
      <h2 className="text-xl font-bold">CMS Management</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(m => <Card key={m} className="cursor-pointer hover:shadow-soft"><p className="font-semibold">{m}</p><p className="text-sm text-slate-500">Manage {m.toLowerCase()}</p></Card>)}
      </div>
    </div>
  );
}
