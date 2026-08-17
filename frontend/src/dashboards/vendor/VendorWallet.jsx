import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';

export default function VendorWallet() {
  const [data, setData] = useState(null);
  const [points, setPoints] = useState(50);

  const load = async () => {
    try {
      const [wallet, sub] = await Promise.all([
        api.get('/admin/wallet').then((r) => r.data.data),
        api.get('/admin/subscriptions/me').then((r) => r.data.data),
      ]);
      setData({ wallet, sub });
    } catch {
      toast.error('Failed to load wallet');
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) return <Card className="p-8 text-center text-slate-500">Loading...</Card>;

  const { wallet, sub } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Wallet & Subscription</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Wallet balance</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(wallet?.user?.walletBalance || 0)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Point balance</p>
          <p className="text-2xl font-bold">{wallet?.user?.pointBalance || 0}</p>
          <p className="text-xs text-slate-500">
            {sub?.monetization?.pointsPerBooking || 10} points per booking acceptance
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Subscription</p>
          <p className="text-lg font-bold">
            {sub?.subscription?.plan?.name || 'None'}
          </p>
          {sub?.subscription?.endDate && (
            <p className="text-xs text-slate-500">
              Until {new Date(sub.subscription.endDate).toLocaleDateString()}
            </p>
          )}
        </Card>
      </div>

      <Card className="space-y-3 p-5">
        <h3 className="font-semibold">Recharge points</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            className="input-field max-w-[140px]"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
          <Button
            onClick={async () => {
              try {
                await api.post('/admin/subscriptions/points/purchase', {
                  points: Number(points),
                  amountPaid: Number(points) * (sub?.monetization?.pointRechargeRate || 1),
                });
                toast.success('Points added');
                load();
              } catch (e) {
                toast.error(e.response?.data?.message || 'Failed');
              }
            }}
          >
            Purchase points
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-semibold">Recent transactions</h3>
        <div className="space-y-2">
          {(wallet?.transactions || []).slice(0, 20).map((t) => (
            <div key={t._id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
              <span>{t.type} · {t.description || '—'}</span>
              <span>
                {t.amount ? formatCurrency(t.amount) : ''} {t.points ? `${t.points} pts` : ''}
              </span>
            </div>
          ))}
          {!wallet?.transactions?.length && <p className="text-sm text-slate-500">No transactions</p>}
        </div>
      </Card>
    </div>
  );
}
