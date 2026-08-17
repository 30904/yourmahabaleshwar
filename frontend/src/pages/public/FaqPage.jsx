import { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Skeleton from '../../components/ui/Skeleton';
import { fetchPublicFaqs } from '../../services/listingsApi';

const fallbackFaqs = [
  { question: 'How do I cancel my booking?', answer: 'Go to My Bookings in your account. Free cancellation applies on properties marked with the green badge.', category: 'BOOKING' },
  { question: 'Is GST included in the price?', answer: '12% GST is calculated at checkout and appears on your invoice.', category: 'PAYMENT' },
  { question: 'Can I pay at the property?', answer: 'Many listings offer pay at property. Others require online payment to confirm.', category: 'PAYMENT' },
  { question: 'How do reviews work?', answer: 'Only guests who completed a stay can leave verified reviews.', category: 'REVIEWS' },
  { question: 'How do I list my hotel?', answer: 'Click List your property. Our team verifies KYC before going live.', category: 'PARTNERS' },
];

export default function FaqPage() {
  const { i18n } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicFaqs()
      .then((data) => setFaqs(data.length ? data : fallbackFaqs))
      .catch(() => setFaqs(fallbackFaqs))
      .finally(() => setLoading(false));
  }, []);

  const q = (f) => (i18n.language === 'mr' && f.questionMr ? f.questionMr : f.question);
  const a = (f) => (i18n.language === 'mr' && f.answerMr ? f.answerMr : f.answer);

  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-12 text-white">
        <div className="page-container">
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <HelpCircle size={32} /> Help Centre
          </h1>
          <p className="mt-2 text-blue-100">Answers about booking in Mahabaleshwar</p>
        </div>
      </div>
      <div className="page-container max-w-3xl py-10">
        {loading ? (
          <Skeleton className="h-24" />
        ) : (
          faqs.map((f, i) => (
            <div key={f._id || i} className="card mb-3 overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="font-semibold text-slate-900">{q(f)}</span>
                <ChevronDown size={20} className={`shrink-0 transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="border-t border-border px-5 pb-5 pt-2 text-sm text-slate-600">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-primary">{f.category}</span>
                  <p className="mt-2">{a(f)}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
