/** Production site constants (overridable via Vite env) */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://www.yourmahabaleshwar.com'
).replace(/\/$/, '');

export const SITE_NAME = 'YOURMAHABALESHWAR.COM';
export const SUPPORT_EMAIL = 'support@yourmahabaleshwar.com';
export const CONTACT_EMAIL = 'hello@yourmahabaleshwar.com';

/** Public contact numbers shown on Contact Us / About Us */
export const SUPPORT_PHONES = [
  { label: '+91 9987 6567 92', href: 'tel:+919987656792' },
  { label: '+91 9987 6866 92', href: 'tel:+919987686692' },
];
