import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|pdf/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype === 'application/pdf';
  if (ext || mime) cb(null, true);
  else cb(new Error('Only images and PDF files allowed'), false);
};

export const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSize || 10 * 1024 * 1024 },
  fileFilter,
});

export const uploadBannerImage = upload.single('image');
export const uploadBlogCover = upload.single('coverImage');

const excelFilter = (req, file, cb) => {
  const ext = /\.(xlsx|xls)$/i.test(file.originalname);
  const mime =
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/octet-stream';
  if (ext || mime) cb(null, true);
  else cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
};

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: excelFilter,
}).single('file');

export const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'aadharDoc', maxCount: 1 },
  { name: 'panDoc', maxCount: 1 },
  { name: 'rcDoc', maxCount: 1 },
  { name: 'pucDoc', maxCount: 1 },
  { name: 'insuranceDoc', maxCount: 1 },
  { name: 'licenseDoc', maxCount: 1 },
  { name: 'addressProofDoc', maxCount: 1 },
  { name: 'gstDoc', maxCount: 1 },
  { name: 'businessRegDoc', maxCount: 1 },
  { name: 'hotelLicenseDoc', maxCount: 1 },
  { name: 'guideLicenseDoc', maxCount: 1 },
  { name: 'fitnessDoc', maxCount: 1 },
  { name: 'permitDoc', maxCount: 1 },
  { name: 'bankProofDoc', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

export const uploadKycDocs = uploadFields;
