import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

/**
 * Simple vendor availability editor — mark blocked dates for owned tent/homestay/horse.
 * Expects listingType + listingId from parent or form.
 */
export default function VendorAvailability() {
  const [type, setType] = useState('tent');
  const [id, setId] = useState('');
  const [date, setDate] = useState('');
  const [blocked, setBlocked] = useState([]);

  const load = async () => {
    if (!id) return;
    try {
      const from = new Date().toISOString().slice(0, 10);
      const to = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const res = await api.get(`/availability/${type}/${id}`, { params: { from, to } });
      setBlocked(res.data.data?.blockedDates || []);
    } catch {
      toast.error('Could not load availability');
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id, type]);

  const blockDate = async () => {
    if (!id || !date) return;
    try {
      await api.patch(`/availability/${type}/${id}`, { blockedDates: [date], action: 'add' });
      toast.success('Date blocked');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const unblock = async (d) => {
    try {
      await api.patch(`/availability/${type}/${id}`, {
        blockedDates: [d],
        action: 'remove',
      });
      toast.success('Date unblocked');
      load();
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold">Availability calendar</h2>
      <p className="mt-1 text-sm text-slate-500">Block dates when you cannot accept bookings</p>
      <Card className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Listing type
            <select className="input-field mt-1" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="tent">Tent</option>
              <option value="homestay">Homestay</option>
              <option value="horse">Horse</option>
              <option value="room">Hotel room</option>
            </select>
          </label>
          <Input label="Listing ID" value={id} onChange={(e) => setId(e.target.value)} />
          <Input label="Block date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button onClick={blockDate}>Block date</Button>
        <div className="flex flex-wrap gap-2">
          {(blocked || []).map((d) => {
            const key = new Date(d).toISOString().slice(0, 10);
            return (
              <button
                key={key}
                type="button"
                className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700"
                onClick={() => unblock(key)}
              >
                {key} ×
              </button>
            );
          })}
          {!blocked?.length && <p className="text-sm text-slate-500">No blocked dates</p>}
        </div>
      </Card>
    </div>
  );
}
