/**
 * WhatsApp via Fast2SMS (Meta Cloud API-compatible).
 *
 * Env:
 *   WHATSAPP_API_URL          e.g. https://www.fast2sms.com/dev/whatsapp/v26.0/{PHONE_NUMBER_ID}/messages
 *   WHATSAPP_API_TOKEN        Fast2SMS API Authorization Key
 *   WHATSAPP_OTP_TEMPLATE     Approved AUTHENTICATION template name (e.g. ymb_otp_auth)
 *   WHATSAPP_OTP_LANGUAGE     Template language code (default en_US)
 */

const normalizePhone = (phone) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
};

const authHeader = (token) => {
  const t = String(token || '').trim();
  if (!t) return '';
  if (/^bearer\s+/i.test(t)) return t;
  return t;
};

const buildAuthOtpComponents = (code) => {
  const otp = String(code || '').trim();
  return [
    {
      type: 'body',
      parameters: [{ type: 'text', text: otp }],
    },
    {
      type: 'button',
      sub_type: 'otp',
      index: '0',
      parameters: [{ type: 'text', text: otp }],
    },
  ];
};

const buildBody = ({ phone, message, template, code }) => {
  const to = normalizePhone(phone);
  const base = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
  };

  // Explicit OTP auth template (preferred for login/signup codes)
  if (code && (typeof template === 'string' || template?.name || process.env.WHATSAPP_OTP_TEMPLATE)) {
    const name =
      (typeof template === 'string' && template) ||
      template?.name ||
      process.env.WHATSAPP_OTP_TEMPLATE;
    const language =
      template?.language ||
      template?.languageCode ||
      process.env.WHATSAPP_OTP_LANGUAGE ||
      'en_US';
    return {
      ...base,
      type: 'template',
      template: {
        name,
        language: { code: language },
        components: buildAuthOtpComponents(code),
      },
    };
  }

  if (template) {
    if (typeof template === 'string') {
      return {
        ...base,
        type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_OTP_LANGUAGE || 'en' },
        },
      };
    }
    if (typeof template === 'object' && template.name) {
      return {
        ...base,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language || template.languageCode || 'en' },
          ...(template.components ? { components: template.components } : {}),
        },
      };
    }
  }

  return {
    ...base,
    type: 'text',
    text: {
      preview_url: false,
      body: String(message || '').slice(0, 4096),
    },
  };
};

async function postWhatsApp(body) {
  const url = (process.env.WHATSAPP_API_URL || '').trim();
  const token = (process.env.WHATSAPP_API_TOKEN || '').trim();

  if (!url || !token) {
    return { mock: true, skipped: true, reason: 'WhatsApp env not configured' };
  }
  if (!body?.to) {
    return { ok: false, error: 'Invalid phone number' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = { raw: await res.text().catch(() => '') };
  }

  if (!res.ok) {
    console.error('[whatsapp] Fast2SMS error', res.status, data);
    return { ok: false, status: res.status, ...data };
  }

  return { ok: true, ...data };
}

export const sendWhatsApp = async ({ phone, message, template, code }) => {
  const url = (process.env.WHATSAPP_API_URL || '').trim();
  const token = (process.env.WHATSAPP_API_TOKEN || '').trim();
  if (!url || !token) {
    return { mock: true, phone, message, template };
  }

  const body = buildBody({ phone, message, template, code });
  return postWhatsApp(body);
};

/** Send login/signup OTP via approved WhatsApp AUTHENTICATION template. */
export const sendWhatsAppOtp = async ({ phone, code }) => {
  const templateName = (process.env.WHATSAPP_OTP_TEMPLATE || '').trim();
  if (!templateName) {
    return { skipped: true, reason: 'WHATSAPP_OTP_TEMPLATE not set' };
  }
  if (!code) {
    return { ok: false, error: 'OTP code required' };
  }

  return sendWhatsApp({
    phone,
    code,
    template: {
      name: templateName,
      language: process.env.WHATSAPP_OTP_LANGUAGE || 'en_US',
    },
  });
};
