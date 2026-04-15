import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : 
       process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] ${duration}ms — ${text.slice(0, 60)}`);
    }
    return res;
  } catch (err) {
    console.error('[DB Error]', err.message, '\nQuery:', text);
    throw err;
  }
};

export const getClient = () => pool.connect();

export default pool;
