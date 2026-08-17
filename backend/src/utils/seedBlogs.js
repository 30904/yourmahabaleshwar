import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { SEED_BLOGS } from '../data/blogSeedData.js';

dotenv.config();

const seedBlogs = async () => {
  await connectDB();
  console.log('Seeding blog posts...');

  let admin = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (!admin) {
    admin = await User.create({
      name: 'Super Admin',
      email: 'admin@yourmahabaleshwar.com',
      phone: '9876543210',
      password: 'Admin@123',
      role: ROLES.SUPER_ADMIN,
    });
  }

  await Blog.deleteMany({});

  const blogs = await Blog.insertMany(
    SEED_BLOGS.map((b) => ({
      ...b,
      author: admin._id,
      isPublished: true,
      publishedAt: new Date(),
    }))
  );

  console.log(`✓ ${blogs.length} blog posts seeded`);
  blogs.forEach((b) => console.log(`  - ${b.title}`));
  process.exit(0);
};

seedBlogs().catch((err) => {
  console.error(err);
  process.exit(1);
});
