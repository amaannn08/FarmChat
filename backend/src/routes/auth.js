import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = express.Router();

// Mock OTP store (in production, use Redis + SMS provider)
const otpStore = new Map();

// Step 1: Request OTP or Auto-Login
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    // Check if user exists for auto-login demo behavior
    const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, phone: user.phone, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({ message: 'Welcome back!', autoLogin: true, token, user });
    }

    // Demo: accept any 10-digit number for NEW users, OTP is always 123456
    const otp = '123456';
    otpStore.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 });
    console.log(`[AUTH] OTP for ${phone}: ${otp}`);
    res.json({ message: 'OTP sent successfully', demo: true, hint: 'Use 123456' });
  } catch (err) {
    console.error('[AUTH] Send OTP Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Step 2: Verify OTP + profile setup
router.post('/verify-otp', async (req, res) => {
  const { phone, otp, name, village, state, language_pref, crops } = req.body;
  const storedOtp = otpStore.get(phone);
  
  // Demo mode: accept 123456 always
  if (otp !== '123456' && (!storedOtp || storedOtp.otp !== otp || Date.now() > storedOtp.expires)) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(phone);

  try {
    // Check if user exists
    let result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user;

    if (result.rows.length === 0) {
      // New user - create profile
      const newUser = await query(
        `INSERT INTO users (phone, name, village, state, language_pref, crops)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [phone, name || 'Kisan', village || '', state || '', language_pref || 'hi', crops || []]
      );
      user = newUser.rows[0];
    } else {
      user = result.rows[0];
      // Update profile if new info provided
      if (name || village) {
        const updated = await query(
          `UPDATE users SET name = COALESCE($1, name), village = COALESCE($2, village),
           state = COALESCE($3, state), language_pref = COALESCE($4, language_pref)
           WHERE id = $5 RETURNING *`,
          [name, village, state, language_pref, user.id]
        );
        user = updated.rows[0];
      }
    }

    // Auto-join first 2 groups for new users
    if (result.rows.length === 0) {
      const defaultGroups = await query(`SELECT id FROM groups LIMIT 2`);
      for (const g of defaultGroups.rows) {
        await query(
          `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [g.id, user.id]
        );
      }
      await query(`UPDATE groups SET member_count = member_count + 1 WHERE id IN (SELECT id FROM groups LIMIT 2)`);
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('[AUTH] Error:', err.message);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
});

export default router;
