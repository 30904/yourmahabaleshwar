import Enquiry from '../models/Enquiry.js';
import { success, error } from '../utils/apiResponse.js';
import { sendSMS } from '../services/smsService.js';

export const createEnquiry = async (req, res) => {
  const enquiry = await Enquiry.create(req.body);
  try {
    await sendSMS({
      phone: req.body.phone,
      message: `Thank you for your enquiry on YOURMAHABALESHWAR.COM. Our team will contact you shortly.`,
    });
  } catch {
    /* non-blocking */
  }
  return success(res, enquiry, 'Enquiry submitted', 201);
};

export const getEnquiries = async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const enquiries = await Enquiry.find(filter).sort('-createdAt').limit(100);
  return success(res, enquiries);
};

export const updateEnquiry = async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!enquiry) return error(res, 'Enquiry not found', 404);
  return success(res, enquiry);
};
