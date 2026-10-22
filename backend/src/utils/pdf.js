import PDFDocument from 'pdfkit';

function fmtCurrency(amount, currency = 'CLP') {
  return `${currency} ${new Intl.NumberFormat('es-CL').format(Math.round(parseFloat(amount) || 0))}`;
}

const BILLING_CONFIG = {
  unico:   { label: 'PAGO INICIAL',  color: '#1e40af', suffix: '' },
  mensual: { label: 'COBRO MENSUAL', color: '#059669', suffix: ' / mes' },
  anual:   { label: 'COBRO ANUAL',   color: '#d97706', suffix: ' / año' },
};

export function generatePDF(data) {
  const {
    quote_number, client_company, client_contact, client_email, client_phone, client_city,
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
     .text(client_company, M + 10, y + 22, { width: CW * 0.55 });

  let cy = y + 38;
  const clientMeta = [client_contact, client_email, client_phone, client_city].filter(Boolean);
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
    desc:  M,
    qty:   M + descW,
    price: M + descW + 40,
    sub:   M + descW + 105,
  };

  // Table header
  doc.rect(M, y, CW, 22).fill(PRIMARY);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5);
  doc.text('DESCRIPCIÓN',  cols.desc  + 5, y + 7);
  doc.text('CANT.',         cols.qty,       y + 7, { width: 40,  align: 'center' });
  doc.text('PRECIO UNIT.',  cols.price,     y + 7, { width: 65,  align: 'right' });
  doc.text('SUBTOTAL',      cols.sub,       y + 7, { width: 60,  align: 'right' });
  y += 22;

  // Group items: unico → mensual → anual
  const groups = [
    { type: 'unico',   rows: items.filter(i => !i.billing_type || i.billing_type === 'unico') },
    { type: 'mensual', rows: items.filter(i => i.billing_type === 'mensual') },
    { type: 'anual',   rows: items.filter(i => i.billing_type === 'anual') },
  ].filter(g => g.rows.length > 0);

  const hasMixed = groups.length > 1 ||
    (groups.length === 1 && groups[0].type !== 'unico');

  let rowIndex = 0;

  groups.forEach((group, gi) => {
    const cfg = BILLING_CONFIG[group.type] || BILLING_CONFIG.unico;

    if (hasMixed) {
      // Colored section header
      doc.rect(M, y, CW, 17).fill(cfg.color + '18');
      doc.fillColor(cfg.color).font('Helvetica-Bold').fontSize(7.5)
         .text(cfg.label, M + 8, y + 5, { width: CW - 16 });
      y += 17;
    }

    group.rows.forEach(item => {
      // subtitle: service_group (parent service name) takes priority over description
      const subtitle = (item.service_group && item.service_group.trim())
        ? item.service_group.trim()
        : (item.description && item.description.trim() ? item.description.trim() : null);
      const rh = subtitle ? 36 : 22;
      doc.rect(M, y, CW, rh).fill(rowIndex % 2 === 0 ? WHITE : LIGHT);
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8.5)
         .text(item.service_name, cols.desc + 5, y + 6, { width: descW - 10 });
      if (subtitle) {
        doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
           .text(subtitle, cols.desc + 5, y + 19, { width: descW - 10 });
      }
      doc.fillColor(DARK).font('Helvetica').fontSize(8.5)
         .text(String(item.quantity),                       cols.qty,   y + 6, { width: 40, align: 'center' })
         .text(fmtCurrency(item.unit_price, currency),      cols.price, y + 6, { width: 65, align: 'right' })
         .text(fmtCurrency(item.subtotal, currency),        cols.sub,   y + 6, { width: 60, align: 'right' });
      y += rh;
      rowIndex++;
    });

    // Group subtotal row (only when mixed)
    if (hasMixed) {
      const groupTotal = group.rows.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      doc.rect(M, y, CW, 18).fill(cfg.color + '10');
      doc.fillColor(cfg.color).font('Helvetica-Bold').fontSize(8)
         .text(
           `Subtotal ${cfg.label.toLowerCase()}:   ${fmtCurrency(groupTotal, currency)}${cfg.suffix}`,
           M + 5, y + 5,
           { width: CW - 10, align: 'right' }
         );
      y += 18;
    }

    if (gi < groups.length - 1) y += 4;
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

  if (hasMixed) {
    const unicoGroup   = groups.find(g => g.type === 'unico');
    const mensualGroup = groups.find(g => g.type === 'mensual');
    const anualGroup   = groups.find(g => g.type === 'anual');

    if (unicoGroup) {
      addRow('Subtotal pago inicial:', fmtCurrency(subtotal, currency));
      if (parseFloat(discount_percent) > 0) {
        addRow(`Descuento (${discount_percent}%):`, `- ${fmtCurrency(discount_amount, currency)}`, false, '#10b981');
      }
      if (parseFloat(tax_percent) > 0) {
        addRow(`IVA (${tax_percent}%):`, fmtCurrency(tax_amount, currency));
      }
      doc.moveTo(tx, y).lineTo(M + CW, y).strokeColor(PRIMARY).lineWidth(1.5).stroke();
      y += 6;
      addRow('TOTAL PAGO INICIAL:', fmtCurrency(total, currency), true);
      y += 8;
    }

    if (mensualGroup) {
      const mensualTotal = mensualGroup.rows.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      doc.fillColor(BILLING_CONFIG.mensual.color).font('Helvetica-Bold').fontSize(10)
         .text('Cobro Mensual:', tx, y, { width: tw * 0.5 })
         .text(`${fmtCurrency(mensualTotal, currency)} / mes`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
      y += 16;
    }

    if (anualGroup) {
      const anualTotal = anualGroup.rows.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      doc.fillColor(BILLING_CONFIG.anual.color).font('Helvetica-Bold').fontSize(10)
         .text('Cobro Anual:', tx, y, { width: tw * 0.5 })
         .text(`${fmtCurrency(anualTotal, currency)} / año`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
      y += 16;
    }
  } else {
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
  }

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
