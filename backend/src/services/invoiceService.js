import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const invoicesDir = path.join(__dirname, '../uploads/invoices');

const BRAND = {
  primary: '#003580',
  accent: '#1E88E5',
  text: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  soft: '#f1f5f9',
};

const ensureDir = () => {
  if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
};

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) =>
  new Date(date || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const resolveLogoPath = () => {
  const candidates = [
    path.join(__dirname, '../../../frontend/public/logo.png'),
    path.join(__dirname, '../uploads/logo.png'),
  ];
  return candidates.find((p) => fs.existsSync(p));
};

const drawHorizontalLine = (doc, y, x1, x2) => {
  doc.strokeColor(BRAND.line).lineWidth(1).moveTo(x1, y).lineTo(x2, y).stroke();
};

const drawSectionLabel = (doc, text, x, y) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(BRAND.accent)
    .text(String(text).toUpperCase(), x, y, { characterSpacing: 0.6 });
};

export const generateInvoiceNumber = (bookingNumber) =>
  `INV-${bookingNumber || Date.now().toString(36).toUpperCase()}`;

export const generateSubscriptionInvoiceNumber = (prefix = 'SUB') =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

/**
 * Customer booking invoice — issued in the name of the listing/vendor only.
 * No Your Mahabaleshwar / SM Enterprises branding.
 */
export const generateInvoicePdf = async ({ booking, customer, vendor, listingName, gstNumber }) => {
  ensureDir();
  const invoiceNumber = booking.invoiceNumber || generateInvoiceNumber(booking.bookingNumber);
  const fileName = `${invoiceNumber.replace(/[^\w.-]+/g, '_')}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const sellerName = listingName || vendor?.name || 'Service Partner';
  const subtotal = Number(booking.subtotal || 0);
  const gst = Number(booking.gst || 0);
  const total = Number(booking.total || subtotal + gst);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: `Invoice ${invoiceNumber}`,
        Author: sellerName,
        Subject: 'Tax Invoice',
      },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const left = 48;
    const right = pageWidth - 48;
    const contentWidth = right - left;

    doc.rect(0, 0, pageWidth, 92).fill(BRAND.primary);

    doc
      .fillColor('#fff')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(sellerName, left, 28, { width: contentWidth * 0.55 });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#bfdbfe')
      .text('Tax Invoice', left, 52, { width: contentWidth * 0.55 });

    doc
      .fillColor('#fff')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('TAX INVOICE', left, 28, { width: contentWidth, align: 'right' });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#bfdbfe')
      .text('Booking receipt', left, 52, { width: contentWidth, align: 'right' });

    let y = 112;
    doc.roundedRect(left, y, contentWidth, 64, 8).fill(BRAND.soft);
    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(8)
      .text('INVOICE NO.', left + 16, y + 12)
      .text('BOOKING NO.', left + 200, y + 12)
      .text('DATE', left + 380, y + 12);
    doc
      .fillColor(BRAND.text)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(invoiceNumber, left + 16, y + 28, { width: 170 })
      .text(booking.bookingNumber || '—', left + 200, y + 28, { width: 160 })
      .text(formatDate(booking.createdAt), left + 380, y + 28, { width: 120 });

    y = 196;
    const colWidth = (contentWidth - 20) / 2;
    drawSectionLabel(doc, 'Bill To', left, y);
    drawSectionLabel(doc, 'Issued By', left + colWidth + 20, y);

    y += 18;
    doc
      .fillColor(BRAND.text)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(customer?.name || 'Customer', left, y, { width: colWidth });
    doc.text(sellerName, left + colWidth + 20, y, { width: colWidth });

    y += 18;
    doc.font('Helvetica').fontSize(10).fillColor(BRAND.muted);
    const customerLines = [customer?.email, customer?.phone].filter(Boolean);
    const sellerLines = [
      vendor?.name && vendor.name !== sellerName ? `Contact: ${vendor.name}` : null,
      vendor?.email ? `Email: ${vendor.email}` : null,
      vendor?.phone ? `Phone: ${vendor.phone}` : null,
      gstNumber ? `GSTIN: ${gstNumber}` : null,
      booking.type ? `Service: ${String(booking.type).replace(/_/g, ' ')}` : null,
      booking.checkIn ? `Check-in: ${formatDate(booking.checkIn)}` : null,
      booking.checkOut ? `Check-out: ${formatDate(booking.checkOut)}` : null,
      booking.paymentStatus ? `Payment: ${booking.paymentStatus}` : null,
    ].filter(Boolean);

    const customerBlockH = Math.max(customerLines.length, 1) * 14;
    const sellerBlockH = Math.max(sellerLines.length, 1) * 14;
    doc.text(customerLines.join('\n') || '—', left, y, { width: colWidth, lineGap: 2 });
    doc.text(sellerLines.join('\n') || '—', left + colWidth + 20, y, { width: colWidth, lineGap: 2 });

    y += Math.max(customerBlockH, sellerBlockH) + 28;
    drawHorizontalLine(doc, y, left, right);

    y += 18;
    drawSectionLabel(doc, 'Particulars', left, y);
    y += 16;

    const tableTop = y;
    const rowH = 28;
    doc.roundedRect(left, tableTop, contentWidth, rowH, 6).fill(BRAND.primary);
    doc
      .fillColor('#fff')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('#', left + 12, tableTop + 10)
      .text('DESCRIPTION', left + 40, tableTop + 10)
      .text('AMOUNT', left, tableTop + 10, { width: contentWidth - 16, align: 'right' });

    y = tableTop + rowH + 4;
    const description = [
      sellerName,
      booking.guests?.adults ? `${booking.guests.adults} adult(s)` : null,
      booking.guidePackage ? `Package ${booking.guidePackage}` : null,
      booking.productQty > 1 ? `Qty ${booking.productQty}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    doc.roundedRect(left, y, contentWidth, 36, 6).lineWidth(1).fillAndStroke('#ffffff', BRAND.line);
    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(10)
      .text('1', left + 12, y + 12)
      .fillColor(BRAND.text)
      .font('Helvetica')
      .text(description, left + 40, y + 12, { width: contentWidth - 160 })
      .font('Helvetica-Bold')
      .text(formatINR(subtotal), left, y + 12, { width: contentWidth - 16, align: 'right' });

    y += 56;
    const boxW = 240;
    const boxX = right - boxW;
    const boxH = 110;
    doc.roundedRect(boxX, y, boxW, boxH, 10).fill(BRAND.soft);

    const labelX = boxX + 16;
    const valueWidth = boxW - 32;
    let ty = y + 16;
    const row = (label, value, bold = false) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 12 : 10)
        .fillColor(bold ? BRAND.primary : BRAND.muted)
        .text(label, labelX, ty, { width: valueWidth / 2, align: 'left' });
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(bold ? BRAND.primary : BRAND.text)
        .text(value, labelX, ty, { width: valueWidth, align: 'right' });
      ty += bold ? 22 : 20;
    };

    row('Subtotal', formatINR(subtotal));
    row('GST (12%)', formatINR(gst));
    doc
      .strokeColor(BRAND.line)
      .moveTo(labelX, ty - 4)
      .lineTo(boxX + boxW - 16, ty - 4)
      .stroke();
    ty += 6;
    row('Grand Total', formatINR(total), true);

    y += boxH + 28;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.accent).text('NOTES', left, y);
    y += 14;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(BRAND.muted)
      .text(
        `Thank you for booking with ${sellerName}. This invoice is system-generated for your paid booking.`,
        left,
        y,
        { width: contentWidth, lineGap: 2 }
      );

    const footerY = doc.page.height - 56;
    drawHorizontalLine(doc, footerY, left, right);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(sellerName, left, footerY + 12, { width: contentWidth / 2 })
      .text('This is a computer-generated invoice.', left, footerY + 12, {
        width: contentWidth,
        align: 'right',
      });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return {
    invoiceNumber,
    invoiceUrl: `/uploads/invoices/${fileName}`,
    filePath,
  };
};

