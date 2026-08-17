import SMSLog from '../models/SMSLog.js';

export const sendSMS = async ({ phone, message, provider = 'FAST2SMS', templateId, userId }) => {
  const log = await SMSLog.create({
    phone,
    message,
    provider,
    templateId,
    user: userId,
    status: 'PENDING',
  });

  try {
    if (provider === 'FAST2SMS' && process.env.FAST2SMS_API_KEY) {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ route: 'q', message, language: 'english', flash: 0, numbers: phone }),
      });
      const data = await res.json();
      log.status = data.return ? 'SENT' : 'FAILED';
      log.response = data;
    } else if (provider === 'MSG91' && process.env.MSG91_AUTH_KEY) {
      log.status = 'SENT';
      log.response = { mock: true, note: 'Configure MSG91 API in production' };
    } else {
      log.status = 'SENT';
      log.response = { mock: true, message: 'SMS logged (no provider configured)' };
    }
    await log.save();
    return log;
  } catch (err) {
    log.status = 'FAILED';
    log.response = { error: err.message };
    await log.save();
    throw err;
  }
};
