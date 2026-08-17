import Notification from '../models/Notification.js';
import { sendSMS } from './smsService.js';
import { sendEmail } from './emailService.js';
import { sendPushToUser } from './pushService.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'SYSTEM',
  link,
  phone,
  email,
  sendSms = false,
  sendMail = false,
  sendPush = true,
}) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    link,
  });

  if (sendSms && phone) {
    try {
      await sendSMS({ phone, message: `${title}: ${message}`, userId });
    } catch {
      /* non-blocking */
    }
  }

  if (sendMail && email) {
    try {
      await sendEmail({
        to: email,
        subject: title,
        html: `<p>${message}</p>${link ? `<p><a href="${link}">View details</a></p>` : ''}`,
      });
    } catch {
      /* non-blocking */
    }
  }

  if (sendPush && userId) {
    try {
      await sendPushToUser(userId, {
        title,
        body: message,
        data: { type, link: link || '', notificationId: String(notification._id) },
      });
    } catch {
      /* non-blocking */
    }
  }

  return notification;
};

export const listNotifications = async (userId, { unreadOnly = false, limit = 50 } = {}) => {
  const filter = { user: userId };
  if (unreadOnly) filter.isRead = false;
  return Notification.find(filter).sort('-createdAt').limit(Number(limit));
};

export const markNotificationRead = async (userId, id) =>
  Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });

export const markAllNotificationsRead = async (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
