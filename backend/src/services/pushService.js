import DeviceToken from '../models/DeviceToken.js';

/**
 * Push delivery — uses Firebase Admin when FIREBASE_SERVICE_ACCOUNT_JSON is set,
 * otherwise logs and no-ops (safe for local/dev).
 */
export const registerDeviceToken = async ({ userId, token, platform = 'ANDROID', appRole = 'ANY' }) => {
  if (!token) throw new Error('token required');
  const doc = await DeviceToken.findOneAndUpdate(
    { user: userId, token },
    { platform, appRole, isActive: true, lastSeenAt: new Date() },
    { upsert: true, new: true }
  );
  return doc;
};

export const removeDeviceToken = async ({ userId, token }) => {
  await DeviceToken.deleteOne({ user: userId, token });
};

export const listActiveTokens = async (userId) => {
  const docs = await DeviceToken.find({ user: userId, isActive: true }).select('token platform');
  return docs.map((d) => d.token);
};

let messaging = null;

const getMessaging = async () => {
  if (messaging !== null) return messaging;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    messaging = false;
    return messaging;
  }
  try {
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      const cred = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(cred) });
    }
    messaging = admin.messaging();
  } catch (err) {
    console.warn('[push] Firebase init failed:', err.message);
    messaging = false;
  }
  return messaging;
};

const isExpoToken = (token) => String(token || '').startsWith('ExponentPushToken');

const sendExpoPush = async (tokens, { title, body, data = {} }) => {
  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data,
  }));
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  const json = await res.json().catch(() => ({}));
  return { sent: messages.length, provider: 'expo', raw: json };
};

export const sendPushToUser = async (userId, { title, body, data = {} }) => {
  const tokens = await listActiveTokens(userId);
  if (!tokens.length) return { sent: 0, skipped: true };

  const expoTokens = tokens.filter(isExpoToken);
  const fcmTokens = tokens.filter((t) => !isExpoToken(t));
  const results = { sent: 0, expo: 0, fcm: 0 };

  if (expoTokens.length) {
    try {
      const r = await sendExpoPush(expoTokens, { title, body, data });
      results.expo = r.sent;
      results.sent += r.sent;
    } catch (err) {
      console.warn('[push:expo]', err.message);
    }
  }

  if (fcmTokens.length) {
    const msg = await getMessaging();
    if (!msg) {
      console.log(`[push:mock-fcm] user=${userId} title=${title} tokens=${fcmTokens.length}`);
    } else {
      const res = await msg.sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: { priority: 'high' },
      });
      results.fcm = res.successCount;
      results.sent += res.successCount;
      res.responses.forEach((r, i) => {
        if (
          r.error &&
          (r.error.code === 'messaging/registration-token-not-registered' ||
            r.error.code === 'messaging/invalid-registration-token')
        ) {
          DeviceToken.updateOne({ token: fcmTokens[i] }, { isActive: false }).catch(() => {});
        }
      });
    }
  }

  if (!results.sent && !expoTokens.length && !fcmTokens.length) {
    console.log(`[push:mock] user=${userId} title=${title}`);
  }

  return results;
};
