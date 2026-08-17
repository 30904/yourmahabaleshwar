import { Router } from 'express';
import * as phase4 from '../controllers/phase4Controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
const productManagers = [ROLES.SUPER_ADMIN, ROLES.PRODUCT_VENDOR, ROLES.MARKETING_STAFF];

router.get('/', phase4.listProducts);
router.get('/mine', protect, authorize(ROLES.PRODUCT_VENDOR, ROLES.SUPER_ADMIN), phase4.listMyProducts);
router.get('/:slug', phase4.getProductBySlug);
router.post('/', protect, authorize(...productManagers), phase4.createProduct);
router.put('/:id', protect, authorize(...productManagers), phase4.updateProduct);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.PRODUCT_VENDOR), phase4.deleteProduct);

export default router;
