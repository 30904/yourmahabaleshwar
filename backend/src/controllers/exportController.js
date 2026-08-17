import xlsx from 'xlsx';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import VendorSubscription from '../models/VendorSubscription.js';
import Advertisement from '../models/Advertisement.js';
import User from '../models/User.js';
import { VENDOR_ROLES } from '../constants/roles.js';
import { error } from '../utils/apiResponse.js';

const sendWorkbook = (res, sheetName, rows, filename) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buf);
};

export const exportReport = async (req, res) => {
  try {
    const type = (req.query.type || 'bookings').toLowerCase();
    const { from, to } = req.query;
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to);
    }

    if (type === 'bookings' || type === 'revenue' || type === 'gst' || type === 'refunds') {
      const bookings = await Booking.find(dateFilter)
        .populate('customer', 'name email')
        .populate('vendor', 'name email')
        .sort('-createdAt')
        .limit(5000)
        .lean();
      let rows = bookings.map((b) => ({
        bookingNumber: b.bookingNumber,
        type: b.type,
        status: b.status,
        paymentStatus: b.paymentStatus,
        refundStatus: b.refundStatus,
        customer: b.customer?.name,
        vendor: b.vendor?.name,
        subtotal: b.subtotal,
        gst: b.gst,
        commission: b.commission,
        total: b.total,
        refundAmount: b.refundAmount || 0,
        checkIn: b.checkIn,
        createdAt: b.createdAt,
      }));
      if (type === 'refunds') {
        rows = rows.filter((r) => r.refundStatus && r.refundStatus !== 'NONE');
      }
      return sendWorkbook(res, type, rows, `${type}-report.xlsx`);
    }

    if (type === 'payments') {
      const payments = await Payment.find(dateFilter)
        .populate('user', 'name email')
        .sort('-createdAt')
        .limit(5000)
        .lean();
      const rows = payments.map((p) => ({
        id: String(p._id),
        user: p.user?.name,
        amount: p.amount,
        status: p.status,
        method: p.method,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        createdAt: p.createdAt,
      }));
      return sendWorkbook(res, 'payments', rows, 'payments-report.xlsx');
    }

    if (type === 'subscriptions') {
      const subs = await VendorSubscription.find(dateFilter)
        .populate('vendor', 'name email')
        .populate('plan', 'name code')
        .sort('-createdAt')
        .limit(2000)
        .lean();
      const rows = subs.map((s) => ({
        vendor: s.vendor?.name,
        plan: s.plan?.name,
        status: s.status,
        amountPaid: s.amountPaid,
        startDate: s.startDate,
        endDate: s.endDate,
      }));
      return sendWorkbook(res, 'subscriptions', rows, 'subscriptions-report.xlsx');
    }

    if (type === 'ads') {
      const ads = await Advertisement.find(dateFilter)
        .populate('package', 'name')
        .populate('vendor', 'name')
        .lean();
      const rows = ads.map((a) => ({
        title: a.title,
        package: a.package?.name,
        vendor: a.vendor?.name,
        status: a.status,
        impressions: a.impressions,
        clicks: a.clicks,
        amountPaid: a.amountPaid,
        endDate: a.endDate,
      }));
      return sendWorkbook(res, 'ads', rows, 'ads-report.xlsx');
    }

    if (type === 'vendors') {
      const vendors = await User.find({ role: { $in: VENDOR_ROLES } })
        .select('name email phone role walletBalance pointBalance isActive createdAt')
        .lean();
      return sendWorkbook(res, 'vendors', vendors, 'vendors-report.xlsx');
    }

    if (type === 'customers') {
      const customers = await User.find({ role: 'CUSTOMER' })
        .select('name email phone isActive createdAt')
        .limit(5000)
        .lean();
      return sendWorkbook(res, 'customers', customers, 'customers-report.xlsx');
    }

    return error(res, 'Unknown report type', 400);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
