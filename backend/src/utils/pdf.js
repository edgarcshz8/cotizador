import PDFDocument from 'pdfkit';

function fmtCurrency(amount, currency = 'CLP') {
  return `${currency} ${new Intl.NumberFormat('es-CL').format(Math.round(parseFloat(amount) || 0))}`;
}

export function generatePDF(data) {
  const {
    quote_number, client_name, client_company, client_email, client_phone,
    items = [], subtotal, discount_percent, discount_amount,
    tax_percent, tax_amount, total, notes, currency,
    valid_days, created_at, status, company = {},
  } = data;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const PW = doc.page.width;
  const M = 50;
  const CW = PW - 2 * M;
  const PRIMARY = '#1e40af';
  const WHITE = '#ffffff';
  const LIGHT = '#f8fafc';
  const GRAY = '#6b7280';
  const DARK = '#111827';

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.rect(0, 0, PW, 105).fill(PRIMARY);

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
     .text(company.name || 'Mi Empresa', M, 28);

  const companyMeta = [company.rut, company.email, company.phone]
    .filter(Boolean).join('   ·   ');
  if (companyMeta) {
    doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe')
       .text(companyMeta, M, 56, { width: CW * 0.55 });
  }
  if (company.address) {
    doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe')
       .text(company.address, M, 68, { width: CW * 0.55 });
  }

  const dateStr = new Date(created_at).toLocaleDateString('es-CL');
  const validDate = new Date(
    new Date(created_at).getTime() + (valid_days || 30) * 86400000
  ).toLocaleDateString('es-CL');

  const rx = PW - M - 145;
  doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe').text('COTIZACIÓN', rx, 28);
  doc.font('Helvetica-Bold').fontSize(16).fillColor(WHITE).text(quote_number, rx, 42);
  doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe')
     .text(`Emisión: ${dateStr}`, rx, 68)
     .text(`Válida hasta: ${validDate}`, rx, 80);

  let y = 125;

  // ── Client block ─────────────────────────────────────────────────────────────
  doc.rect(M, y, CW * 0.60, 72).fill(LIGHT);

  doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7)
     .text('CLIENTE', M + 10, y + 9);

  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
     .text(client_name, M + 10, y + 22, { width: CW * 0.55 });

  let cy = y + 38;
  const clientMeta = [client_company, client_email, client_phone].filter(Boolean);
  clientMeta.forEach(line => {
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5).text(line, M + 10, cy, { width: CW * 0.55 });
    cy += 13;
  });

  // Status badge
  const statusMap = { pendiente: '#f59e0b', aceptada: '#10b981', rechazada: '#ef4444' };
  const badgeColor = statusMap[status] || '#6b7280';
  doc.rect(M + CW * 0.65, y + 20, 110, 26).fill(badgeColor);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
     .text((status || 'pendiente').toUpperCase(), M + CW * 0.65, y + 28, { width: 110, align: 'center' });

  y += 92;

  // ── Items table ───────────────────────────────────────────────────────────────
  const descW = CW - 165;
  const cols = {
    desc: M,
    qty:  M + descW,
    price: M + descW + 40,
    sub:  M + descW + 105,
  };

  doc.rect(M, y, CW, 22).fill(PRIMARY);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5);
  doc.text('DESCRIPCIÓN',   cols.desc  + 5, y + 7);
  doc.text('CANT.',          cols.qty,       y + 7, { width: 40,  align: 'center' });
  doc.text('PRECIO UNIT.',   cols.price,     y + 7, { width: 65,  align: 'right' });
  doc.text('SUBTOTAL',       cols.sub,       y + 7, { width: 60,  align: 'right' });
  y += 22;

  items.forEach((item, i) => {
    const hasDesc = item.description && item.description.trim();
    const rh = hasDesc ? 36 : 22;
    doc.rect(M, y, CW, rh).fill(i % 2 === 0 ? WHITE : LIGHT);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8.5)
       .text(item.service_name, cols.desc + 5, y + 6, { width: descW - 10 });
    if (hasDesc) {
      doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
         .text(item.description, cols.desc + 5, y + 19, { width: descW - 10 });
    }
    doc.fillColor(DARK).font('Helvetica').fontSize(8.5)
       .text(String(item.quantity),                       cols.qty,   y + 6, { width: 40, align: 'center' })
       .text(fmtCurrency(item.unit_price, currency),      cols.price, y + 6, { width: 65, align: 'right' })
       .text(fmtCurrency(item.subtotal, currency),        cols.sub,   y + 6, { width: 60, align: 'right' });
    y += rh;
  });

  doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
  y += 15;

  // ── Totals ────────────────────────────────────────────────────────────────────
  const tx = M + CW * 0.52;
  const tw = CW * 0.48;

  const addRow = (label, value, bold = false, valueColor = DARK) => {
    doc.fillColor(bold ? PRIMARY : GRAY)
       .font(bold ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(bold ? 11 : 9)
       .text(label, tx, y, { width: tw * 0.5 });
    doc.fillColor(bold ? PRIMARY : valueColor)
       .text(value, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
    y += bold ? 18 : 14;
  };

  addRow('Subtotal:', fmtCurrency(subtotal, currency));
  if (parseFloat(discount_percent) > 0) {
    addRow(`Descuento (${discount_percent}%):`, `- ${fmtCurrency(discount_amount, currency)}`, false, '#10b981');
  }
  if (parseFloat(tax_percent) > 0) {
    addRow(`IVA (${tax_percent}%):`, fmtCurrency(tax_amount, currency));
  }
  doc.moveTo(tx, y).lineTo(M + CW, y).strokeColor(PRIMARY).lineWidth(1.5).stroke();
  y += 6;
  addRow('TOTAL:', fmtCurrency(total, currency), true);
  y += 10;

  // ── Notes ─────────────────────────────────────────────────────────────────────
  if (notes && notes.trim()) {
    doc.rect(M, y, CW, 52).fill('#fffbeb');
    doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(8).text('NOTAS:', M + 10, y + 9);
    doc.fillColor('#78350f').font('Helvetica').fontSize(8.5)
       .text(notes.trim(), M + 10, y + 22, { width: CW - 20 });
    y += 62;
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footerY = doc.page.height - 42;
  doc.rect(0, footerY, PW, 42).fill('#1e3a5f');
  doc.fillColor('#93c5fd').font('Helvetica').fontSize(8).text(
    company.footer_text || 'Gracias por su preferencia. Esta cotización es válida por el período indicado.',
    M, footerY + 15,
    { width: CW, align: 'center' }
  );

  doc.end();
  return doc;
}
