import jwt from 'jsonwebtoken';
import { query } from '../db.js';

// Misinformation / moderation keywords
const FLAGGED_KEYWORDS = [
  'fake medicine', 'banned pesticide', 'मिलावट', 'नकली', 
  'guaranteed profit', 'पक्का मुनाफा', 'free land',
  'no need doctor', 'avoid hospital',
];

const SOWING_TRIGGERS = ['seed', 'sowing', 'बुआई', 'बीज', 'kharif', 'rabi', 'plant', 'fertilizer'];
const HARVEST_TRIGGERS = ['harvest', 'fasal', 'फसल', 'yield', 'sell', 'mandi', 'बेचना'];

export function initSocket(io) {
  // Auth middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.user.name} (${socket.user.id})`);

    // Join chat group room
    socket.on('join_group', async ({ groupId }) => {
      socket.join(groupId);
      socket.to(groupId).emit('user_joined', {
        userId: socket.user.id,
        name: socket.user.name,
        groupId,
      });
    });

    // Leave group room
    socket.on('leave_group', ({ groupId }) => {
      socket.leave(groupId);
    });

    // Send a message
    socket.on('send_message', async (data) => {
      const { groupId, content, type = 'text', mediaUrl, replyTo } = data;
      if (!groupId || (!content && !mediaUrl)) return;

      try {
        // Check for moderation flags
        const lower = (content || '').toLowerCase();
        const isFlagged = FLAGGED_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
        const flagReason = isFlagged ? 'Contains potentially misleading agricultural information' : null;

        // Check for loan nudge trigger
        const loanNudge = detectLoanNudge(content || '');

        // Persist message
        const result = await query(
          `INSERT INTO messages (group_id, sender_id, content, type, media_url, is_flagged, flag_reason, loan_nudge_data, reply_to)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [groupId, socket.user.id, content, type, mediaUrl || null, isFlagged, flagReason,
           loanNudge ? JSON.stringify(loanNudge) : null, replyTo || null]
        );

        const msg = result.rows[0];

        // Fetch sender info
        const userRes = await query(
          `SELECT name, avatar_color, trust_score FROM users WHERE id = $1`,
          [socket.user.id]
        );
        const sender = userRes.rows[0];

        const fullMsg = {
          ...msg,
          sender_name: sender.name,
          avatar_color: sender.avatar_color,
          trust_score: sender.trust_score,
          upvotes: 0,
          user_voted: false,
        };

        // Broadcast to room
        io.to(groupId).emit('new_message', fullMsg);

        // If moderated, emit a flag warning to the room
        if (isFlagged) {
          setTimeout(() => {
            io.to(groupId).emit('moderation_alert', {
              messageId: msg.id,
              reason: flagReason,
            });
          }, 1500);
        }

        // If loan nudge triggered, send to sender's socket
        if (loanNudge) {
          socket.emit('loan_nudge', { ...loanNudge, messageId: msg.id });
          // Save to DB
          await query(
            `INSERT INTO micro_loan_nudges (user_id, message_id, nudge_type) VALUES ($1, $2, $3)`,
            [socket.user.id, msg.id, loanNudge.type]
          );
        }

      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', ({ groupId }) => {
      socket.to(groupId).emit('user_typing', { userId: socket.user.id, name: socket.user.name, groupId });
    });

    socket.on('stop_typing', ({ groupId }) => {
      socket.to(groupId).emit('user_stop_typing', { userId: socket.user.id, groupId });
    });

    // Upvote a message
    socket.on('upvote_message', async ({ messageId, groupId }) => {
      try {
        const msgRes = await query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
        if (!msgRes.rows.length) return;
        const targetUserId = msgRes.rows[0].sender_id;
        if (targetUserId === socket.user.id) return;

        await query(
          `INSERT INTO reputation_votes (message_id, voter_id, target_user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [messageId, socket.user.id, targetUserId]
        );
        await query(`UPDATE users SET trust_score = trust_score + 1 WHERE id = $1`, [targetUserId]);

        const countRes = await query(
          `SELECT COUNT(*) as upvotes FROM reputation_votes WHERE message_id = $1`,
          [messageId]
        );
        io.to(groupId).emit('message_upvoted', {
          messageId,
          upvotes: parseInt(countRes.rows[0].upvotes),
          targetUserId,
        });
      } catch (err) {
        console.error('[Socket] upvote error:', err.message);
      }
    });

    // Expert handoff request
    socket.on('request_expert', async ({ groupId, query: q }) => {
      io.to(groupId).emit('expert_requested', {
        userId: socket.user.id,
        name: socket.user.name,
        query: q,
        timestamp: new Date().toISOString(),
      });
      // Also send to expert group
      socket.to('expert-group').emit('expert_needed', {
        fromGroup: groupId,
        farmer: socket.user.name,
        query: q,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.user.name}`);
    });
  });
}

function detectLoanNudge(text) {
  const lower = text.toLowerCase();
  if (SOWING_TRIGGERS.some(k => lower.includes(k))) {
    return {
      type: 'sowing_credit',
      title: '💰 Kisan Credit Card Available',
      description: 'Need funds for seeds & fertilizers? Get KCC at just 4% interest — up to ₹3 lakh.',
      cta: 'Check Eligibility',
      link: 'https://www.nabard.org/content.aspx?id=572',
    };
  }
  if (HARVEST_TRIGGERS.some(k => lower.includes(k))) {
    return {
      type: 'harvest_loan',
      title: '🏦 Post-Harvest Financing',
      description: 'Store in warehouse & get 75% of your produce value as immediate credit.',
      cta: 'Apply Now',
      link: 'https://www.nabard.org',
    };
  }
  return null;
}
