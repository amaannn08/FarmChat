import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a group (paginated)
router.get('/:groupId', verifyToken, async (req, res) => {
  const { groupId } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before; // cursor pagination

  try {
    let q = `
      SELECT m.*, 
             u.name as sender_name, u.avatar_color, u.trust_score,
             (SELECT COUNT(*) FROM reputation_votes rv WHERE rv.message_id = m.id) AS upvotes,
             EXISTS(SELECT 1 FROM reputation_votes rv WHERE rv.message_id = m.id AND rv.voter_id = $2) AS user_voted
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.group_id = $1
    `;
    const params = [groupId, req.user.id];

    if (before) {
      q += ` AND m.created_at < $3`;
      params.push(before);
    }
    q += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(q, params);
    res.json(result.rows.reverse()); // Oldest first
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upvote a message
router.post('/:messageId/upvote', verifyToken, async (req, res) => {
  const { messageId } = req.params;
  try {
    // Get target user
    const msgResult = await query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
    if (!msgResult.rows.length) return res.status(404).json({ error: 'Message not found' });
    const targetUserId = msgResult.rows[0].sender_id;

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot upvote your own message' });
    }

    await query(
      `INSERT INTO reputation_votes (message_id, voter_id, target_user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [messageId, req.user.id, targetUserId]
    );
    // Increment trust score
    await query(
      `UPDATE users SET trust_score = trust_score + 1 WHERE id = $1`,
      [targetUserId]
    );
    const countResult = await query(
      `SELECT COUNT(*) as upvotes FROM reputation_votes WHERE message_id = $1`,
      [messageId]
    );
    res.json({ upvotes: parseInt(countResult.rows[0].upvotes) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark loan nudge as clicked
router.post('/nudge/:nudgeId/click', verifyToken, async (req, res) => {
  try {
    await query(`UPDATE micro_loan_nudges SET clicked = true WHERE id = $1`, [req.params.nudgeId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
