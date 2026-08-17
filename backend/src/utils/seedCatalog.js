import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Amenity from '../models/Amenity.js';
import RoomType from '../models/RoomType.js';
import { SEED_AMENITIES, SEED_ROOM_TYPES } from '../data/catalogSeedData.js';

dotenv.config();

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const seedCatalog = async () => {
  await connectDB();
  console.log('Seeding amenities and room types...');

  await Amenity.deleteMany({});
  await RoomType.deleteMany({});

  const amenities = await Amenity.insertMany(
    SEED_AMENITIES.map((a) => ({
      ...a,
      slug: slugify(a.name),
      isActive: true,
    }))
  );

  const roomTypes = await RoomType.insertMany(
    SEED_ROOM_TYPES.map((r) => ({
      ...r,
      isActive: true,
    }))
  );

  console.log(`✓ ${amenities.length} amenities seeded`);
  console.log(`✓ ${roomTypes.length} room types seeded`);
  process.exit(0);
};

seedCatalog().catch((err) => {
  console.error(err);
  process.exit(1);
});