/**
 * Vendor subscription / points purchase invoice — branded Your Mahabaleshwar.
 */
export const generateSubscriptionInvoicePdf = async ({
  vendor,
  title,
  description,
  amount,
  paymentRef,
  invoiceNumber: existingNumber,
  gstAmount = 0,
  metaLines = [],
}) => {
  ensureDir();
  const invoiceNumber = existingNumber || generateSubscriptionInvoiceNumber('YM-SUB');
  const fileName = `${invoiceNumber.replace(/[^\w.-]+/g, '_')}.pdf`;
  const filePath = path.join(invoicesDir, fileName);
  const logoPath = resolveLogoPath();
  const subtotal = Number(amount || 0);
  const gst = Number(gstAmount || 0);
  const total = subtotal + gst;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: `Invoice ${invoiceNumber}`,
        Author: 'Your Mahabaleshwar',
        Subject: 'Subscription Invoice',
      },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const left = 48;
    const right = pageWidth - 48;
    const contentWidth = right - left;

    doc.rect(0, 0, pageWidth, 92).fill(BRAND.primary);

    if (logoPath) {
      try {
        doc.image(logoPath, left, 22, { height: 48, fit: [140, 48] });
      } catch {
        doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text('Your Mahabaleshwar', left, 30);
      }
    } else {
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text('Your Mahabaleshwar', left, 30);
    }

    doc
      .fillColor('#fff')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('TAX INVOICE', left, 28, { width: contentWidth, align: 'right' });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#bfdbfe')
      .text('Subscription / Platform services', left, 52, { width: contentWidth, align: 'right' });

    let y = 112;
    doc.roundedRect(left, y, contentWidth, 64, 8).fill(BRAND.soft);
    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(8)
      .text('INVOICE NO.', left + 16, y + 12)
      .text('PAYMENT REF.', left + 200, y + 12)
      .text('DATE', left + 380, y + 12);
    doc
      .fillColor(BRAND.text)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(invoiceNumber, left + 16, y + 28, { width: 170 })
      .text(paymentRef || '—', left + 200, y + 28, { width: 160 })
      .text(formatDate(new Date()), left + 380, y + 28, { width: 120 });

    y = 196;
    const colWidth = (contentWidth - 20) / 2;
    drawSectionLabel(doc, 'Bill To', left, y);
    drawSectionLabel(doc, 'Issued By', left + colWidth + 20, y);

    y += 18;
    doc
      .fillColor(BRAND.text)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(vendor?.name || 'Vendor', left, y, { width: colWidth });
    doc.text('Your Mahabaleshwar', left + colWidth + 20, y, { width: colWidth });

    y += 18;
    doc.font('Helvetica').fontSize(10).fillColor(BRAND.muted);
    const billLines = [vendor?.email, vendor?.phone, vendor?.role ? `Role: ${vendor.role}` : null]
      .filter(Boolean)
      .concat(metaLines.filter(Boolean));
    const issuerLines = [
      'YOURMAHABALESHWAR.COM',
      'SM Enterprises',
      'Mahabaleshwar Tourism Platform',
      'hello@yourmahabaleshwar.com',
    ];
    doc.text(billLines.join('\n') || '—', left, y, { width: colWidth, lineGap: 2 });
    doc.text(issuerLines.join('\n'), left + colWidth + 20, y, { width: colWidth, lineGap: 2 });

    y += Math.max(billLines.length, issuerLines.length) * 14 + 28;
    drawHorizontalLine(doc, y, left, right);

    y += 18;
    drawSectionLabel(doc, 'Particulars', left, y);
    y += 16;

    const tableTop = y;
    doc.roundedRect(left, tableTop, contentWidth, 28, 6).fill(BRAND.primary);
    doc
      .fillColor('#fff')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('#', left + 12, tableTop + 10)
      .text('DESCRIPTION', left + 40, tableTop + 10)
      .text('AMOUNT', left, tableTop + 10, { width: contentWidth - 16, align: 'right' });

    y = tableTop + 32;
    doc.roundedRect(left, y, contentWidth, 44, 6).lineWidth(1).fillAndStroke('#ffffff', BRAND.line);
    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(10)
      .text('1', left + 12, y + 14)
      .fillColor(BRAND.text)
      .font('Helvetica-Bold')
      .text(title || 'Subscription', left + 40, y + 10, { width: contentWidth - 160 })
      .font('Helvetica')
      .fontSize(9)
      .fillColor(BRAND.muted)
      .text(description || '', left + 40, y + 26, { width: contentWidth - 160 })
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(BRAND.text)
      .text(formatINR(subtotal), left, y + 14, { width: contentWidth - 16, align: 'right' });

    y += 64;
    const boxW = 240;
    const boxX = right - boxW;
    doc.roundedRect(boxX, y, boxW, 90, 10).fill(BRAND.soft);
    const labelX = boxX + 16;
    let ty = y + 16;
    const row = (label, value, bold = false) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 12 : 10)
        .fillColor(bold ? BRAND.primary : BRAND.muted)
        .text(label, labelX, ty);
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(bold ? BRAND.primary : BRAND.text)
        .text(value, labelX, ty, { width: boxW - 32, align: 'right' });
      ty += bold ? 22 : 18;
    };
    row('Subtotal', formatINR(subtotal));
    if (gst > 0) row('GST', formatINR(gst));
    row('Grand Total', formatINR(total), true);

    y += 110;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.accent).text('NOTES', left, y);
    y += 14;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(BRAND.muted)
      .text(
        'Thank you for subscribing with Your Mahabaleshwar (YOURMAHABALESHWAR.COM / SM Enterprises). This invoice is for platform subscription or points purchase.',
        left,
        y,
        { width: contentWidth, lineGap: 2 }
      );

    const footerY = doc.page.height - 56;
    drawHorizontalLine(doc, footerY, left, right);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text('Your Mahabaleshwar  ·  YOURMAHABALESHWAR.COM', left, footerY + 12, {
        width: contentWidth / 2,
      })
      .text('This is a computer-generated invoice.', left, footerY + 12, {
        width: contentWidth,
        align: 'right',
      });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return {
    invoiceNumber,
    invoiceUrl: `/uploads/invoices/${fileName}`,
    filePath,
  };
};

export const resolveInvoiceFilePath = (invoiceNumber) => {
  if (!invoiceNumber) return null;
  const fileName = `${String(invoiceNumber).replace(/[^\w.-]+/g, '_')}.pdf`;
  const filePath = path.join(invoicesDir, fileName);
  return fs.existsSync(filePath) ? filePath : null;
};
