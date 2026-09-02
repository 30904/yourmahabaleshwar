import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { KycDocumentGrid } from '../../admin/components/DocumentThumb';
import { fetchKycList, updateKyc } from '../../services/adminApi';
import useAdminAccess from '../../hooks/useAdminAccess';

export default function AdminKYC() {
  const { canApprove } = useAdminAccess();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
      <h2 className="text-xl font-bold">KYC {canApprove ? 'Approvals' : 'Review'}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {canApprove
          ? 'Review uploaded vendor documents before approving.'
          : 'View vendor KYC submissions. Approval is handled by super admin only.'}
      </p>
      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">No KYC submissions.</Card>
        ) : (
          items.map((i) => (
            <Card key={i._id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-medium">{i.user?.name || 'Vendor'}</span>
                  <p className="text-sm text-slate-500">{i.user?.email} · {i.user?.role}</p>
                  {(i.aadhar || i.pan) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {i.aadhar ? `Aadhaar: ${i.aadhar}` : ''}
                      {i.pan ? ` · PAN: ${i.pan}` : ''}
                    </p>
                  )}
                </div>
                <Badge color={i.status === 'APPROVED' ? 'success' : i.status === 'REJECTED' ? 'danger' : 'warning'}>
                  {i.status}
                </Badge>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setExpandedId(expandedId === i._id ? null : i._id)}>
                    {expandedId === i._id ? 'Hide documents' : 'View documents'}
                  </Button>
                  {canApprove && i.status === 'PENDING' && (
                    <>
                      <Button variant="outline" onClick={() => handle(i._id, 'REJECTED')}>Reject</Button>
                      <Button onClick={() => handle(i._id, 'APPROVED')}>Approve</Button>
                    </>
                  )}
                </div>
              </div>
              {expandedId === i._id && (
                <div className="border-t border-slate-100 pt-4">
                  <KycDocumentGrid kyc={i} />
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
