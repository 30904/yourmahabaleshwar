import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Booking from '../models/Booking.js';
import Enquiry from '../models/Enquiry.js';
import KYC from '../models/KYC.js';
import Payout from '../models/Payout.js';
import Banner from '../models/Banner.js';
import Blog from '../models/Blog.js';
import FAQ from '../models/FAQ.js';
import { success, error } from '../utils/apiResponse.js';
import { persistMulterFile } from '../services/storageService.js';
import { canSeeFinance, canApprove } from '../utils/roleAccess.js';

export const getDashboardStats = async (req, res) => {
  const [users, hotels, tents, guides, drivers, bookings, enquiries, pendingKyc] = await Promise.all([
    User.countDocuments(),
    Hotel.countDocuments({ isActive: true }),
    Tent.countDocuments({ isActive: true }),
    Guide.countDocuments({ isActive: true }),
    Driver.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Enquiry.countDocuments({ status: 'NEW' }),
    KYC.countDocuments({ status: 'PENDING' }),
  ]);
  const payload = {
    users,
    hotels,
    tents,
    guides,
    drivers,
    bookings,
    enquiries,
    pendingKyc,
  };

  if (canSeeFinance(req.user?.role)) {
    const revenue = await Booking.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total' }, commission: { $sum: '$commission' } } },
    ]);
    payload.revenue = revenue[0] || { total: 0, commission: 0 };
  }

  return success(res, payload);
};

export const getKycList = async (req, res) => {
  const list = await KYC.find().populate('user', 'name email role phone').sort('-createdAt');
  return success(res, list);
};

export const updateKyc = async (req, res) => {
  if (!canApprove(req.user?.role)) {
    return error(res, 'Only super admin can approve or reject KYC', 403);
  }
  const kyc = await KYC.findByIdAndUpdate(
    req.params.id,
    { ...req.body, reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  ).populate('user', 'name email phone');
  if (!kyc) return error(res, 'KYC not found', 404);

  if (kyc.user && (req.body.status === 'APPROVED' || req.body.status === 'REJECTED')) {
    const { createNotification } = await import('../services/notificationService.js');
    await createNotification({
      userId: kyc.user._id,
      title: req.body.status === 'APPROVED' ? 'KYC approved' : 'KYC rejected',
      message:
        req.body.status === 'APPROVED'
          ? 'Your vendor documents were approved. You can now accept bookings.'
          : `Your KYC was rejected. ${req.body.rejectionReason || 'Please re-submit documents.'}`,
      type: 'KYC',
      email: kyc.user.email,
      phone: kyc.user.phone,
      sendMail: true,
    });
  }

  return success(res, kyc);
};

export const getPayouts = async (req, res) => {
  const payouts = await Payout.find().populate('vendor', 'name email').sort('-createdAt');
  return success(res, payouts);
};

export const getUsers = async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt').limit(200);
  return success(res, users);
};

export const getCmsBanners = async (req, res) => success(res, await Banner.find().sort('order'));

export const createBanner = async (req, res) => {
  const imageUrl = req.body.imageUrl?.trim();
  let uploaded = null;
  if (req.file) {
    const saved = await persistMulterFile(req.file, 'cms-banner', {
      bannerId: req.body.bannerId || 'new',
    });
    uploaded = saved.key;
  }
  const image = uploaded || imageUrl;

  if (!image) return error(res, 'Banner image is required (upload a file or paste URL)', 400);
  if (!req.body.title?.trim()) return error(res, 'Title is required', 400);

  const banner = await Banner.create({
    title: req.body.title.trim(),
    subtitle: req.body.subtitle?.trim() || '',
    image,
    link: req.body.link?.trim() || '',
    vertical: req.body.vertical || 'ALL',
    order: Number(req.body.order) || 0,
    isActive: req.body.isActive !== 'false',
  });
  return success(res, banner, 'Created', 201);
};
const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const parseTags = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
};

function buildBlogPayload(body, userId, existing = null) {
  const uploaded = body._coverPath;
  const coverImage = uploaded || body.coverImageUrl?.trim() || existing?.coverImage || '';
  const isPublished = body.isPublished === true || body.isPublished === 'true';
  return {
    title: body.title?.trim() || existing?.title,
    slug: body.slug?.trim() || slugify(body.title || existing?.title),
    excerpt: body.excerpt ?? existing?.excerpt ?? '',
    content: body.content ?? existing?.content ?? '',
    coverImage,
    tags: body.tags !== undefined ? parseTags(body.tags) : existing?.tags || [],
    isPublished,
    publishedAt: isPublished ? body.publishedAt || existing?.publishedAt || new Date() : undefined,
    author: existing?.author || userId,
  };
}

export const getCmsBlogs = async (req, res) => {
  const blogs = await Blog.find().populate('author', 'name email').sort('-createdAt');
  return success(res, blogs);
};

export const getCmsBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('author', 'name email');
  if (!blog) return error(res, 'Blog not found', 404);
  return success(res, blog);
};

export const createBlog = async (req, res) => {
  try {
    if (!req.body.title?.trim()) return error(res, 'Title is required', 400);
    if (!req.body.content?.trim()) return error(res, 'Content is required', 400);

    let coverPath = null;
    if (req.file) {
      const saved = await persistMulterFile(req.file, 'cms-blog', { blogId: 'new' });
      coverPath = saved.key;
    }
    const payload = buildBlogPayload({ ...req.body, _coverPath: coverPath }, req.user._id);

    const existing = await Blog.findOne({ slug: payload.slug });
    if (existing) payload.slug = `${payload.slug}-${Date.now()}`;

    const blog = await Blog.create(payload);
    const populated = await Blog.findById(blog._id).populate('author', 'name email');
    return success(res, populated, 'Blog created', 201);
  } catch (e) {
    return error(res, e.message || 'Create failed', 500);
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return error(res, 'Blog not found', 404);

    let coverPath = null;
    if (req.file) {
      const saved = await persistMulterFile(req.file, 'cms-blog', { blogId: blog._id.toString() });
      coverPath = saved.key;
    }
    const payload = buildBlogPayload({ ...req.body, _coverPath: coverPath }, req.user._id, blog);

    if (payload.slug !== blog.slug) {
      const clash = await Blog.findOne({ slug: payload.slug, _id: { $ne: blog._id } });
      if (clash) payload.slug = `${payload.slug}-${Date.now()}`;
    }

    Object.assign(blog, payload);
    await blog.save();
    const populated = await Blog.findById(blog._id).populate('author', 'name email');
    return success(res, populated, 'Blog updated');
  } catch (e) {
    return error(res, e.message || 'Update failed', 500);
  }
};

export const deleteBlog = async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) return error(res, 'Blog not found', 404);
  return success(res, null, 'Blog deleted');
};
export const getCmsFaqs = async (req, res) => success(res, await FAQ.find().sort('order'));
export const createFaq = async (req, res) => success(res, await FAQ.create(req.body), 'Created', 201);

export const getPublicBanners = async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort('order');
  return success(res, banners);
};

export const getPublicFaqs = async (req, res) => {
  const faqs = await FAQ.find({ isActive: true }).sort('order');
  return success(res, faqs);
};

export const getPublicBlogs = async (req, res) => {
  const blogs = await Blog.find({ isPublished: true }).sort('-publishedAt').limit(20);
  return success(res, blogs);
};
