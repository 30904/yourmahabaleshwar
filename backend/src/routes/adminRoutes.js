import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import * as enterprise from '../controllers/enterpriseAdminController.js';
import * as uploadCenter from '../controllers/uploadCenterController.js';
import * as catalog from '../controllers/catalogController.js';
import * as phase1b from '../controllers/phase1bController.js';
import * as domain from '../controllers/domainController.js';
import * as phase4 from '../controllers/phase4Controller.js';
import * as staySub from '../controllers/stayListingSubscriptionController.js';
import * as serviceMon from '../controllers/serviceMonetizationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAdminActions } from '../middleware/audit.js';
import { uploadBannerImage, uploadBlogCover, uploadExcel } from '../middleware/upload.js';
import { ROLES, STAFF_ROLES, VENDOR_ROLES, MARKETING_ROLES } from '../constants/roles.js';

const router = Router();

const adminOnly = [ROLES.SUPER_ADMIN];
const staffAndAdmin = [ROLES.SUPER_ADMIN, ...STAFF_ROLES];
const vendorAndAdmin = [ROLES.SUPER_ADMIN, ...VENDOR_ROLES];

router.get('/public/banners', admin.getPublicBanners);
router.get('/public/faqs', admin.getPublicFaqs);
router.get('/public/blogs', admin.getPublicBlogs);
router.get('/public/destinations', domain.listDestinations);
router.get('/public/document-requirements', domain.getDocumentRequirements);

router.use(protect);
router.use(auditAdminActions);

router.get('/dashboard', authorize(...staffAndAdmin), admin.getDashboardStats);
router.get('/enterprise/dashboard', authorize(...staffAndAdmin), enterprise.getEnterpriseDashboard);
router.get('/enterprise/properties', authorize(...staffAndAdmin), enterprise.getAdminProperties);
router.patch('/enterprise/properties/:id/status', authorize(...staffAndAdmin), enterprise.setAdminPropertyActive);
router.get('/enterprise/listings/:id/review', authorize(...staffAndAdmin), enterprise.getAdminListingReview);
router.get('/enterprise/properties/:id', authorize(...staffAndAdmin), enterprise.getAdminProperty);
router.post('/enterprise/properties', authorize(...adminOnly), enterprise.createAdminProperty);
router.put('/enterprise/properties/:id', authorize(...adminOnly), enterprise.updateAdminProperty);
router.get('/enterprise/bookings', authorize(...staffAndAdmin), enterprise.getAdminBookings);
router.get('/enterprise/guides', authorize(...staffAndAdmin), enterprise.getAdminGuides);
router.get('/enterprise/drivers', authorize(...staffAndAdmin), enterprise.getAdminDrivers);
router.get('/enterprise/vendors', authorize(...staffAndAdmin), enterprise.getAdminVendors);
router.get('/enterprise/customers', authorize(...staffAndAdmin), enterprise.getAdminCustomers);
router.get('/enterprise/coupons', authorize(...staffAndAdmin), enterprise.getCoupons);
router.post('/enterprise/coupons', authorize(...adminOnly), enterprise.createCoupon);
router.patch('/enterprise/coupons/:id', authorize(...adminOnly), enterprise.updateCoupon);
router.get('/enterprise/settings', authorize(...adminOnly), enterprise.getPlatformSettings);
router.put('/enterprise/settings', authorize(...adminOnly), enterprise.updatePlatformSettings);
router.get('/enterprise/finance', authorize(...staffAndAdmin), enterprise.getFinanceSummary);
router.get('/upload-center/types', authorize(...adminOnly), uploadCenter.getUploadTypes);
router.get('/upload-center/templates/:type', authorize(...adminOnly), uploadCenter.downloadTemplate);
router.post('/upload-center/import/:type', authorize(...adminOnly), uploadExcel, uploadCenter.importUpload);
router.get('/catalog/amenities', authorize(...staffAndAdmin), catalog.listAmenities);
router.post('/catalog/amenities', authorize(...adminOnly), catalog.createAmenity);
router.put('/catalog/amenities/:id', authorize(...adminOnly), catalog.updateAmenity);
router.delete('/catalog/amenities/:id', authorize(...adminOnly), catalog.deleteAmenity);
router.get('/catalog/room-types', authorize(...staffAndAdmin), catalog.listRoomTypes);
router.post('/catalog/room-types', authorize(...adminOnly), catalog.createRoomType);
router.put('/catalog/room-types/:id', authorize(...adminOnly), catalog.updateRoomType);
router.delete('/catalog/room-types/:id', authorize(...adminOnly), catalog.deleteRoomType);
router.get('/users', authorize(...adminOnly), admin.getUsers);
router.get('/kyc', authorize(...adminOnly), admin.getKycList);
router.patch('/kyc/:id', authorize(...adminOnly), admin.updateKyc);
router.get('/payouts', authorize(...adminOnly), admin.getPayouts);
router.get('/banners', authorize(...adminOnly), admin.getCmsBanners);
router.post('/banners', authorize(...adminOnly), uploadBannerImage, admin.createBanner);
router.get('/blogs', authorize(...adminOnly), admin.getCmsBlogs);
router.get('/blogs/:id', authorize(...adminOnly), admin.getCmsBlog);
router.post('/blogs', authorize(...adminOnly), uploadBlogCover, admin.createBlog);
router.put('/blogs/:id', authorize(...adminOnly), uploadBlogCover, admin.updateBlog);
router.delete('/blogs/:id', authorize(...adminOnly), admin.deleteBlog);
router.get('/faqs', authorize(...adminOnly), admin.getCmsFaqs);
router.post('/faqs', authorize(...adminOnly), admin.createFaq);

