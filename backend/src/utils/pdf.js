import PDFDocument from 'pdfkit';

function fmtCurrency(amount, currency = 'CLP') {
  const prefix = currency === 'CLP' ? '$' : currency;
  return `${prefix} ${new Intl.NumberFormat('es-CL').format(Math.round(parseFloat(amount) || 0))}`;
}

// Elimina ceros decimales innecesarios: 19.00 → "19", 7.50 → "7.5"
function fmtPercent(val) {
  return parseFloat(val).toString();
}

// "Único" = se paga una sola vez | "Mensual/Anual" = cobros recurrentes
const BILLING_CONFIG = {
  unico:   { label: 'PAGO ÚNICO',   color: '#1e40af', suffix: '' },
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
  const M  = 50;
  const CW = PW - 2 * M;
  const PRIMARY = '#1e40af';
  const WHITE   = '#ffffff';
  const LIGHT   = '#f8fafc';
  const GRAY    = '#6b7280';
  const DARK    = '#111827';

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.rect(0, 0, PW, 105).fill(PRIMARY);

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
     .text(company.name || 'Mi Empresa', M, 28);

  const companyMeta = [company.rut, company.email, company.phone].filter(Boolean).join('   ·   ');
  if (companyMeta) {
    doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe')
       .text(companyMeta, M, 56, { width: CW * 0.55 });
  }
  if (company.address) {
    doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe')
       .text(company.address, M, 68, { width: CW * 0.55 });
  }

  const dateStr   = new Date(created_at).toLocaleDateString('es-CL');
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

  // ── Client block — full width, sin badge de estado ────────────────────────
  doc.rect(M, y, CW, 90).fill(LIGHT);

  doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7)
     .text('CLIENTE', M + 10, y + 9);

  // Nombre empresa en toda la línea para evitar desborde
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
     .text(client_company || '-', M + 10, y + 22, { width: CW - 20, lineBreak: false });

  // Fila 1: contacto · email
  const row1 = [client_contact, client_email].filter(Boolean).join('   ·   ');
  // Fila 2: teléfono · ciudad
  const row2 = [client_phone, client_city].filter(Boolean).join('   ·   ');

  if (row1) {
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(row1, M + 10, y + 42, { width: CW - 20 });
  }
  if (row2) {
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(row2, M + 10, y + 57, { width: CW - 20 });
  }

  // Estado de cotización como pequeña etiqueta de texto (sin cuadro)
  const statusLabel = { pendiente: 'Pendiente', aceptada: 'Aceptada', rechazada: 'Rechazada' };
  const statusColor = { pendiente: '#d97706', aceptada: '#059669', rechazada: '#dc2626' };
  doc.fillColor(statusColor[status] || '#6b7280').font('Helvetica-Bold').fontSize(8)
     .text(`Estado: ${statusLabel[status] || 'Pendiente'}`, M + 10, y + 72, { width: CW - 20 });

  y += 108;

  // ── Items table ───────────────────────────────────────────────────────────────
  const descW = CW - 165;
  const cols  = {
    desc:  M,
    qty:   M + descW,
    price: M + descW + 40,
    sub:   M + descW + 105,
  };

  doc.rect(M, y, CW, 22).fill(PRIMARY);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5);
  doc.text('DESCRIPCIÓN',  cols.desc  + 5, y + 7);
  doc.text('CANT.',         cols.qty,       y + 7, { width: 40, align: 'center' });
  doc.text('PRECIO UNIT.',  cols.price,     y + 7, { width: 65, align: 'right' });
  doc.text('SUBTOTAL',      cols.sub,       y + 7, { width: 60, align: 'right' });
  y += 22;

  // Agrupar items por tipo de cobro: único → mensual → anual
  const groups = [
    { type: 'unico',   rows: items.filter(i => !i.billing_type || i.billing_type === 'unico') },
    { type: 'mensual', rows: items.filter(i => i.billing_type === 'mensual') },
    { type: 'anual',   rows: items.filter(i => i.billing_type === 'anual') },
  ].filter(g => g.rows.length > 0);

  const hasMixed = groups.length > 1 || (groups.length === 1 && groups[0].type !== 'unico');

  let rowIndex = 0;

  groups.forEach((group, gi) => {
    const cfg = BILLING_CONFIG[group.type] || BILLING_CONFIG.unico;

    // Encabezado de sección por tipo de cobro
    if (hasMixed) {
      doc.rect(M, y, CW, 18).fill(cfg.color + '22');
      doc.fillColor(cfg.color).font('Helvetica-Bold').fontSize(8)
         .text(cfg.label, M + 8, y + 5, { width: CW - 16 });
      y += 18;
    }

    // Sub-agrupar por servicio padre (service_group)
    const subGroups = [];
    const sgMap = new Map();
    for (const item of group.rows) {
      const key = item.service_group || null;
      const mapKey = key ?? `__solo__${item.service_name}`;
      if (!sgMap.has(mapKey)) {
        sgMap.set(mapKey, subGroups.length);
        subGroups.push({ name: key, items: [] });
      }
      subGroups[sgMap.get(mapKey)].items.push(item);
    }

    subGroups.forEach(sg => {
      // Sub-encabezado por nombre de servicio (sin sangrado — va pegado a la izquierda)
      if (sg.name) {
        doc.rect(M, y, CW, 16).fill('#f1f5f9');
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5)
           .text(sg.name, M + 5, y + 5, { width: CW - 10 });
        y += 16;
      }

      const indent = sg.name ? 18 : 5; // sub-ítems sangrados si hay grupo padre
      sg.items.forEach(item => {
        // Descripción como subtítulo solo para ítems legacy sin service_group
        const subtitle = !sg.name && item.description?.trim() ? item.description.trim() : null;
        const rh = subtitle ? 36 : 22;
        doc.rect(M, y, CW, rh).fill(rowIndex % 2 === 0 ? WHITE : LIGHT);
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8.5)
           .text(item.service_name, cols.desc + indent, y + 6, { width: descW - indent - 5 });
        if (subtitle) {
          doc.fillColor(GRAY).font('Helvetica').fontSize(7.5)
             .text(subtitle, cols.desc + indent, y + 19, { width: descW - indent - 5 });
        }
        doc.fillColor(DARK).font('Helvetica').fontSize(8.5)
           .text(String(item.quantity),                   cols.qty,   y + 6, { width: 40, align: 'center' })
           .text(fmtCurrency(item.unit_price, currency),  cols.price, y + 6, { width: 65, align: 'right' })
           .text(fmtCurrency(item.subtotal,   currency),  cols.sub,   y + 6, { width: 60, align: 'right' });
        y += rh;
        rowIndex++;
      });
    });

    // Fila de subtotal por tipo (solo cuando hay múltiples tipos)
    if (hasMixed) {
      const groupTotal = group.rows.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      doc.rect(M, y, CW, 18).fill(cfg.color + '12');
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
      addRow('Subtotal pago único:', fmtCurrency(subtotal, currency));
      if (parseFloat(discount_percent) > 0) {
        addRow(`Descuento (${fmtPercent(discount_percent)}%):`, `- ${fmtCurrency(discount_amount, currency)}`, false, '#10b981');
      }
      if (parseFloat(tax_percent) > 0 && parseFloat(tax_amount) > 0) {
        addRow(`IVA (${fmtPercent(tax_percent)}%):`, fmtCurrency(tax_amount, currency));
      }
      doc.moveTo(tx, y).lineTo(M + CW, y).strokeColor(PRIMARY).lineWidth(1.5).stroke();
      y += 6;
      addRow('TOTAL PAGO ÚNICO:', fmtCurrency(total, currency), true);
      y += 8;
    }

    if (mensualGroup) {
      const mensualBase    = mensualGroup.rows.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      const mensualTaxable = mensualGroup.rows.filter(i => i.taxable !== false).reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      const mensualTax     = mensualTaxable * (parseFloat(tax_percent) / 100);
      if (mensualTax > 0) {
        doc.fillColor(GRAY).font('Helvetica').fontSize(9)
           .text('Mensual neto:', tx, y, { width: tw * 0.5 })
           .text(`${fmtCurrency(mensualBase, currency)} / mes`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
        y += 13;
        doc.fillColor(GRAY).font('Helvetica').fontSize(9)
           .text(`IVA (${fmtPercent(tax_percent)}%):`, tx, y, { width: tw * 0.5 })
           .text(`${fmtCurrency(mensualTax, currency)} / mes`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
        y += 13;
      }
      doc.fillColor(BILLING_CONFIG.mensual.color).font('Helvetica-Bold').fontSize(10)
         .text('Cobro Mensual:', tx, y, { width: tw * 0.5 })
         .text(`${fmtCurrency(mensualBase + mensualTax, currency)} / mes`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
      y += 16;
    }

    if (anualGroup) {
      const anualBase    = anualGroup.rows.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      const anualTaxable = anualGroup.rows.filter(i => i.taxable !== false).reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
      const anualTax     = anualTaxable * (parseFloat(tax_percent) / 100);
      if (anualTax > 0) {
        doc.fillColor(GRAY).font('Helvetica').fontSize(9)
           .text('Anual neto:', tx, y, { width: tw * 0.5 })
           .text(`${fmtCurrency(anualBase, currency)} / año`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
        y += 13;
        doc.fillColor(GRAY).font('Helvetica').fontSize(9)
           .text(`IVA (${fmtPercent(tax_percent)}%):`, tx, y, { width: tw * 0.5 })
           .text(`${fmtCurrency(anualTax, currency)} / año`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
        y += 13;
      }
      doc.fillColor(BILLING_CONFIG.anual.color).font('Helvetica-Bold').fontSize(10)
         .text('Cobro Anual:', tx, y, { width: tw * 0.5 })
         .text(`${fmtCurrency(anualBase + anualTax, currency)} / año`, tx + tw * 0.5, y, { width: tw * 0.5, align: 'right' });
      y += 16;
    }
  } else {
    addRow('Subtotal:', fmtCurrency(subtotal, currency));
    if (parseFloat(discount_percent) > 0) {
      addRow(`Descuento (${fmtPercent(discount_percent)}%):`, `- ${fmtCurrency(discount_amount, currency)}`, false, '#10b981');
    }
    if (parseFloat(tax_percent) > 0 && parseFloat(tax_amount) > 0) {
      addRow(`IVA (${fmtPercent(tax_percent)}%):`, fmtCurrency(tax_amount, currency));
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
