import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// List all groups (with member count + whether user has joined)
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT g.*, 
       EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $1) AS joined
       FROM groups g ORDER BY g.member_count DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get groups that the user has joined
router.get('/my', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1 ORDER BY g.member_count DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a group
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    await query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.id, req.user.id]
    );
    await query(`UPDATE groups SET member_count = member_count + 1 WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave a group
router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    await query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    await query(`UPDATE groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new group
router.post('/', verifyToken, async (req, res) => {
  const { name, description, type, tag } = req.body;
  try {
    const result = await query(
      `INSERT INTO groups (name, description, type, tag, created_by, member_count)
       VALUES ($1, $2, $3, $4, $5, 1) RETURNING *`,
      [name, description, type || 'village', tag, req.user.id]
    );
    const group = result.rows[0];
    // Auto-join creator
    await query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [group.id, req.user.id]
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group members
router.get('/:id/members', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.village, u.trust_score, u.avatar_color, u.language_pref
       FROM users u JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1 ORDER BY u.trust_score DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
