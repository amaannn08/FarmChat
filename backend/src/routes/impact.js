import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Aggregated impact metrics for investors/NGOs
router.get('/', verifyToken, async (req, res) => {
  try {
    // Real counts from DB
    const [usersRes, msgsRes, groupsRes, votesRes, nudgesRes] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM messages'),
      query('SELECT COUNT(*) as total FROM groups'),
      query('SELECT COUNT(*) as total FROM reputation_votes'),
      query('SELECT COUNT(*) as total FROM micro_loan_nudges WHERE clicked = true'),
    ]);

    // Time-series: messages per day (last 7 days)
    const timelineRes = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM messages
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Message type breakdown
    const typeRes = await query(`
      SELECT type, COUNT(*) as count FROM messages GROUP BY type
    `);

    // Top states by user count
    const stateRes = await query(`
      SELECT state, COUNT(*) as farmers
      FROM users WHERE state IS NOT NULL AND state != ''
      GROUP BY state ORDER BY farmers DESC LIMIT 6
    `);

    // Crop diversity
    const cropRes = await query(`
      SELECT unnest(crops) as crop, COUNT(*) as count
      FROM users WHERE crops IS NOT NULL AND array_length(crops, 1) > 0
      GROUP BY crop ORDER BY count DESC LIMIT 8
    `);

    res.json({
      summary: {
        total_farmers: parseInt(usersRes.rows[0].total),
        total_messages: parseInt(msgsRes.rows[0].total),
        active_groups: parseInt(groupsRes.rows[0].total),
        peer_endorsements: parseInt(votesRes.rows[0].total),
        loan_nudges_clicked: parseInt(nudgesRes.rows[0].total),
        avg_messages_per_farmer: usersRes.rows[0].total > 0
          ? (parseInt(msgsRes.rows[0].total) / parseInt(usersRes.rows[0].total)).toFixed(1)
          : 0,
      },
      timeline: timelineRes.rows,
      message_types: typeRes.rows,
      states: stateRes.rows,
      crop_diversity: cropRes.rows,
      // Demo data for charts if DB is sparse
      demo_timeline: generateDemoTimeline(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateDemoTimeline() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      messages: Math.floor(80 + Math.random() * 120 + (30 - i) * 3),
      ai_queries: Math.floor(15 + Math.random() * 30 + (30 - i)),
      active_users: Math.floor(20 + Math.random() * 40 + (30 - i) * 0.8),
      loan_nudges: Math.floor(3 + Math.random() * 12),
    });
  }
  return data;
}

export default router;
