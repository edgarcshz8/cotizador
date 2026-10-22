import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

const withComponents = `
  SELECT s.*,
    COALESCE(
      json_agg(
        json_build_object(
          'id',           sc.id,
          'name',         sc.name,
          'unit_price',   sc.unit_price,
          'billing_type', sc.billing_type,
          'sort_order',   sc.sort_order
        ) ORDER BY sc.sort_order, sc.name
      ) FILTER (WHERE sc.id IS NOT NULL),
      '[]'::json
    ) AS components
  FROM services s
  LEFT JOIN service_components sc ON sc.service_id = s.id
`;

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      withComponents + ' WHERE s.active = true GROUP BY s.id ORDER BY s.category, s.name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (_req, res) => {
  try {
    const { rows } = await pool.query(withComponents + ' GROUP BY s.id ORDER BY s.category, s.name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function upsertComponents(client, serviceId, components) {
  await client.query('DELETE FROM service_components WHERE service_id = $1', [serviceId]);
  for (const [i, comp] of components.entries()) {
    await client.query(
      `INSERT INTO service_components (service_id, name, unit_price, billing_type, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [serviceId, comp.name, parseFloat(comp.unit_price) || 0, comp.billing_type || 'unico', i]
    );
  }
}

router.post('/', async (req, res) => {
  const { name, description, unit_price, unit_label, category, billing_type, components = [] } = req.body;
  const cl = await pool.connect();
  try {
    await cl.query('BEGIN');
    const basePrice = components.length > 0 ? 0 : (parseFloat(unit_price) || 0);
    const { rows: [service] } = await cl.query(
      `INSERT INTO services (name, description, unit_price, unit_label, category, billing_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, basePrice, unit_label || 'proyecto', category || 'Otro', billing_type || 'unico']
    );
    await upsertComponents(cl, service.id, components);
    await cl.query('COMMIT');
    const { rows } = await pool.query(withComponents + ' WHERE s.id = $1 GROUP BY s.id', [service.id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await cl.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    cl.release();
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, unit_price, unit_label, category, active, billing_type, components = [] } = req.body;
  const cl = await pool.connect();
  try {
    await cl.query('BEGIN');
    const basePrice = components.length > 0 ? 0 : (parseFloat(unit_price) || 0);
    await cl.query(
      `UPDATE services
       SET name=$1, description=$2, unit_price=$3, unit_label=$4, category=$5, active=$6, billing_type=$7
       WHERE id=$8`,
      [name, description, basePrice, unit_label, category, active, billing_type || 'unico', id]
    );
    await upsertComponents(cl, id, components);
    await cl.query('COMMIT');
    const { rows } = await pool.query(withComponents + ' WHERE s.id = $1 GROUP BY s.id', [id]);
    res.json(rows[0]);
  } catch (err) {
    await cl.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    cl.release();
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
