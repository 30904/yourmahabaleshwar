import Product from '../models/Product.js';
import ComboOffer from '../models/ComboOffer.js';
import Booking from '../models/Booking.js';
import { BOOKING_TYPES } from '../constants/booking.js';
import { ROLES } from '../constants/roles.js';
import { success, error } from '../utils/apiResponse.js';
import { calculateTotalAsync } from '../utils/pricing.js';
import { mapProductMine } from '../utils/vendorMineListings.js';
import { denyIfNotOwner, stampOwnerOnCreate, stripOwnerOnUpdate } from '../utils/vendorListingAccess.js';

const slugify = (s) =>
  `${String(s || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

// ─── Products (Strawberry / Mapro) ───────────────────────────
export const listMyProducts = async (req, res) => {
  const filter = req.user.role === ROLES.SUPER_ADMIN ? {} : { vendor: req.user._id };
  if (req.query.vertical) filter.vertical = String(req.query.vertical).toUpperCase();
  const docs = await Product.find(filter).sort('-createdAt').limit(200);
  return success(res, docs.map(mapProductMine));
};

export const listProducts = async (req, res) => {
  const filter = { isActive: { $ne: false } };
  if (req.query.vertical) filter.vertical = String(req.query.vertical).toUpperCase();
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  const items = await Product.find(filter).sort('-isFeatured -createdAt').limit(Number(req.query.limit) || 100);
  return success(res, items);
};

export const getProductBySlug = async (req, res) => {
  const item = await Product.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!item) return error(res, 'Product not found', 404);
  return success(res, item);
};

export const createProduct = async (req, res) => {
  try {
    const data = stampOwnerOnCreate(req, { ...req.body }, 'vendor');
    if (!data.slug && data.name) data.slug = slugify(`${data.vertical || 'product'}-${data.name}`);
    if (!data.vertical) return error(res, 'vertical required (STRAWBERRY|MAPRO)', 400);
    const doc = await Product.create(data);
    return success(res, doc, 'Product created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const updateProduct = async (req, res) => {
  const doc = await Product.findById(req.params.id);
  if (!doc) return error(res, 'Not found', 404);
  const denied = denyIfNotOwner(req, doc, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  Object.assign(doc, stripOwnerOnUpdate(req, req.body, 'vendor'));
  await doc.save();
  return success(res, doc);
};

export const deleteProduct = async (req, res) => {
  const doc = await Product.findById(req.params.id);
  if (!doc) return error(res, 'Not found', 404);
  const denied = denyIfNotOwner(req, doc, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  doc.isActive = false;
  await doc.save();
  return success(res, doc, 'Deactivated');
};

export const listAdminProducts = async (req, res) => {
  const filter = {};
  if (req.query.vertical) filter.vertical = String(req.query.vertical).toUpperCase();
  return success(res, await Product.find(filter).sort('-createdAt').limit(200));
};

// ─── Combo offers ────────────────────────────────────────────
export const listCombos = async (req, res) => {
  const filter = { isActive: { $ne: false } };
  if (req.query.featured === 'true') filter.isFeatured = true;
  const now = new Date();
  const items = await ComboOffer.find(filter).sort('-isFeatured -createdAt').limit(100);
  const live = items.filter((c) => {
    if (c.validFrom && c.validFrom > now) return false;
    if (c.validTo && c.validTo < now) return false;
    if (c.maxRedemptions != null && c.redemptionCount >= c.maxRedemptions) return false;
    return true;
  });
  return success(res, live);
};

export const getComboBySlug = async (req, res) => {
  const item = await ComboOffer.findOne({ slug: req.params.slug, isActive: { $ne: false } });
  if (!item) return error(res, 'Combo not found', 404);
  return success(res, item);
};

export const createCombo = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.name) data.slug = slugify(data.name);
    const doc = await ComboOffer.create(data);
    return success(res, doc, 'Combo created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const updateCombo = async (req, res) => {
  const doc = await ComboOffer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return error(res, 'Not found', 404);
  return success(res, doc);
};

export const deleteCombo = async (req, res) => {
  await ComboOffer.findByIdAndUpdate(req.params.id, { isActive: false });
  return success(res, null, 'Deactivated');
};

export const listAdminCombos = async (req, res) =>
  success(res, await ComboOffer.find().sort('-createdAt').limit(200));

// ─── Orders / bookings ───────────────────────────────────────
export const createProductOrder = async (req, res) => {
  try {
    const { productId, quantity = 1, deliveryAddress, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return error(res, 'Product not found', 404);
    const qty = Math.max(1, Number(quantity) || 1);
    if (product.stock < qty) return error(res, 'Insufficient stock', 400);

    const subtotal = product.price * qty;
    const pricing = await calculateTotalAsync(subtotal);
    const booking = await Booking.create({
      customer: req.user._id,
      vendor: product.vendor,
      type: BOOKING_TYPES.PRODUCT,
      product: product._id,
      productQty: qty,
      productVertical: product.vertical,
      deliveryAddress,
      notes,
      checkIn: new Date(),
      ...pricing,
      commission: Math.round(pricing.subtotal * ((product.commissionRate || 10) / 100)),
    });

    product.stock = Math.max(0, product.stock - qty);
    await product.save();

    return success(res, booking, 'Product order created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const createComboBooking = async (req, res) => {
  try {
    const { comboId, checkIn, guests, notes } = req.body;
    const combo = await ComboOffer.findById(comboId);
    if (!combo || !combo.isActive) return error(res, 'Combo not found', 404);

    const now = new Date();
    if (combo.validFrom && combo.validFrom > now) return error(res, 'Combo not yet available', 400);
    if (combo.validTo && combo.validTo < now) return error(res, 'Combo expired', 400);
    if (combo.maxRedemptions != null && combo.redemptionCount >= combo.maxRedemptions) {
      return error(res, 'Combo sold out', 400);
    }

    const pricing = await calculateTotalAsync(combo.comboPrice);
    const booking = await Booking.create({
      customer: req.user._id,
      vendor: combo.vendor,
      type: BOOKING_TYPES.COMBO,
      combo: combo._id,
      comboSnapshot: {
        name: combo.name,
        items: combo.items,
        originalPrice: combo.originalPrice,
        comboPrice: combo.comboPrice,
      },
      checkIn: checkIn || new Date(),
      guests: guests || { adults: 2, children: 0 },
      notes,
      ...pricing,
      commission: Math.round(pricing.subtotal * ((combo.commissionRate || 10) / 100)),
    });

    combo.redemptionCount += 1;
    await combo.save();

    return success(res, booking, 'Combo booking created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const seedPhase4Defaults = async (req, res) => {
  const vendorId = req.user._id;
  const strawberry = [
    {
      name: 'Fresh Mahabaleshwar Strawberries 1kg',
      vertical: 'STRAWBERRY',
      price: 350,
      compareAtPrice: 420,
      unit: 'kg',
      stock: 80,
      shortDescription: 'Farm-fresh strawberries from local orchards',
      images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80'],
      isFeatured: true,
      vendor: vendorId,
    },
    {
      name: 'Strawberry Crush 500ml',
      vertical: 'STRAWBERRY',
      price: 220,
      unit: 'bottle',
      stock: 60,
      shortDescription: 'Homemade crush — perfect for shakes',
      images: ['https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=800&q=80'],
      vendor: vendorId,
    },
  ];
  const mapro = [
    {
      name: 'Mapro Strawberry Jam 500g',
      vertical: 'MAPRO',
      price: 280,
      unit: 'jar',
      stock: 100,
      shortDescription: 'Classic Mapro-style strawberry jam',
      images: ['https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80'],
      isFeatured: true,
      tags: ['mapro', 'jam'],
      vendor: vendorId,
    },
    {
      name: 'Mapro Fruit Syrup Assortment',
      vertical: 'MAPRO',
      price: 450,
      unit: 'pack',
      stock: 40,
      shortDescription: 'Assorted fruit syrups gift pack',
      images: ['https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80'],
      tags: ['mapro', 'gift'],
      vendor: vendorId,
    },
  ];

  const savedProducts = [];
  for (const p of [...strawberry, ...mapro]) {
    savedProducts.push(
      await Product.findOneAndUpdate(
        { name: p.name, vertical: p.vertical },
        { ...p, slug: slugify(`${p.vertical}-${p.name}`) },
        { upsert: true, new: true }
      )
    );
  }

  const combo = await ComboOffer.findOneAndUpdate(
    { name: 'Weekend Stay + Strawberries Combo' },
    {
      name: 'Weekend Stay + Strawberries Combo',
      slug: slugify('weekend-stay-strawberries'),
      description: '1 night stay vibe + 1kg fresh strawberries + Mapro jam tasting pack savings.',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'],
      items: [
        { itemType: 'HOTEL', itemId: vendorId, label: '1 Night Stay voucher', nights: 1 },
        {
          itemType: 'PRODUCT',
          itemId: savedProducts[0]._id,
          label: 'Fresh Strawberries 1kg',
          quantity: 1,
        },
        {
          itemType: 'PRODUCT',
          itemId: savedProducts[2]._id,
          label: 'Mapro Jam',
          quantity: 1,
        },
      ],
      originalPrice: 4500,
      comboPrice: 3499,
      isFeatured: true,
      isActive: true,
      vendor: vendorId,
      maxRedemptions: 50,
    },
    { upsert: true, new: true }
  );

  return success(res, { products: savedProducts, combo }, 'Phase 4 defaults seeded');
};
