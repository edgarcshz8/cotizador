import { Router } from 'express';
import { pool } from '../db/index.js';
import { generatePDF } from '../utils/pdf.js';

const router = Router();

async function nextQuoteNumber() {
  const year = new Date().getFullYear();
  const start = parseInt(process.env.QUOTE_START || '0');
  const { rows } = await pool.query(
    `SELECT MAX(CAST(SPLIT_PART(quote_number, '-', 3) AS INTEGER)) AS max_seq
     FROM quotes WHERE quote_number LIKE $1`,
    [`COT-${year}-%`]
  );
  const maxSeq = rows[0].max_seq ?? 0;
  const seq = Math.max(maxSeq, start) + 1;
  return `COT-${year}-${String(seq).padStart(4, '0')}`;
}

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM quotes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quote = await pool.query('SELECT * FROM quotes WHERE id = $1', [req.params.id]);
    if (!quote.rows[0]) return res.status(404).json({ error: 'Not found' });
    const items = await pool.query(
      'SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id',
      [req.params.id]
    );
    res.json({ ...quote.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const {
    client_company, client_contact, client_email, client_phone, client_city,
    items = [], discount_percent = 0, tax_percent = 0,
    notes, currency = 'CLP', valid_days = 30,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Discount and IVA apply only to one-time (unico) items; recurring items are shown separately
    const unicoItems = items.filter(i => !i.billing_type || i.billing_type === 'unico');
    const subtotal = unicoItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const discountAmt = subtotal * (discount_percent / 100);
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = afterDiscount * (tax_percent / 100);
    const total = afterDiscount + taxAmt;
    const quoteNumber = await nextQuoteNumber();

    const { rows: [quote] } = await client.query(
      `INSERT INTO quotes
         (quote_number, client_company, client_contact, client_email, client_phone, client_city,
          subtotal, discount_percent, discount_amount, tax_percent, tax_amount,
          total, notes, currency, valid_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [quoteNumber, client_company, client_contact || null, client_email || null, client_phone || null, client_city || null,
       subtotal, discount_percent, discountAmt, tax_percent, taxAmt,
       total, notes, currency, valid_days]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO quote_items
           (quote_id, service_id, service_name, service_group, description, quantity, unit_price, subtotal, billing_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [quote.id, item.service_id || null,
         item.service_name,
         item.service_group || null,
         item.description || '',
         item.quantity, item.unit_price,
         item.quantity * item.unit_price,
         item.billing_type || 'unico']
      );
    }

    await client.query('COMMIT');
    res.status(201).json(quote);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE quotes SET status = $1 WHERE id = $2 RETURNING *',
      [req.body.status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const quote = await pool.query('SELECT * FROM quotes WHERE id = $1', [req.params.id]);
    if (!quote.rows[0]) return res.status(404).json({ error: 'Not found' });

    const items = await pool.query(
      'SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id',
      [req.params.id]
    );
    const settings = await pool.query('SELECT * FROM company_settings WHERE id = 1');
    const quoteData = {
      ...quote.rows[0],
      items: items.rows,
      company: settings.rows[0] || {},
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cotizacion-${quote.rows[0].quote_number}.pdf"`
    );
    generatePDF(quoteData).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
