import { runBackup } from '../services/backupService.js';
import VendorSubscription from '../models/VendorSubscription.js';
import { expireStayListingSubscriptions, backfillMissingStaySubscriptions } from '../services/stayListingSubscriptionService.js';
import Advertisement from '../models/Advertisement.js';
import { createNotification } from '../services/notificationService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

let timersStarted = false;

const expireSubscriptions = async () => {
  const expired = await VendorSubscription.find({
    status: 'ACTIVE',
    endDate: { $lte: new Date() },
  });
  for (const sub of expired) {
    sub.status = 'EXPIRED';
    await sub.save();
    await createNotification({
      userId: sub.vendor,
      title: 'Subscription expired',
      message: 'Your vendor subscription has expired. Renew or recharge points to accept bookings.',
      type: 'SYSTEM',
    });
  }
};

const expireAds = async () => {
  await Advertisement.updateMany(
    { status: 'ACTIVE', endDate: { $lte: new Date() } },
    { status: 'EXPIRED' }
  );
};

export const startScheduledJobs = () => {
  if (timersStarted) return;
  timersStarted = true;

  backfillMissingStaySubscriptions().catch((err) =>
    console.error('[job] stay subscription backfill failed', err.message)
  );

  // Daily backup — every 24h
  setInterval(() => {
    runBackup({ type: 'DAILY', scope: 'FULL' }).catch((err) =>
      console.error('[job] daily backup failed', err.message)
    );
  }, DAY_MS);

  // Weekly backup — every 7 days
  setInterval(() => {
    runBackup({ type: 'WEEKLY', scope: 'FULL' }).catch((err) =>
      console.error('[job] weekly backup failed', err.message)
    );
  }, 7 * DAY_MS);

  // Expire subscriptions & ads hourly
  setInterval(() => {
    expireSubscriptions().catch(() => {});
    expireStayListingSubscriptions().catch(() => {});
    expireAds().catch(() => {});
  }, 60 * 60 * 1000);

  console.log('[jobs] Scheduled: daily/weekly backup + hourly expiry checks');
};
