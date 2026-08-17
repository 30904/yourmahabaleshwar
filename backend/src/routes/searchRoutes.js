import { Router } from 'express';
import { globalSearch } from '../controllers/listingController.js';

const router = Router();
router.get('/', globalSearch);

export default router;
