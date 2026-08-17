import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { fetchKycList, updateKyc } from '../../services/adminApi';

export default function AdminKYC() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchKycList()
      .then(setItems)
      .catch(() => toast.error('Failed to load KYC'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handle = async (id, status) => {
    try {
      await updateKyc(id, { status });
      toast.success(`KYC ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  if (loading) return <Skeleton className="h-32" />;

  return (
    <div>
      <h2 className="text-xl font-bold">KYC Approvals</h2>
      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">No KYC submissions.</Card>
        ) : (
          items.map((i) => (
            <Card key={i._id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-medium">{i.user?.name || 'Vendor'}</span>
                <p className="text-sm text-slate-500">{i.user?.email} · {i.user?.role}</p>
              </div>
              <Badge color={i.status === 'APPROVED' ? 'success' : i.status === 'REJECTED' ? 'danger' : 'warning'}>
                {i.status}
              </Badge>
              {i.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handle(i._id, 'REJECTED')}>Reject</Button>
                  <Button onClick={() => handle(i._id, 'APPROVED')}>Approve</Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