// Phase 1B
router.post('/phase1b/seed-defaults', authorize(...adminOnly), phase1b.seedPhase1bDefaults);

router.get('/subscriptions/plans', authorize(...staffAndAdmin, ...VENDOR_ROLES), phase1b.listPlans);
router.post('/subscriptions/plans', authorize(...adminOnly), phase1b.createPlan);
router.patch('/subscriptions/plans/:id', authorize(...adminOnly), phase1b.updatePlan);
router.get('/subscriptions', authorize(...adminOnly), phase1b.listSubscriptions);
router.post('/subscriptions/assign', authorize(...adminOnly), phase1b.assignSubscription);
router.get('/subscriptions/me', authorize(...vendorAndAdmin), phase1b.mySubscription);
router.post('/subscriptions/points/purchase', authorize(...vendorAndAdmin), phase1b.purchasePoints);

router.patch('/stay-subscriptions/:listingType/:listingId/renewal-price', authorize(...staffAndAdmin), staySub.adminSetStayRenewalPrice);
router.post('/stay-subscriptions/:listingType/:listingId/renew', authorize(...staffAndAdmin), staySub.adminRenewStaySubscription);

router.get('/service-monetization', authorize(...adminOnly), serviceMon.adminGetServiceMonetization);
router.patch('/service-monetization/:tenantType', authorize(...adminOnly), serviceMon.adminUpdateServiceMonetization);
router.post('/service-monetization/unlimited/grant', authorize(...adminOnly), serviceMon.adminGrantUnlimitedMonthly);

router.get('/wallet', authorize(...vendorAndAdmin), phase1b.getWallet);
router.post('/payouts/generate', authorize(...adminOnly), phase1b.generateVendorPayouts);
router.get('/payouts/detailed', authorize(...adminOnly), phase1b.listPayoutsDetailed);
router.patch('/payouts/:id', authorize(...adminOnly), phase1b.updatePayoutStatus);

router.get('/ads/packages', authorize(...staffAndAdmin), phase1b.listAdPackages);
router.post('/ads/packages', authorize(...adminOnly), phase1b.createAdPackage);
router.patch('/ads/packages/:id', authorize(...adminOnly), phase1b.updateAdPackage);
router.get('/ads', authorize(...staffAndAdmin), phase1b.listAdvertisements);
router.post('/ads', authorize(...adminOnly), phase1b.createAdvertisement);
router.post('/ads/:id/track', phase1b.trackAdEvent);
router.get('/ads/analytics', authorize(...staffAndAdmin), phase1b.adAnalytics);
router.get('/ads/featured', authorize(...staffAndAdmin), phase1b.listFeatured);
router.post('/ads/featured', authorize(...adminOnly), phase1b.setFeatured);

router.get('/campaigns', authorize(...MARKETING_ROLES), phase1b.listCampaigns);
router.post('/campaigns', authorize(...MARKETING_ROLES), phase1b.createCampaign);
router.patch('/campaigns/:id', authorize(...MARKETING_ROLES), phase1b.updateCampaign);
router.post('/campaigns/:id/send', authorize(...MARKETING_ROLES), phase1b.sendCampaign);

