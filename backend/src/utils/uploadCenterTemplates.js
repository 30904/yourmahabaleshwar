import XLSX from 'xlsx';

export const UPLOAD_TYPES = {
  properties: {
    label: 'Hotels & Resorts',
    description: 'Bulk import hotels and resorts with optional first room type.',
    sheetName: 'Properties',
    headers: [
      'name',
      'type',
      'description',
      'shortDescription',
      'addressLine1',
      'city',
      'state',
      'pincode',
      'lat',
      'lng',
      'amenities',
      'rating',
      'checkInTime',
      'checkOutTime',
      'policies',
      'isActive',
      'isFeatured',
      'imageUrls',
      'roomName',
      'roomType',
      'roomPrice',
      'roomCapacity',
      'roomTotal',
    ],
    sample: [
      'Valley View Resort',
      'RESORT',
      'Scenic resort with valley views',
      'Premium stay in Mahabaleshwar',
      'Main Road, Near Lake',
      'Mahabaleshwar',
      'Maharashtra',
      '412806',
      '17.9307',
      '73.6477',
      'WiFi,Parking,Restaurant,AC',
      '4.5',
      '14:00',
      '11:00',
      'Free cancellation 48h before check-in',
      'TRUE',
      'FALSE',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'Deluxe Room',
      'DELUXE',
      '4500',
      '2',
      '5',
    ],
  },
  rooms: {
    label: 'Hotel Rooms',
    description: 'Add room types to existing properties (match by property name).',
    sheetName: 'Rooms',
    headers: ['propertyName', 'roomName', 'roomType', 'basePrice', 'capacity', 'totalRooms', 'description'],
    sample: ['Valley View Resort', 'Standard Room', 'STANDARD', '2500', '2', '8', 'Queen bed, garden view'],
  },
  tents: {
    label: 'Tent Camps',
    description: 'Import glamping / tent camp listings.',
    sheetName: 'Tents',
    headers: [
      'name',
      'description',
      'location',
      'capacity',
      'totalTents',
      'pricePerNight',
      'amenities',
      'rating',
      'isActive',
      'isFeatured',
      'imageUrls',
    ],
    sample: [
      'Forest Glamp Mahabaleshwar',
      'Luxury tents in pine forest',
      'Mahabaleshwar',
      '2',
      '12',
      '3500',
      'WiFi,Parking,Bonfire',
      '4.3',
      'TRUE',
      'FALSE',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    ],
  },
  guides: {
    label: 'Tour Guides',
    description: 'Import local guides with package pricing.',
    sheetName: 'Guides',
    headers: [
      'name',
      'bio',
      'languages',
      'specialties',
      'experience',
      'package6hr',
      'package12hr',
      'bikeAddonPrice',
      'rating',
      'isActive',
      'isFeatured',
      'photoUrl',
    ],
    sample: [
      'Rahul Patil',
      'Certified local guide for 8+ years',
      'Hindi,English,Marathi',
      'Nature,Trekking,History',
      '8',
      '1500',
      '2500',
      '500',
      '4.7',
      'TRUE',
      'TRUE',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    ],
  },
  drivers: {
    label: 'Taxi & Drivers',
    description: 'Import drivers and vehicle rates.',
    sheetName: 'Drivers',
    headers: [
      'name',
      'phone',
      'vehicleType',
      'vehicleNumber',
      'perTripPrice',
      'hourlyRate',
      'rating',
      'isActive',
      'isAvailable',
      'photoUrl',
    ],
    sample: ['Suresh Jadhav', '9876543210', 'SUV', 'MH12AB1234', '1200', '350', '4.5', 'TRUE', 'TRUE', ''],
  },
  customers: {
    label: 'Customers',
    description: 'Bulk create customer accounts (default password in notes).',
    sheetName: 'Customers',
    headers: ['name', 'email', 'phone', 'password', 'city', 'state', 'pincode', 'isActive'],
    sample: ['Demo Customer', 'customer.demo@example.com', '9876500001', 'Customer@123', 'Mahabaleshwar', 'Maharashtra', '412806', 'TRUE'],
  },
  vendors: {
    label: 'Vendors',
    description: 'Create vendor login accounts for partners.',
    sheetName: 'Vendors',
    headers: ['name', 'email', 'phone', 'password', 'role', 'isActive'],
    sample: ['Hotel Partner', 'vendor.demo@example.com', '9876500002', 'Vendor@123', 'HOTEL_VENDOR', 'TRUE'],
  },
  banners: {
    label: 'Homepage Banners',
    description: 'Import promotional banners for the homepage.',
    sheetName: 'Banners',
    headers: ['title', 'subtitle', 'imageUrl', 'link', 'vertical', 'order', 'isActive'],
    sample: ['Discover Mahabaleshwar', 'Hotels, Tents & More', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', '/', 'ALL', '1', 'TRUE'],
  },
  blogs: {
    label: 'Blog Posts',
    description: 'Import blog articles (published if isPublished is TRUE).',
    sheetName: 'Blogs',
    headers: ['title', 'excerpt', 'content', 'coverImageUrl', 'tags', 'isPublished'],
    sample: [
      'Best time to visit Mahabaleshwar',
      'Plan your monsoon escape',
      'Full article content here...',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
      'travel,monsoon',
      'TRUE',
    ],
  },
  faqs: {
    label: 'FAQs',
    description: 'Import frequently asked questions.',
    sheetName: 'FAQs',
    headers: ['question', 'answer', 'category', 'order', 'isActive'],
    sample: ['How do I cancel a booking?', 'You can cancel from My Bookings up to 48 hours before check-in.', 'BOOKING', '1', 'TRUE'],
  },
  coupons: {
    label: 'Coupons & Offers',
    description: 'Import discount coupons and promo codes.',
    sheetName: 'Coupons',
    headers: [
      'code',
      'title',
      'description',
      'discountType',
      'discountValue',
      'minOrderAmount',
      'maxDiscount',
      'validFrom',
      'validUntil',
      'usageLimit',
      'isActive',
    ],
    sample: [
      'MONSOON30',
      'Monsoon Special',
      '30% off on stays',
      'PERCENT',
      '30',
      '2000',
      '1500',
      '2026-06-01',
      '2026-09-30',
      '100',
      'TRUE',
    ],
  },
};

export function buildTemplateBuffer(type) {
  const config = UPLOAD_TYPES[type];
  if (!config) throw new Error('Unknown upload type');

  const ws = XLSX.utils.aoa_to_sheet([config.headers, config.sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function parseExcelBuffer(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
  return rows.filter((row) => Object.values(row).some((v) => String(v).trim() !== ''));
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function parseBool(val, defaultVal = true) {
  if (val === '' || val === undefined || val === null) return defaultVal;
  const s = String(val).trim().toLowerCase();
  return ['true', '1', 'yes', 'y'].includes(s);
}

export function parseList(val) {
  if (!val) return [];
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
