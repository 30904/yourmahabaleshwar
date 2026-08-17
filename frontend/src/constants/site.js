/** Production site constants (overridable via Vite env) */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://www.yourmahabaleshwar.com'
).replace(/\/$/, '');

export const SITE_NAME = 'YOURMAHABALESHWAR.COM';
export const SUPPORT_EMAIL = 'support@yourmahabaleshwar.com';
export const CONTACT_EMAIL = 'hello@yourmahabaleshwar.com';
