/**
 * Fail fast in production when critical secrets/config are missing or unsafe.
 */
export function validateEnv({ nodeEnv }) {
  const isProd = nodeEnv === 'production';
  const errors = [];
  const warnings = [];

  const requiredAlways = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of requiredAlways) {
    if (!process.env[key]?.trim()) errors.push(`${key} is required`);
  }

  if (isProd) {
    const weakJwt =
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.includes('change_in_production') ||
      process.env.JWT_SECRET.length < 32;
    const weakRefresh =
      !process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_REFRESH_SECRET.includes('change_in_production') ||
      process.env.JWT_REFRESH_SECRET.length < 32;

    if (weakJwt) errors.push('JWT_SECRET must be a strong random string (min 32 chars) in production');
    if (weakRefresh) {
      errors.push('JWT_REFRESH_SECRET must be a strong random string (min 32 chars) in production');
    }

    if (!process.env.CLIENT_URL?.trim()) {
      errors.push('CLIENT_URL must list production frontend origin(s), comma-separated');
    } else if (!process.env.CLIENT_URL.includes('https://www.yourmahabaleshwar.com')) {
      warnings.push(
        'CLIENT_URL should include https://www.yourmahabaleshwar.com for the production site'
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      warnings.push('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing — payments will use mock mode');
    }
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      warnings.push('RAZORPAY_WEBHOOK_SECRET missing — webhook signature checks are skipped');
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      warnings.push('SMTP_USER / SMTP_PASS missing — transactional email will no-op');
    }
    if (!process.env.FAST2SMS_API_KEY && !process.env.MSG91_AUTH_KEY) {
      warnings.push('No SMS provider key — OTP SMS will log/mock only');
    }
  }

  for (const w of warnings) console.warn(`[env] ${w}`);

  if (errors.length) {
    const msg = `Environment validation failed:\n- ${errors.join('\n- ')}`;
    if (isProd) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(msg);
  }
}
