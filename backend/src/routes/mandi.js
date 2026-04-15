import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get mandi prices (optionally filtered by crop)
router.get('/', verifyToken, async (req, res) => {
  const { crop, state } = req.query;
  try {
    let q = `SELECT * FROM mandi_prices`;
    const params = [];
    const conditions = [];

    if (crop) {
      params.push(`%${crop}%`);
      conditions.push(`crop ILIKE $${params.length}`);
    }
    if (state) {
      params.push(`%${state}%`);
      conditions.push(`state ILIKE $${params.length}`);
    }

    if (conditions.length) q += ` WHERE ${conditions.join(' AND ')}`;
    q += ` ORDER BY fetched_at DESC`;

    const result = await query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh mandi prices from external API (or use demo data)
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    // In production: hit the Data.gov.in Agmarknet API
    // For demo: update timestamps and add slight price variations
    await query(`UPDATE mandi_prices SET 
      modal_price = modal_price * (0.97 + RANDOM() * 0.06),
      min_price = min_price * (0.97 + RANDOM() * 0.06),
      max_price = max_price * (0.97 + RANDOM() * 0.06),
      fetched_at = NOW()`
    );
    const result = await query('SELECT * FROM mandi_prices ORDER BY crop');
    res.json({ message: 'Prices refreshed', data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