router.get('/reports/hub', authorize(...staffAndAdmin), phase1b.getReportsHub);
router.get('/reports/hub/export', authorize(...staffAndAdmin), async (req, res) => {
  const { exportReport } = await import('../controllers/exportController.js');
  return exportReport(req, res);
});

router.get('/backups', authorize(...adminOnly), phase1b.getBackups);
router.post('/backups', authorize(...adminOnly), phase1b.triggerBackup);
router.post('/backups/:id/restore', authorize(...adminOnly), phase1b.restoreBackup);

// Phase 1C — domain APIs
router.post('/users', authorize(...adminOnly), domain.createUser);
router.patch('/users/:id', authorize(...adminOnly), domain.updateUser);
router.post('/users/:id/reset-password', authorize(...adminOnly), domain.resetUserPassword);

router.post('/vendors', authorize(...adminOnly), domain.adminCreateVendor);
router.get('/enterprise/homestays', authorize(...staffAndAdmin), domain.listAdminHomestays);
router.get('/enterprise/horses', authorize(...staffAndAdmin), domain.listAdminHorses);
router.get('/enterprise/tents', authorize(...staffAndAdmin), domain.listAdminTents);

router.put('/rooms/:id/seasonal', authorize(...adminOnly, ROLES.HOTEL_VENDOR), domain.updateRoomSeasonal);

router.get('/guide-packages', authorize(...staffAndAdmin, ROLES.GUIDE), domain.listGuidePackages);
router.post('/guide-packages', authorize(...adminOnly, ROLES.GUIDE), domain.createGuidePackage);
router.patch('/guide-packages/:id', authorize(...adminOnly, ROLES.GUIDE), domain.updateGuidePackage);
router.delete('/guide-packages/:id', authorize(...adminOnly), domain.deleteGuidePackage);

router.get('/taxi-hourly-packages', authorize(...staffAndAdmin, ROLES.TAXI_OPERATOR, ROLES.DRIVER), domain.listTaxiHourlyPackages);
router.post('/taxi-hourly-packages', authorize(...adminOnly), domain.createTaxiHourlyPackage);
router.patch('/taxi-hourly-packages/:id', authorize(...adminOnly), domain.updateTaxiHourlyPackage);

router.get('/destinations', authorize(...staffAndAdmin), domain.listDestinations);
router.post('/destinations', authorize(...adminOnly), domain.createDestination);
router.patch('/destinations/:id', authorize(...adminOnly), domain.updateDestination);
router.delete('/destinations/:id', authorize(...adminOnly), domain.deleteDestination);
router.get('/analytics/destinations', authorize(...staffAndAdmin), domain.destinationsAnalytics);

router.get('/notification-templates', authorize(...MARKETING_ROLES), domain.listNotificationTemplates);
router.post('/notification-templates', authorize(...MARKETING_ROLES), domain.upsertNotificationTemplate);
router.post('/notification-templates/seed', authorize(...adminOnly), domain.seedNotificationTemplates);

router.get('/document-requirements', authorize(...staffAndAdmin, ...VENDOR_ROLES), domain.getDocumentRequirements);
router.put('/document-requirements', authorize(...adminOnly), domain.upsertDocumentRequirement);
router.post('/document-requirements/seed', authorize(...adminOnly), domain.seedDocumentRequirements);

router.get('/payments', authorize(...staffAndAdmin), domain.listPayments);
router.get('/refunds', authorize(...staffAndAdmin), domain.listRefunds);
router.patch('/refunds/:bookingId', authorize(...adminOnly), domain.moderateRefund);

router.patch('/banners/:id', authorize(...adminOnly), domain.updateBanner);
router.delete('/banners/:id', authorize(...adminOnly), domain.deleteBanner);
router.patch('/faqs/:id', authorize(...adminOnly), domain.updateFaq);
router.delete('/faqs/:id', authorize(...adminOnly), domain.deleteFaq);

router.get('/commission-rates', authorize(...adminOnly), domain.getCommissionRates);
router.put('/commission-rates', authorize(...adminOnly), domain.updateListingCommission);

router.get('/audit-logs', authorize(...adminOnly), domain.getAuditLogs);

// Phase 4 — products & combos
router.get('/products', authorize(...staffAndAdmin, ROLES.PRODUCT_VENDOR), phase4.listAdminProducts);
router.get('/combos', authorize(...staffAndAdmin, ROLES.PRODUCT_VENDOR), phase4.listAdminCombos);
router.post('/phase4/seed-defaults', authorize(...adminOnly), phase4.seedPhase4Defaults);

export default router;
