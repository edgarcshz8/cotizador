import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM services WHERE active = true ORDER BY category, name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY category, name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, description, unit_price, unit_label, category, billing_type } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO services (name, description, unit_price, unit_label, category, billing_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, unit_price, unit_label || 'unidad', category || 'Otro', billing_type || 'unico']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, unit_price, unit_label, category, active, billing_type } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE services
       SET name=$1, description=$2, unit_price=$3, unit_label=$4, category=$5, active=$6, billing_type=$7
       WHERE id=$8 RETURNING *`,
      [name, description, unit_price, unit_label, category, active, billing_type || 'unico', id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE services SET active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
