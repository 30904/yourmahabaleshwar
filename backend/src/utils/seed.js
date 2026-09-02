import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import Product from '../models/Product.js';
import ComboOffer from '../models/ComboOffer.js';
import Booking from '../models/Booking.js';
import Enquiry from '../models/Enquiry.js';
import KYC from '../models/KYC.js';
import Banner from '../models/Banner.js';
import FAQ from '../models/FAQ.js';
import Blog from '../models/Blog.js';
import Coupon from '../models/Coupon.js';
import PlatformSettings from '../models/PlatformSettings.js';
import Amenity from '../models/Amenity.js';
import RoomType from '../models/RoomType.js';
import { SEED_AMENITIES, SEED_ROOM_TYPES } from '../data/catalogSeedData.js';
import { SEED_BLOGS } from '../data/blogSeedData.js';
import { ROLES } from '../constants/roles.js';
import { BOOKING_STATUS, BOOKING_TYPES } from '../constants/booking.js';
import { startSubscriptionOnApproval } from '../services/stayListingSubscriptionService.js';

dotenv.config();

const SYSTEM_DBS = new Set(['admin', 'local', 'config']);

const slugify = (s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/** Atlas M0 allows 500 collections per cluster. deleteMany keeps collections, so new models fail. */
const resetSeedDatabase = async () => {
  const client = mongoose.connection.getClient();
  const db = mongoose.connection.db;
  const dbName = db.databaseName;

  const existing = await db.listCollections().toArray();
  if (existing.length) {
    await db.dropDatabase();
    console.log(`Dropped database "${dbName}" (${existing.length} collections)`);
  }

  let freed = 0;
  try {
    const { databases } = await db.admin().listDatabases();
    for (const { name } of databases) {
      if (SYSTEM_DBS.has(name) || name === dbName) continue;
      const other = client.db(name);
      const cols = await other.listCollections().toArray();
      for (const col of cols) {
        if (col.name.startsWith('system.')) continue;
        const count = await other.collection(col.name).estimatedDocumentCount();
        if (count === 0) {
          await other.collection(col.name).drop();
          freed += 1;
        }
      }
    }
  } catch (err) {
    console.warn(`Could not free empty collections on other databases: ${err.message}`);
  }

  if (freed) {
    console.log(`Freed ${freed} empty collection(s) from other databases (Atlas 500-collection limit)`);
  }
};

const seedCatalogMaster = async () => {
  await Amenity.deleteMany({});
  await RoomType.deleteMany({});
  await Amenity.insertMany(
    SEED_AMENITIES.map((a) => ({ ...a, slug: slugify(a.name), isActive: true }))
  );
  await RoomType.insertMany(SEED_ROOM_TYPES.map((r) => ({ ...r, isActive: true })));
};
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

const seed = async () => {
  await connectDB();
  console.log('Clearing existing data...');
  await resetSeedDatabase();

  await seedCatalogMaster();

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@yourmahabaleshwar.com',
    phone: '9876543210',
    password: 'Admin@123',
    role: ROLES.SUPER_ADMIN,
  });

  const hotelVendor = await User.create({
    name: 'Hotel Vendor Demo',
    email: 'hotel.vendor@demo.com',
    phone: '9876543211',
    password: 'Vendor@123',
    role: ROLES.HOTEL_VENDOR,
  });

  const tentOp = await User.create({
    name: 'Tent Operator Demo',
    email: 'tent@demo.com',
    phone: '9876543212',
    password: 'Vendor@123',
    role: ROLES.TENT_OPERATOR,
  });

  const guideUser = await User.create({
    name: 'Guide Demo',
    email: 'guide@demo.com',
    phone: '9876543213',
    password: 'Vendor@123',
    role: ROLES.GUIDE,
  });

  const taxiUser = await User.create({
    name: 'Taxi Operator Demo',
    email: 'taxi@demo.com',
    phone: '9876543213',
    password: 'Vendor@123',
    role: ROLES.TAXI_OPERATOR,
  });

  const driverUser = await User.create({
    name: 'Driver Partner Demo',
    email: 'driver@demo.com',
    phone: '9876543214',
    password: 'Vendor@123',
    role: ROLES.DRIVER,
  });

  const homestayVendor = await User.create({
    name: 'Homestay Vendor Demo',
    email: 'homestay@demo.com',
    phone: '9876543215',
    password: 'Vendor@123',
    role: ROLES.HOMESTAY_VENDOR,
  });

  const horseOp = await User.create({
    name: 'Horse Operator Demo',
    email: 'horse@demo.com',
    phone: '9876543216',
    password: 'Vendor@123',
    role: ROLES.HORSE_OPERATOR,
  });

  const productVendor = await User.create({
    name: 'Product Vendor Demo',
    email: 'products@demo.com',
    phone: '9876543217',
    password: 'Vendor@123',
    role: ROLES.PRODUCT_VENDOR,
  });

  const customers = [];
  for (let i = 1; i <= 5; i++) {
    customers.push(
      await User.create({
        name: `Customer ${i}`,
        email: `customer${i}@demo.com`,
        phone: `98765432${10 + i}`,
        password: 'Customer@123',
        role: ROLES.CUSTOMER,
      })
    );
  }

  const hotelNames = [
    'Valley View Resort', 'Mist Hills Hotel', 'Strawberry Inn', 'Panchgani Heights',
    'Lake View Mahabaleshwar', 'Cloud 9 Stay', 'Green Valley Lodge', 'Sunset Point Hotel',
    'Mapro Garden Stay', 'Arthur Seat View Hotel',
  ];
  const resortNames = [
    'Serene Woods Resort', 'Hilltop Paradise', 'Monsoon Mist Resort', 'Venna Lake Resort', 'Eco Nest Resort',
  ];

  const hotels = [];
  for (const name of hotelNames) {
    const hotel = await Hotel.create({
      name,
      slug: slugify(name),
      type: 'HOTEL',
      description: `Premium stay at ${name} with valley views and modern amenities.`,
      address: { line1: 'Main Road', city: 'Mahabaleshwar', state: 'Maharashtra', pincode: '412806' },
      images: [IMG('1566073771259-6a8506099945'), IMG('1582719478250-c89cae4dc85b')],
      amenities: ['Free WiFi', 'Free parking', 'Restaurant', 'Room Service'],
      rating: 4 + Math.random() * 0.8,
      reviewCount: Math.floor(Math.random() * 500) + 50,
      vendor: hotelVendor._id,
      isFeatured: Math.random() > 0.5,
    });
    hotels.push(hotel);
    await Room.create([
      { hotel: hotel._id, name: 'Standard Room', basePrice: 2500 + Math.floor(Math.random() * 500), capacity: 2 },
      { hotel: hotel._id, name: 'Deluxe Room', basePrice: 4500 + Math.floor(Math.random() * 800), capacity: 3 },
    ]);
  }

  for (const name of resortNames) {
    const hotel = await Hotel.create({
      name,
      slug: slugify(name),
      type: 'RESORT',
      description: `Luxury resort experience at ${name}.`,
      address: { city: 'Mahabaleshwar', state: 'Maharashtra' },
      images: [IMG('1582719478250-c89cae4dc85b')],
      amenities: ['Pool', 'Spa', 'WiFi', 'Breakfast'],
      rating: 4.3 + Math.random() * 0.5,
      reviewCount: Math.floor(Math.random() * 300) + 80,
      vendor: hotelVendor._id,
      isFeatured: true,
    });
    hotels.push(hotel);
    await Room.create([
      { hotel: hotel._id, name: 'Garden Villa', basePrice: 5500, capacity: 2 },
      { hotel: hotel._id, name: 'Premium Suite', basePrice: 8500, capacity: 4 },
    ]);
  }

  const tents = [];
  const tentNames = ['Camp Cloud', 'Starlight Tents', 'Forest Glamp', 'Hill Camp', 'Venna Riverside Camp'];
  for (const name of tentNames) {
    tents.push(
      await Tent.create({
        name,
        slug: slugify(name),
        description: `Unique camping at ${name}.`,
        pricePerNight: 1500 + Math.floor(Math.random() * 2000),
        capacity: 2 + Math.floor(Math.random() * 3),
        totalTents: 10,
        images: [IMG('1504280390367-361c6d9f38f4')],
        amenities: ['Bonfire', 'Breakfast', 'Stargazing'],
        rating: 4.2 + Math.random() * 0.6,
        reviewCount: Math.floor(Math.random() * 150) + 20,
        operator: tentOp._id,
        isFeatured: Math.random() > 0.5,
      })
    );
  }

  const guides = [];
  const guideNames = [
    'Rajesh Patil', 'Suresh Kulkarni', 'Amit Desai', 'Vikram Jadhav', 'Prakash More',
    'Sanjay Pawar', 'Nilesh Gaikwad', 'Ramesh Shinde', 'Ganesh Bhosale', 'Mahesh Naik',
  ];
  for (const name of guideNames) {
    guides.push(
      await Guide.create({
        name,
        slug: slugify(name),
        bio: `Experienced local guide ${name} with 5+ years in Mahabaleshwar tourism.`,
        languages: ['Hindi', 'Marathi', 'English'],
        specialties: ['Sightseeing', 'Trekking', 'Photography'],
        package6hr: 1500 + Math.floor(Math.random() * 500),
        package12hr: 2800 + Math.floor(Math.random() * 700),
        bikeAddonPrice: 500,
        rating: 4.4 + Math.random() * 0.5,
        reviewCount: Math.floor(Math.random() * 120) + 15,
        user: guideUser._id,
        isFeatured: Math.random() > 0.6,
      })
    );
  }

  const drivers = [];
  const vehicles = ['SEDAN', 'SUV', 'INNOVA', 'TEMPO'];
  drivers.push(
    await Driver.create({
      name: 'Rajesh Mahabaleshwar Cabs',
      operatorName: 'Rajesh Patil',
      slug: 'rajesh-mahabaleshwar-cabs',
      gender: 'MALE',
      fatherOrHusbandName: 'Suresh Patil',
      serviceArea: 'Mahabaleshwar, Panchgani, Pune transfers',
      vehicleType: 'INNOVA',
      vehicleNumber: 'MH-12-AB-4521',
      vehicle: { licenseNumber: 'MH1420100123456', licenseType: 'COMMERCIAL' },
      contact: {
        primaryMobile: taxiUser.phone,
        email: taxiUser.email,
        whatsapp: taxiUser.phone,
        emergencyName: 'Suresh Patil',
        emergencyMobile: '9876501234',
      },
      phone: taxiUser.phone,
      address: { line1: 'Main Market Road, Mahabaleshwar', pincode: '412806' },
      perTripPrice: 1800,
      hourlyRate: 450,
      experience: 8,
      bankDetails: {
        bankName: 'State Bank of India',
        branch: 'Mahabaleshwar',
        accountHolder: 'Rajesh Patil',
        accountNumber: '123456789012',
        ifsc: 'SBIN0001234',
      },
      images: [IMG('1449965400600-e5666c5e72f0')],
      rating: 4.8,
      reviewCount: 86,
      user: taxiUser._id,
      isActive: true,
      approvalStatus: 'APPROVED',
      isFeatured: true,
      acceptedTermsAt: new Date(),
      acceptedAgreementAt: new Date(),
      declarationAcceptedAt: new Date(),
    })
  );
  drivers.push(
    await Driver.create({
      name: 'Pending Taxi Listing',
      slug: 'pending-taxi-listing',
      vehicleType: 'SEDAN',
      perTripPrice: 1200,
      hourlyRate: 350,
      serviceArea: 'Mahabaleshwar',
      user: taxiUser._id,
      isActive: false,
      approvalStatus: 'PENDING',
    })
  );
  for (let i = 1; i <= 3; i++) {
    drivers.push(
      await Driver.create({
        name: `Fleet Vehicle ${i}`,
        slug: `fleet-vehicle-${i}`,
        vehicleType: vehicles[i % vehicles.length],
        perTripPrice: 900 + i * 100,
        hourlyRate: 320 + i * 20,
        serviceArea: 'Mahabaleshwar, Panchgani',
        rating: 4.4 + Math.random() * 0.4,
        reviewCount: Math.floor(Math.random() * 60) + 10,
        user: taxiUser._id,
        isActive: true,
        approvalStatus: 'APPROVED',
        isAvailable: true,
      })
    );
  }
  drivers.push(
    await Driver.create({
      name: 'Amit Patil — Driver Partner',
      slug: 'amit-patil-driver-partner',
      gender: 'MALE',
      fatherOrHusbandName: 'Ramesh Patil',
      serviceArea: 'Mahabaleshwar local sightseeing',
      vehicleType: 'SEDAN',
      vehicleNumber: 'MH-12-CD-7788',
      vehicle: { licenseNumber: 'MH1420100987654', licenseType: 'LMV' },
      contact: {
        primaryMobile: driverUser.phone,
        email: driverUser.email,
        whatsapp: driverUser.phone,
        emergencyName: 'Ramesh Patil',
        emergencyMobile: '9876504321',
      },
      phone: driverUser.phone,
      address: { line1: 'Venna Lake Road, Mahabaleshwar', pincode: '412806' },
      perTripPrice: 1200,
      hourlyRate: 350,
      experience: 5,
      bankDetails: {
        bankName: 'HDFC Bank',
        branch: 'Mahabaleshwar',
        accountHolder: 'Amit Patil',
        accountNumber: '987654321098',
        ifsc: 'HDFC0001234',
      },
      images: [IMG('1549317661-32a88f6a4d54')],
      rating: 4.7,
      reviewCount: 42,
      user: driverUser._id,
      isActive: true,
      approvalStatus: 'APPROVED',
      isFeatured: true,
      acceptedTermsAt: new Date(),
      acceptedAgreementAt: new Date(),
      declarationAcceptedAt: new Date(),
    })
  );
  drivers.push(
    await Driver.create({
      name: 'Pending Driver Listing',
      slug: 'pending-driver-listing',
      vehicleType: 'SUV',
      perTripPrice: 1400,
      hourlyRate: 380,
      serviceArea: 'Mahabaleshwar',
      user: driverUser._id,
      isActive: false,
      approvalStatus: 'PENDING',
    })
  );
  for (let i = 1; i <= 4; i++) {
    drivers.push(
      await Driver.create({
        name: `Driver Partner ${i}`,
        slug: `driver-partner-${i}`,
        vehicleType: vehicles[i % vehicles.length],
        perTripPrice: 800 + i * 100,
        hourlyRate: 300 + i * 20,
        serviceArea: 'Mahabaleshwar',
        rating: 4.3 + Math.random() * 0.5,
        reviewCount: Math.floor(Math.random() * 80) + 10,
        user: driverUser._id,
        isActive: true,
        approvalStatus: 'APPROVED',
        isAvailable: true,
      })
    );
  }

  const homestayNames = [
    'Family Homestay Old Mahabaleshwar',
    'Strawberry Cottage Stay',
    'Hillside Homestay Panchgani',
    'Valley Nest Homestay',
    'Quiet Lane Homestay',
  ];
  for (const name of homestayNames) {
    await Homestay.create({
      name,
      slug: slugify(name),
      description: `${name} offers a warm local experience with homemade meals and scenic views.`,
      location: 'Mahabaleshwar',
      images: [IMG('1566073771259-6a8506099945'), IMG('1520256862855-3981d1b4c6a1')],
      amenities: ['WiFi', 'Parking', 'Home-cooked meals'],
      houseRules: ['No smoking indoors', 'Quiet hours after 10 PM'],
      rooms: [
        { name: 'Deluxe Room', capacity: 2, basePrice: 2200, totalRooms: 2, amenities: ['Fan', 'Attached bath'] },
        { name: 'Family Room', capacity: 4, basePrice: 3500, totalRooms: 1, amenities: ['Balcony'] },
      ],
      priceFrom: 2200,
      vendor: homestayVendor._id,
      rating: 4.4,
      reviewCount: 12,
      isFeatured: true,
    });
  }

  const horseListings = [
    { name: 'Venna Lake Horse Rides', routes: [{ name: 'Lakeside Loop', durationMinutes: 30, price: 400 }, { name: 'Forest Trail', durationMinutes: 60, price: 700 }] },
    { name: 'Wilson Point Horse Trail', routes: [{ name: 'Sunrise Ride', durationMinutes: 45, price: 550 }, { name: 'Full Valley', durationMinutes: 90, price: 900 }] },
  ];
  for (const h of horseListings) {
    await Horse.create({
      name: h.name,
      slug: slugify(h.name),
      description: `${h.name} — guided horse rides for families and couples.`,
      horseDetails: 'Well-trained horses with safety gear provided.',
      routes: h.routes,
      priceFrom: Math.min(...h.routes.map((r) => r.price)),
      images: [IMG('1553284965-83fd3e82fa5a')],
      operator: horseOp._id,
      rating: 4.6,
      reviewCount: 28,
      isFeatured: true,
    });
  }

  const firstHotel = hotels[0];
  const firstRoom = await Room.findOne({ hotel: firstHotel._id });
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);

  const bookingSeed = [
    {
      bookingNumber: 'YMBSEED001',
      customer: customers[0]._id,
      vendor: hotelVendor._id,
      type: BOOKING_TYPES.HOTEL,
      status: BOOKING_STATUS.CONFIRMED,
      hotel: firstHotel._id,
      room: firstRoom._id,
      checkIn,
      checkOut,
      guests: { adults: 2, children: 0 },
      subtotal: 9000,
      gst: 1080,
      total: 10080,
      commission: 900,
      paymentStatus: 'PAID',
    },
    {
      bookingNumber: 'YMBSEED002',
      customer: customers[0]._id,
      vendor: guideUser._id,
      type: BOOKING_TYPES.GUIDE,
      status: BOOKING_STATUS.PENDING,
      guide: guides[0]._id,
      guidePackage: '6HR',
      checkIn: new Date(),
      subtotal: guides[0].package6hr,
      gst: Math.round(guides[0].package6hr * 0.12),
      total: Math.round(guides[0].package6hr * 1.12),
      commission: 150,
      paymentStatus: 'PENDING',
    },
    {
      bookingNumber: 'YMBSEED003',
      customer: customers[1]._id,
      vendor: tentOp._id,
      type: BOOKING_TYPES.TENT,
      status: BOOKING_STATUS.CONFIRMED,
      tent: tents[0]._id,
      checkIn,
      checkOut,
      tentQuantity: 1,
      subtotal: tents[0].pricePerNight * 2,
      gst: Math.round(tents[0].pricePerNight * 2 * 0.12),
      total: Math.round(tents[0].pricePerNight * 2 * 1.12),
      commission: 200,
      paymentStatus: 'PAID',
    },
    {
      bookingNumber: 'YMBSEED004',
      customer: customers[2]._id,
      vendor: taxiUser._id,
      type: BOOKING_TYPES.TAXI,
      status: BOOKING_STATUS.COMPLETED,
      driver: drivers[0]._id,
      taxiType: 'PER_TRIP',
      checkIn: new Date(),
      subtotal: drivers[0].perTripPrice,
      gst: Math.round(drivers[0].perTripPrice * 0.12),
      total: Math.round(drivers[0].perTripPrice * 1.12),
      commission: 80,
      paymentStatus: 'PAID',
    },
  ];
  for (const b of bookingSeed) {
    await Booking.create(b);
  }

  await Enquiry.create([
    {
      type: 'GENERAL',
      name: 'Rahul Sharma',
      phone: '9988776655',
      email: 'rahul@example.com',
      message: 'Looking for group booking for 20 people',
      status: 'NEW',
    },
    {
      type: 'DRIVER',
      name: 'Priya Mehta',
      phone: '9876501234',
      email: 'priya@example.com',
      message: 'Need Innova for Pune to Mahabaleshwar',
      pickup: 'Pune',
      drop: 'Mahabaleshwar',
      status: 'NEW',
    },
  ]);

  await KYC.create({
    user: hotelVendor._id,
    aadhar: '123456789012',
    pan: 'ABCDE1234F',
    status: 'PENDING',
  });

  await KYC.create({
    user: taxiUser._id,
    vendorType: 'TAXI',
    aadhar: '876543210987',
    pan: 'TAXIO1234P',
    status: 'APPROVED',
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  await KYC.create({
    user: driverUser._id,
    vendorType: 'DRIVER',
    aadhar: '987654321098',
    pan: 'FGHIJ5678K',
    status: 'APPROVED',
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  const strawberryProducts = await Product.insertMany([
    {
      name: 'Fresh Mahabaleshwar Strawberries 1kg',
      slug: 'fresh-strawberries-1kg',
      vertical: 'STRAWBERRY',
      price: 350,
      compareAtPrice: 420,
      unit: 'kg',
      stock: 80,
      shortDescription: 'Farm-fresh strawberries from local orchards',
      description: 'Hand-picked same-day strawberries. Pickup or local delivery in Mahabaleshwar.',
      images: [IMG('1464965911861-746a04b4bca6')],
      isFeatured: true,
      vendor: productVendor._id,
    },
    {
      name: 'Strawberry Crush 500ml',
      slug: 'strawberry-crush-500ml',
      vertical: 'STRAWBERRY',
      price: 220,
      unit: 'bottle',
      stock: 60,
      shortDescription: 'Homemade crush — perfect for shakes',
      images: [IMG('1601004890684-d8cbf643f5f2')],
      vendor: productVendor._id,
    },
  ]);

  const maproProducts = await Product.insertMany([
    {
      name: 'Mapro Strawberry Jam 500g',
      slug: 'mapro-strawberry-jam-500g',
      vertical: 'MAPRO',
      price: 280,
      unit: 'jar',
      stock: 100,
      shortDescription: 'Classic Mapro-style strawberry jam',
      images: [IMG('1481391319762-47dff72954d9')],
      isFeatured: true,
      tags: ['mapro', 'jam'],
      vendor: productVendor._id,
    },
    {
      name: 'Mapro Fruit Syrup Assortment',
      slug: 'mapro-fruit-syrup-pack',
      vertical: 'MAPRO',
      price: 450,
      unit: 'pack',
      stock: 40,
      shortDescription: 'Assorted fruit syrups gift pack',
      images: [IMG('1622597467836-f3285f2131b8')],
      tags: ['mapro', 'gift'],
      vendor: productVendor._id,
    },
  ]);

  await ComboOffer.create({
    name: 'Weekend Stay + Strawberries Combo',
    slug: 'weekend-stay-strawberries',
    description: 'Save on a stay-and-taste bundle: stay voucher + 1kg strawberries + Mapro jam.',
    images: [IMG('1506905925346-21bda4d32df4')],
    items: [
      { itemType: 'HOTEL', itemId: hotels[0]._id, label: `${hotels[0].name} — 1 night`, nights: 1 },
      { itemType: 'PRODUCT', itemId: strawberryProducts[0]._id, label: 'Fresh Strawberries 1kg', quantity: 1 },
      { itemType: 'PRODUCT', itemId: maproProducts[0]._id, label: 'Mapro Jam 500g', quantity: 1 },
    ],
    originalPrice: 4500,
    comboPrice: 3499,
    isFeatured: true,
    isActive: true,
    vendor: productVendor._id,
    maxRedemptions: 50,
  });

  await Banner.create([
    { title: 'Discover Mahabaleshwar', subtitle: 'Hotels, Tents & More', image: IMG('1506905925346-21bda4d32df4'), order: 1, isActive: true },
    { title: 'Book Local Guides', subtitle: '6hr & 12hr packages', image: IMG('1469854523086-cc02fe5d8800'), order: 2, isActive: true },
    { title: 'Strawberries & Mapro', subtitle: 'Shop local flavours', image: IMG('1464965911861-746a04b4bca6'), link: '/strawberries', order: 3, isActive: true },
  ]);

  await FAQ.insertMany([
    { question: 'How do I cancel a booking?', answer: 'Go to My Bookings and select cancel. Refund policy applies per property.', category: 'BOOKING', order: 1 },
    { question: 'Is GST included?', answer: 'Yes, 12% GST is calculated at checkout.', category: 'PAYMENT', order: 2 },
    { question: 'Can I pay at the property?', answer: 'Many listings offer pay at property. Others require online payment to confirm.', category: 'PAYMENT', order: 3 },
    { question: 'How do reviews work?', answer: 'Only guests who completed a stay can leave verified reviews.', category: 'REVIEWS', order: 4 },
    { question: 'How do I list my hotel?', answer: 'Click List your property and complete KYC. Our team verifies before going live.', category: 'PARTNERS', order: 5 },
  ]);

  await Coupon.insertMany([
    { code: 'MONSOON30', title: 'Monsoon Escape', discountType: 'PERCENT', discountValue: 30, isActive: true },
    { code: 'WEEKEND500', title: 'Weekend Flat Off', discountType: 'FLAT', discountValue: 500, isActive: true },
  ]);

  await PlatformSettings.create({
    key: 'default',
    platformName: 'YOURMAHABALESHWAR.COM',
    commissionPercent: 10,
    gstPercent: 12,
    stayListingDefaultRenewalPrice: { type: Number, default: 5000 },
    staySubscriptionWarningDays: { type: Number, default: 30 },
    seoTitle: 'YOURMAHABALESHWAR.COM | Book Mahabaleshwar Stays & Experiences',
    seoDescription:
      'Book hotels, resorts, homestays/villas, tents, guides, taxi, horse rides, strawberries and Mapro products in Mahabaleshwar.',
    seoKeywords: ['Mahabaleshwar', 'hotels', 'homestay/villa', 'Mapro', 'strawberry', 'taxi', 'guides'],
    supportEmail: 'support@yourmahabaleshwar.com',
    supportPhone: '9876543210',
  });

  await Blog.insertMany(
    SEED_BLOGS.map((b) => ({
      ...b,
      author: admin._id,
      isPublished: true,
      publishedAt: new Date(),
    }))
  );

  for (const hotel of await Hotel.find({})) {
    await startSubscriptionOnApproval(hotel.type, hotel._id);
  }
  for (const homestay of await Homestay.find({})) {
    await startSubscriptionOnApproval('HOMESTAY', homestay._id);
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('--- Demo credentials ---');
  console.log('Admin:    admin@yourmahabaleshwar.com / Admin@123');
  console.log('Customer: customer1@demo.com / Customer@123');
  console.log('Hotel:    hotel.vendor@demo.com / Vendor@123');
  console.log('Tent:     tent@demo.com / Vendor@123');
  console.log('Guide:    guide@demo.com / Vendor@123');
  console.log('Taxi:     taxi@demo.com / Vendor@123');
  console.log('Driver:   driver@demo.com / Vendor@123');
  console.log('Homestay: homestay@demo.com / Vendor@123');
  console.log('Horse:    horse@demo.com / Vendor@123');
  console.log('Products: products@demo.com / Vendor@123');
  console.log(`\nSeeded: ${hotels.length} hotels/resorts, ${tents.length} tents, ${guides.length} guides, ${drivers.length} drivers, homestays & horses, strawberry/mapro products, combos, bookings`);
  process.exit(0);
};

seed().catch((e) => {
  if (e?.code === 8000 || e?.errorResponse?.code === 8000) {
    console.error('\nAtlas M0 allows 500 collections per cluster, and this cluster is full.');
    console.error('In MongoDB Atlas, delete unused databases/collections, or set MONGODB_URI to a dedicated cluster or local MongoDB.\n');
  }
  console.error(e);
  process.exit(1);
});
