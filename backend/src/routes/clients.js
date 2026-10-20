import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rut/:rut', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE LOWER(REPLACE(rut, \'.\', \'\')) = LOWER(REPLACE($1, \'.\', \'\'))',
      [req.params.rut]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { rut, name, company, email, phone, address } = req.body;
  if (!rut?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'RUT y nombre son obligatorios' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO clients (rut, name, company, email, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [rut.trim(), name.trim(), company || null, email || null, phone || null, address || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un cliente con ese RUT' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { rut, name, company, email, phone, address } = req.body;
  if (!rut?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'RUT y nombre son obligatorios' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE clients SET rut=$1, name=$2, company=$3, email=$4, phone=$5, address=$6
       WHERE id=$7 RETURNING *`,
      [rut.trim(), name.trim(), company || null, email || null, phone || null, address || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un cliente con ese RUT' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
