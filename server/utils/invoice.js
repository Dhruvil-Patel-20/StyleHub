const fs = require('fs');
const path = require('path');

function formatCurrency(n) {
  return '$' + (Number(n) || 0).toFixed(2);
}

function buildInvoiceData(order, user) {
  const invoiceNumber = `INV-${new Date(order.created_at || Date.now()).toISOString().slice(0,10).replace(/-/g,'')}-${String(order.id).slice(0,8).toUpperCase()}`;

  const allItems = (order.items || []).map(it => ({
    name: it.name,
    size: it.size || null,
    qty: it.quantity || 1,
    price: Number(it.price || 0),
    lineTotal: Number(it.price || 0) * (it.quantity || 1),
    returned: it.return_status === 'refunded' || it.refund_processed === true,
    refundAmount: it.refund_amount ? Number(it.refund_amount) : null,
  }));

  const activeItems = allItems.filter(i => !i.returned);
  const returnedItems = allItems.filter(i => i.returned);

  const subtotal = activeItems.reduce((s, i) => s + i.lineTotal, 0);
  const tax = Number(order.tax || 0);
  const shipping = Number(order.shipping_price || 0) || Number(order.shipping || 0) || 0;
  const discount = Number(order.discount || 0) || 0;
  const totalRefunded = returnedItems.reduce((s, i) => s + (i.refundAmount ?? i.lineTotal), 0);
  const grandTotal = Number(order.total_price || 0) - totalRefunded;

  const addr = order.shipping_address || {};

  return {
    invoiceNumber,
    invoiceDate: new Date(order.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    orderId: order.id,
    customerName: addr.fullName || user?.name || '',
    customerEmail: user?.email || '',
    billingAddress: addr,
    allItems,
    activeItems,
    returnedItems,
    subtotal,
    tax,
    shipping,
    discount,
    totalRefunded,
    grandTotal,
    paymentMethod: order.payment_method,
    paymentStatus: order.is_paid ? 'Paid' : 'Unpaid',
    deliveryMethod: order.delivery_method || 'standard',
    hasReturns: returnedItems.length > 0,
  };
}

async function generatePdfBuffer(invoiceData) {
  return new Promise((resolve, reject) => {
    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      return reject(new Error('pdfkit is not installed. Run `npm install pdfkit` in the server folder.'));
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 495; // usable width (595 - 2*50)
    const gray = '#6B7280';
    const dark = '#111827';
    const accent = '#4F46E5';

    // ── Header ──
    doc.fontSize(22).fillColor(accent).text('StyleHub', 50, 50);
    doc.fontSize(10).fillColor(gray).text('Fashion Store', 50, 76);
    doc.fontSize(10).fillColor(dark)
      .text(`Invoice: ${invoiceData.invoiceNumber}`, 50, 50, { align: 'right' })
      .text(`Date: ${invoiceData.invoiceDate}`, 50, 64, { align: 'right' })
      .text(`Order: #${String(invoiceData.orderId).slice(-8).toUpperCase()}`, 50, 78, { align: 'right' });

    doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#E5E7EB').stroke();

    // ── Billing ──
    doc.moveDown(2);
    doc.fontSize(9).fillColor(gray).text('BILLED TO', 50, 115);
    doc.fontSize(11).fillColor(dark).text(invoiceData.customerName, 50, 128);
    const ba = invoiceData.billingAddress;
    if (ba.address) doc.fontSize(10).fillColor(gray).text(ba.address + (ba.city ? ', ' + ba.city : ''));
    if (ba.postalCode || ba.country) doc.fontSize(10).fillColor(gray).text(`${ba.postalCode || ''} ${ba.country || ''}`.trim());
    if (invoiceData.customerEmail) doc.fontSize(10).fillColor(gray).text(invoiceData.customerEmail);

    // Payment info on right
    doc.fontSize(9).fillColor(gray).text('PAYMENT', 350, 115);
    doc.fontSize(10).fillColor(dark).text(
      invoiceData.paymentMethod === 'stripe' ? 'Credit / Debit Card' :
      invoiceData.paymentMethod === 'paypal' ? 'PayPal' :
      invoiceData.paymentMethod === 'cod' ? 'Cash on Delivery' :
      invoiceData.paymentMethod || '—', 350, 128);
    doc.fontSize(10).fillColor(invoiceData.paymentStatus === 'Paid' ? '#16A34A' : '#DC2626').text(invoiceData.paymentStatus, 350, 142);

    // ── Items Table ──
    let y = doc.y + 20;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
    y += 8;

    // Table header
    doc.fontSize(9).fillColor(gray);
    doc.text('ITEM', 50, y);
    doc.text('QTY', 330, y, { width: 50, align: 'right' });
    doc.text('UNIT PRICE', 385, y, { width: 70, align: 'right' });
    doc.text('TOTAL', 460, y, { width: 85, align: 'right' });
    y += 16;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
    y += 8;

    // Active items
    invoiceData.activeItems.forEach(it => {
      doc.fontSize(10).fillColor(dark).text(it.name + (it.size ? ` (${it.size})` : ''), 50, y, { width: 270 });
      doc.text(String(it.qty), 330, y, { width: 50, align: 'right' });
      doc.text(formatCurrency(it.price), 385, y, { width: 70, align: 'right' });
      doc.text(formatCurrency(it.lineTotal), 460, y, { width: 85, align: 'right' });
      y += 18;
    });

    // Returned items (strikethrough style)
    if (invoiceData.returnedItems.length > 0) {
      y += 4;
      doc.fontSize(9).fillColor(gray).text('RETURNED ITEMS', 50, y);
      y += 14;
      invoiceData.returnedItems.forEach(it => {
        doc.fontSize(10).fillColor('#9CA3AF').text(it.name + (it.size ? ` (${it.size})` : '') + ' [Returned]', 50, y, { width: 270 });
        doc.text(String(it.qty), 330, y, { width: 50, align: 'right' });
        doc.text(formatCurrency(it.price), 385, y, { width: 70, align: 'right' });
        doc.fillColor('#DC2626').text(`-${formatCurrency(it.refundAmount ?? it.lineTotal)}`, 460, y, { width: 85, align: 'right' });
        y += 18;
      });
    }

    y += 8;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
    y += 12;

    // ── Totals ──
    const addRow = (label, value, bold = false, color = dark) => {
      doc.fontSize(bold ? 11 : 10).fillColor(bold ? dark : gray).text(label, 350, y, { width: 110 });
      doc.fontSize(bold ? 11 : 10).fillColor(color).text(value, 460, y, { width: 85, align: 'right' });
      y += 18;
    };

    addRow('Subtotal', formatCurrency(invoiceData.subtotal));
    if (invoiceData.shipping) addRow('Shipping', formatCurrency(invoiceData.shipping));
    if (invoiceData.tax) addRow('Tax', formatCurrency(invoiceData.tax));
    if (invoiceData.discount) addRow('Discount', `-${formatCurrency(invoiceData.discount)}`, false, '#16A34A');
    if (invoiceData.totalRefunded > 0) addRow('Refunded', `-${formatCurrency(invoiceData.totalRefunded)}`, false, '#DC2626');

    y += 4;
    doc.moveTo(350, y).lineTo(545, y).strokeColor(dark).stroke();
    y += 8;
    addRow('Grand Total', formatCurrency(invoiceData.grandTotal), true);

    // ── Footer ──
    doc.fontSize(9).fillColor(gray).text('Thank you for shopping with StyleHub.', 50, 760, { align: 'center', width: W });

    doc.end();
  });
}

async function createInvoiceFile(order, user) {
  const invoiceData = buildInvoiceData(order, user);
  const buffer = await generatePdfBuffer(invoiceData);

  const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${invoiceData.invoiceNumber}.pdf`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  const serverUrl = process.env.SERVER_URL || process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
  const invoiceUrl = `${serverUrl.replace(/\/$/, '')}/uploads/invoices/${encodeURIComponent(filename)}`;

  return { invoiceData, filePath, invoiceUrl, filename };
}

module.exports = { buildInvoiceData, generatePdfBuffer, createInvoiceFile };
