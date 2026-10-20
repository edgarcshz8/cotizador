import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM company_settings WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  const { name, rut, email, phone, address, website, currency, tax_percent, quote_valid_days, footer_text } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE company_settings
       SET name=$1, rut=$2, email=$3, phone=$4, address=$5,
           website=$6, currency=$7, tax_percent=$8, quote_valid_days=$9, footer_text=$10
       WHERE id=1 RETURNING *`,
      [name, rut, email, phone, address, website, currency, tax_percent, quote_valid_days, footer_text]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
