import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadMemorySingle } from '../middleware/upload.js';
import { getStorageConfig, uploadFile } from '../controllers/storageController.js';

const router = Router();

router.get('/config', protect, getStorageConfig);
router.post('/upload', protect, uploadMemorySingle('file'), uploadFile);

export default router;
