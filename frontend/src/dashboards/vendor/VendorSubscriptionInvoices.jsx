import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  downloadSubscriptionInvoice,
  fetchMySubscriptionInvoices,
} from '../../services/subscriptionInvoicesApi';
import { formatCurrency } from '../../utils/format';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function VendorSubscriptionInvoices({ refreshKey = 0 }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchMySubscriptionInvoices()
      .then(setItems)
      .catch(() => toast.error(t('subscriptionInvoices.loadFailed')))
      .finally(() => setLoading(false));
  }, [t, refreshKey]);

  const download = async (inv) => {
    setBusyId(String(inv._id));
    try {
      await downloadSubscriptionInvoice(inv._id, inv.invoiceNumber);
    } catch {
      toast.error(t('subscriptionInvoices.downloadFailed'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-primary" />
        <h3 className="font-semibold text-slate-900">{t('subscriptionInvoices.title')}</h3>
      </div>
      <p className="text-sm text-slate-500">{t('subscriptionInvoices.subtitle')}</p>

      {loading ? (
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      ) : !items.length ? (
        <p className="text-sm text-slate-400">{t('subscriptionInvoices.empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((inv) => (
            <li key={inv._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-slate-900">{inv.title}</p>
                <p className="text-xs text-slate-500">
                  {inv.invoiceNumber} · {formatDate(inv.createdAt)} · {formatCurrency(inv.amount)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="px-3 py-1.5 text-sm"
                disabled={busyId === String(inv._id)}
                onClick={() => download(inv)}
              >
                <Download size={14} />
                {busyId === String(inv._id) ? t('common.loading') : t('subscriptionInvoices.download')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
