import bcrypt from 'bcryptjs';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import Banner from '../models/Banner.js';
import Blog from '../models/Blog.js';
import FAQ from '../models/FAQ.js';
import Coupon from '../models/Coupon.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';
import { UPLOAD_TYPES, slugify, parseBool, parseList } from '../utils/uploadCenterTemplates.js';

function rowResult(errors, rowNum, message) {
  errors.push({ row: rowNum, message });
}

export async function importBulkData(type, rows, adminUserId) {
  const errors = [];
  let created = 0;

  switch (type) {
    case 'properties':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          if (!r.name) {
            rowResult(errors, rowNum, 'Property name is required');
            continue;
          }
          const slug = slugify(r.name);
          const existing = await Hotel.findOne({ slug });
          if (existing) {
            rowResult(errors, rowNum, `Property "${r.name}" already exists`);
            continue;
          }
          const images = parseList(r.imageUrls);
          const hotel = await Hotel.create({
            name: String(r.name).trim(),
            slug,
            type: String(r.type || 'HOTEL').toUpperCase() === 'RESORT' ? 'RESORT' : 'HOTEL',
            description: r.description || '',
            shortDescription: r.shortDescription || '',
            address: {
              line1: r.addressLine1 || '',
              city: r.city || 'Mahabaleshwar',
              state: r.state || 'Maharashtra',
              pincode: String(r.pincode || ''),
            },
            location: {
              lat: Number(r.lat) || 17.9307,
              lng: Number(r.lng) || 73.6477,
            },
            amenities: parseList(r.amenities),
            rating: Number(r.rating) || 4,
            checkInTime: r.checkInTime || '14:00',
            checkOutTime: r.checkOutTime || '11:00',
            policies: r.policies || '',
            isActive: parseBool(r.isActive),
            isFeatured: parseBool(r.isFeatured, false),
            images: images.length ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
            vendor: adminUserId,
          });
          if (r.roomName && r.roomPrice) {
            await Room.create({
              hotel: hotel._id,
              name: String(r.roomName).trim(),
              type: ['STANDARD', 'DELUXE', 'SUITE', 'FAMILY'].includes(String(r.roomType).toUpperCase())
                ? String(r.roomType).toUpperCase()
                : 'STANDARD',
              basePrice: Number(r.roomPrice),
              capacity: Number(r.roomCapacity) || 2,
              totalRooms: Number(r.roomTotal) || 5,
            });
          }
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'rooms':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          const hotel = await Hotel.findOne({ name: new RegExp(`^${String(r.propertyName).trim()}$`, 'i') });
          if (!hotel) {
            rowResult(errors, rowNum, `Property "${r.propertyName}" not found`);
            continue;
          }
          if (!r.roomName || !r.basePrice) {
            rowResult(errors, rowNum, 'roomName and basePrice are required');
            continue;
          }
          await Room.create({
            hotel: hotel._id,
            name: String(r.roomName).trim(),
            type: String(r.roomType || 'STANDARD').toUpperCase(),
            basePrice: Number(r.basePrice),
            capacity: Number(r.capacity) || 2,
            totalRooms: Number(r.totalRooms) || 5,
            description: r.description || '',
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'tents':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          if (!r.name || !r.pricePerNight) {
            rowResult(errors, rowNum, 'name and pricePerNight are required');
            continue;
          }
          const slug = slugify(r.name);
          if (await Tent.findOne({ slug })) {
            rowResult(errors, rowNum, `Tent "${r.name}" already exists`);
            continue;
          }
          await Tent.create({
            name: String(r.name).trim(),
            slug,
            description: r.description || '',
            location: r.location || 'Mahabaleshwar',
            capacity: Number(r.capacity) || 2,
            totalTents: Number(r.totalTents) || 10,
            pricePerNight: Number(r.pricePerNight),
            amenities: parseList(r.amenities),
            rating: Number(r.rating) || 4,
            isActive: parseBool(r.isActive),
            isFeatured: parseBool(r.isFeatured, false),
            images: parseList(r.imageUrls),
            operator: adminUserId,
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'guides':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          if (!r.name || !r.package6hr || !r.package12hr) {
            rowResult(errors, rowNum, 'name, package6hr and package12hr are required');
            continue;
          }
          const slug = slugify(r.name);
          if (await Guide.findOne({ slug })) {
            rowResult(errors, rowNum, `Guide "${r.name}" already exists`);
            continue;
          }
          await Guide.create({
            name: String(r.name).trim(),
            slug,
            bio: r.bio || '',
            languages: parseList(r.languages),
            specialties: parseList(r.specialties),
            experience: Number(r.experience) || 1,
            package6hr: Number(r.package6hr),
            package12hr: Number(r.package12hr),
            bikeAddonPrice: Number(r.bikeAddonPrice) || 500,
            rating: Number(r.rating) || 4.5,
            isActive: parseBool(r.isActive),
            isFeatured: parseBool(r.isFeatured, false),
            photo: r.photoUrl || '',
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'drivers':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          if (!r.name) {
            rowResult(errors, rowNum, 'name is required');
            continue;
          }
          const slug = slugify(r.name);
          if (await Driver.findOne({ slug })) {
            rowResult(errors, rowNum, `Driver "${r.name}" already exists`);
            continue;
          }
          const vehicleTypes = ['SEDAN', 'SUV', 'TEMPO', 'INNOVA', 'BIKE'];
          const vt = String(r.vehicleType || 'SEDAN').toUpperCase();
          await Driver.create({
            name: String(r.name).trim(),
            slug,
            phone: r.phone || '',
            vehicleType: vehicleTypes.includes(vt) ? vt : 'SEDAN',
            vehicleNumber: r.vehicleNumber || '',
            perTripPrice: Number(r.perTripPrice) || 0,
            hourlyRate: Number(r.hourlyRate) || 0,
            rating: Number(r.rating) || 4.3,
            isActive: parseBool(r.isActive),
            isAvailable: parseBool(r.isAvailable),
            photo: r.photoUrl || '',
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'customers':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          const email = String(r.email || '').toLowerCase().trim();
          if (!r.name || !email) {
            rowResult(errors, rowNum, 'name and email are required');
            continue;
          }
          if (await User.findOne({ email })) {
            rowResult(errors, rowNum, `Email ${email} already exists`);
            continue;
          }
          const password = r.password || 'Customer@123';
          await User.create({
            name: String(r.name).trim(),
            email,
            phone: r.phone || '',
            password: await bcrypt.hash(String(password), 12),
            role: ROLES.CUSTOMER,
            isActive: parseBool(r.isActive),
            address: {
              city: r.city || '',
              state: r.state || '',
              pincode: String(r.pincode || ''),
            },
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'vendors':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          const email = String(r.email || '').toLowerCase().trim();
          const role = String(r.role || '').toUpperCase();
          if (!r.name || !email || !VENDOR_ROLES.includes(role)) {
            rowResult(errors, rowNum, 'name, email and valid role are required (HOTEL_VENDOR, TENT_OPERATOR, GUIDE, DRIVER)');
            continue;
          }
          if (await User.findOne({ email })) {
            rowResult(errors, rowNum, `Email ${email} already exists`);
            continue;
          }
          await User.create({
            name: String(r.name).trim(),
            email,
            phone: r.phone || '',
            password: await bcrypt.hash(String(r.password || 'Vendor@123'), 12),
            role,
            isActive: parseBool(r.isActive),
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'banners':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          if (!r.title || !r.imageUrl) {
            rowResult(errors, rowNum, 'title and imageUrl are required');
            continue;
          }
          await Banner.create({
            title: String(r.title).trim(),
            subtitle: r.subtitle || '',
            image: String(r.imageUrl).trim(),
            link: r.link || '',
            vertical: r.vertical || 'ALL',
            order: Number(r.order) || 0,
            isActive: parseBool(r.isActive),
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'blogs':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          if (!r.title) {
            rowResult(errors, rowNum, 'title is required');
            continue;
          }
          const slug = slugify(r.title);
          if (await Blog.findOne({ slug })) {
            rowResult(errors, rowNum, `Blog "${r.title}" already exists`);
            continue;
          }
          const published = parseBool(r.isPublished, false);
          await Blog.create({
            title: String(r.title).trim(),
            slug,
            excerpt: r.excerpt || '',
            content: r.content || '',
            coverImage: r.coverImageUrl || '',
            tags: parseList(r.tags),
            isPublished: published,
            publishedAt: published ? new Date() : undefined,
            author: adminUserId,
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'faqs':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          if (!r.question || !r.answer) {
            rowResult(errors, rowNum, 'question and answer are required');
            continue;
          }
          await FAQ.create({
            question: String(r.question).trim(),
            answer: String(r.answer).trim(),
            category: r.category || 'GENERAL',
            order: Number(r.order) || 0,
            isActive: parseBool(r.isActive),
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    case 'coupons':
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2;
        try {
          const code = String(r.code || '').toUpperCase().trim();
          if (!code || !r.discountValue) {
            rowResult(errors, rowNum, 'code and discountValue are required');
            continue;
          }
          if (await Coupon.findOne({ code })) {
            rowResult(errors, rowNum, `Coupon code ${code} already exists`);
            continue;
          }
          await Coupon.create({
            code,
            title: r.title || code,
            description: r.description || '',
            discountType: String(r.discountType || 'PERCENT').toUpperCase() === 'FLAT' ? 'FLAT' : 'PERCENT',
            discountValue: Number(r.discountValue),
            minOrderAmount: Number(r.minOrderAmount) || 0,
            maxDiscount: r.maxDiscount ? Number(r.maxDiscount) : undefined,
            validFrom: r.validFrom ? new Date(r.validFrom) : undefined,
            validUntil: r.validUntil ? new Date(r.validUntil) : undefined,
            usageLimit: r.usageLimit ? Number(r.usageLimit) : undefined,
            isActive: parseBool(r.isActive),
          });
          created += 1;
        } catch (e) {
          rowResult(errors, rowNum, e.message);
        }
      }
      break;

    default:
      throw new Error('Unknown upload type');
  }

  return {
    created,
    failed: errors.length,
    total: rows.length,
    errors: errors.slice(0, 50),
  };
}

export function listUploadTypes() {
  return Object.entries(UPLOAD_TYPES).map(([id, config]) => ({
    id,
    label: config.label,
    description: config.description,
    columns: config.headers.length,
    fields: config.headers,
  }));
}
