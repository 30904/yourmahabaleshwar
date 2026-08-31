import { success, error } from '../utils/apiResponse.js';
import {
  confirmPointsRecharge,
  confirmUnlimitedMonthly,
  createPointsRechargeOrder,
  createUnlimitedMonthlyOrder,
  getAllServiceMonetizationConfig,
  getServiceMonetizationStatus,
  updateServiceMonetizationConfig,
  activateUnlimitedMonthly,
} from '../services/serviceMonetizationService.js';
import { SERVICE_TENANTS, serviceTenantForRole } from '../constants/serviceMonetization.js';

export const getMyServiceMonetization = async (req, res) => {
  try {
    const tenant = serviceTenantForRole(req.user.role);
    if (!tenant) return success(res, { supported: false });
    const status = await getServiceMonetizationStatus(req.user._id, tenant);
    return success(res, status);
  } catch (err) {
    return error(res, err.message || 'Failed to load subscription', 500);
  }
};

export const orderPointsRecharge = async (req, res) => {
  try {
    const tenant = serviceTenantForRole(req.user.role);
    if (!tenant) return error(res, 'Points recharge not available for your account', 400);
    const result = await createPointsRechargeOrder(req.user._id, req.body.amount, tenant);
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Failed to create order', 400);
  }
};

export const confirmPointsRechargePayment = async (req, res) => {
  try {
    const tenant = serviceTenantForRole(req.user.role);
    if (!tenant) return error(res, 'Invalid account', 400);
    const result = await confirmPointsRecharge(req.user._id, tenant, req.body, req.body.amount);
    return success(res, result, 'Points recharged');
  } catch (err) {
    return error(res, err.message || 'Payment failed', 400);
  }
};

export const orderUnlimitedMonthly = async (req, res) => {
  try {
    const tenant = serviceTenantForRole(req.user.role);
    if (!tenant) return error(res, 'Unlimited plan not available for your account', 400);
    const result = await createUnlimitedMonthlyOrder(req.user._id, tenant);
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Failed to create order', 400);
  }
};

export const confirmUnlimitedMonthlyPayment = async (req, res) => {
  try {
    const tenant = serviceTenantForRole(req.user.role);
    if (!tenant) return error(res, 'Invalid account', 400);
    const sub = await confirmUnlimitedMonthly(req.user._id, tenant, req.body);
    return success(res, sub, 'Unlimited plan activated');
  } catch (err) {
    return error(res, err.message || 'Payment failed', 400);
  }
};

export const adminGetServiceMonetization = async (req, res) => {
  try {
    return success(res, await getAllServiceMonetizationConfig());
  } catch (err) {
    return error(res, err.message || 'Failed to load config', 500);
  }
};

export const adminUpdateServiceMonetization = async (req, res) => {
  try {
    const { tenantType } = req.params;
    const config = await updateServiceMonetizationConfig(tenantType, req.body);
    return success(res, config, 'Updated');
  } catch (err) {
    return error(res, err.message || 'Update failed', 400);
  }
};

export const adminGrantUnlimitedMonthly = async (req, res) => {
  try {
    const { vendorId, tenantType } = req.body;
    if (!vendorId || !tenantType) return error(res, 'vendorId and tenantType required', 400);
    if (!SERVICE_TENANTS.includes(String(tenantType).toUpperCase())) {
      return error(res, 'Invalid tenant type', 400);
    }
    const sub = await activateUnlimitedMonthly(vendorId, tenantType, {
      paymentRef: 'ADMIN_GRANT',
      amountPaid: 0,
    });
    return success(res, sub, 'Unlimited plan granted');
  } catch (err) {
    return error(res, err.message || 'Grant failed', 400);
  }
};
