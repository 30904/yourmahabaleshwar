import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReviewScore from './ReviewScore';

const INITIAL_LIMIT = 5;

export default function ListingReviewsSection({
  reviews = [],
  score,
  label,
  reviewCount,
  emptyMessage,
  className = 'mt-6 max-w-3xl card p-6',
  scoreSize = 'lg',
}) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const total = reviews.length;
  const visible = showAll ? reviews : reviews.slice(0, INITIAL_LIMIT);
  const canToggle = total > INITIAL_LIMIT;

  useEffect(() => {
    setShowAll(false);
  }, [reviews]);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <ReviewScore
          score={score}
          label={label}
          reviewCount={reviewCount ?? total}
          size={scoreSize}
        />
        {canToggle ? (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {showAll ? t('property.showLessReviews') : t('property.viewAllReviews')}
          </button>
        ) : null}
      </div>

      {total > 0 ? (
        <div className="mt-6 space-y-3">
          {visible.map((r) => (
            <div key={r._id} className="rounded-xl border border-slate-100 p-4">
              <p className="font-medium text-slate-900">
                {r.user?.name || 'Guest'} · {r.rating}/5
              </p>
              {r.comment ? <p className="mt-1 text-sm text-slate-600">{r.comment}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-slate-600">
          {emptyMessage || t('property.noReviewsYet')}
        </p>
      )}
    </div>
  );
}
