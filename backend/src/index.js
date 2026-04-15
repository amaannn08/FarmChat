import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import messageRoutes from './routes/messages.js';
import aiRoutes from './routes/ai.js';
import mandiRoutes from './routes/mandi.js';
import weatherRoutes from './routes/weather.js';
import schemeRoutes from './routes/schemes.js';
import impactRoutes from './routes/impact.js';
import { initSocket } from './socket/chatSocket.js';
import { query } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  maxHttpBufferSize: 10e6, // 10MB for voice/image blobs
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ,
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/impact', impactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'KisanSaathi API', timestamp: new Date().toISOString() });
});

// DB bootstrap
async function bootstrapDB() {
  try {
    // Run schema on first start
    const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await query(sql);
    console.log('[DB] Schema applied successfully');
  } catch (err) {
    console.warn('[DB] Schema note:', err.message.slice(0, 100));
  }
}

// Socket.IO
initSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  console.log(`\n🌾 KisanSaathi API running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready`);
  await bootstrapDB();
});

export default app;
