import { Router } from 'express';
import * as enquiry from '../controllers/enquiryController.js';
import * as domain from '../controllers/domainController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post('/', enquiry.createEnquiry);
router.get(
  '/',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.OFFICE_STAFF_HOTEL, ROLES.OFFICE_STAFF_GUIDE),
  enquiry.getEnquiries
);
router.get(
  '/:id',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.OFFICE_STAFF_HOTEL, ROLES.OFFICE_STAFF_GUIDE),
  domain.getEnquiry
);
router.patch('/:id', protect, authorize(ROLES.SUPER_ADMIN, ROLES.OFFICE_STAFF_HOTEL), enquiry.updateEnquiry);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN), domain.deleteEnquiry);

export default router;
