import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/reviews/pending')
      .then((res) => setReviews(res.data.data || []))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id, approve) => {
    try {
      await api.patch(`/reviews/${id}/moderate`, { approve });
      toast.success(approve ? 'Approved' : 'Rejected');
      load();
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Review moderation</h1>
      {!reviews.length && <Card className="p-8 text-center text-slate-500">No pending reviews</Card>}
      {reviews.map((r) => (
        <Card key={r._id} className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{r.user?.name || 'Guest'} · {r.rating}/5</p>
            <p className="mt-1 text-sm text-slate-600">{r.comment || '—'}</p>
            <p className="mt-1 text-xs text-slate-400">{r.listingType} · booking {r.booking}</p>
          </div>
          <div className="flex gap-2">
            <Button className="px-3 py-1.5 text-sm" onClick={() => moderate(r._id, true)}>Approve</Button>
            <Button className="px-3 py-1.5 text-sm" variant="outline" onClick={() => moderate(r._id, false)}>Reject</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
