import { Router } from 'express';
import * as phase4 from '../controllers/phase4Controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
const managers = [ROLES.SUPER_ADMIN, ROLES.MARKETING_STAFF, ROLES.PRODUCT_VENDOR];

router.get('/', phase4.listCombos);
router.get('/:slug', phase4.getComboBySlug);
router.post('/', protect, authorize(...managers), phase4.createCombo);
router.put('/:id', protect, authorize(...managers), phase4.updateCombo);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN), phase4.deleteCombo);

export default router;
