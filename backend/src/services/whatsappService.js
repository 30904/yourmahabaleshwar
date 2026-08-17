export const sendWhatsApp = async ({ phone, message, template }) => {
  const url = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;
  if (!url || !token) {
    return { mock: true, phone, message };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message, template }),
  });
  return res.json();
};
