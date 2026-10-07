/**
 * WhatsApp via Fast2SMS (Meta Cloud API-compatible).
 *
 * Env:
 *   WHATSAPP_API_URL              e.g. https://www.fast2sms.com/dev/whatsapp/v26.0/{PHONE_NUMBER_ID}/messages
 *   WHATSAPP_API_TOKEN            Fast2SMS API Authorization Key
 *   WHATSAPP_OTP_TEMPLATE         Approved AUTHENTICATION template (e.g. ymb_otp_auth)
 *   WHATSAPP_OTP_LANGUAGE         default en_US
 *   WHATSAPP_PAYMENT_TEMPLATE     Utility template name (default payment_completed)
 *   WHATSAPP_PAYMENT_LANGUAGE     default en
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

const formatAmountParam = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount ?? '');
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
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

const buildBody = ({ phone, message, template, code, bodyParams }) => {
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
    const name = typeof template === 'string' ? template : template.name;
    const language =
      (typeof template === 'object' && (template.language || template.languageCode)) ||
      process.env.WHATSAPP_PAYMENT_LANGUAGE ||
      process.env.WHATSAPP_OTP_LANGUAGE ||
      'en';
    const params =
      bodyParams ||
      (typeof template === 'object' && Array.isArray(template.bodyParams)
        ? template.bodyParams
        : null);

    const components =
      (typeof template === 'object' && template.components) ||
      (params?.length
        ? [
            {
              type: 'body',
              parameters: params.map((p) =>
                typeof p === 'object' && p.type ? p : { type: 'text', text: String(p) }
              ),
            },
          ]
        : undefined);

    if (name) {
      return {
        ...base,
        type: 'template',
        template: {
          name,
          language: { code: language },
          ...(components ? { components } : {}),
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

export const sendWhatsApp = async ({ phone, message, template, code, bodyParams }) => {
  const url = (process.env.WHATSAPP_API_URL || '').trim();
  const token = (process.env.WHATSAPP_API_TOKEN || '').trim();
  if (!url || !token) {
    return { mock: true, phone, message, template };
  }

  const body = buildBody({ phone, message, template, code, bodyParams });
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

/**
 * Utility template `payment_completed`:
 * Dear user, Your last payment completed successfully amount: {{1}} Thank you.
 */
export const sendWhatsAppPaymentCompleted = async ({ phone, amount }) => {
  const templateName =
    (process.env.WHATSAPP_PAYMENT_TEMPLATE || '').trim() || 'payment_completed';
  if (!phone) {
    return { skipped: true, reason: 'No phone number' };
  }

  return sendWhatsApp({
    phone,
    template: {
      name: templateName,
      language: process.env.WHATSAPP_PAYMENT_LANGUAGE || 'en',
    },
    bodyParams: [formatAmountParam(amount)],
  });
};
