-- KisanSaathi Database Schema
-- Run this against your NeonDB instance

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (farmer profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  village VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  language_pref VARCHAR(10) DEFAULT 'hi',
  trust_score INTEGER DEFAULT 0,
  crops TEXT[], -- array of crop types they grow
  avatar_color VARCHAR(7) DEFAULT '#16a34a',
  is_expert BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat groups (village or crop-type based)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'village', -- 'village' | 'crop' | 'fpo' | 'expert'
  tag VARCHAR(50), -- e.g. 'wheat', 'rice', 'cotton'
  member_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group membership
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT,
  type VARCHAR(20) DEFAULT 'text', -- 'text' | 'voice' | 'image' | 'ai' | 'loan_nudge' | 'mandi' | 'scheme'
  media_url TEXT,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  loan_nudge_data JSONB,
  reply_to UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reputation / upvotes on messages
CREATE TABLE IF NOT EXISTS reputation_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, voter_id)
);

-- Mandi prices (local cache)
CREATE TABLE IF NOT EXISTS mandi_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop VARCHAR(100) NOT NULL,
  market VARCHAR(150) NOT NULL,
  state VARCHAR(100),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  modal_price DECIMAL(10,2),
  unit VARCHAR(20) DEFAULT 'quintal',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government schemes
CREATE TABLE IF NOT EXISTS government_schemes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'insurance' | 'loan' | 'subsidy' | 'pmkisan'
  deadline DATE,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Micro-loan nudge records
CREATE TABLE IF NOT EXISTS micro_loan_nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  message_id UUID REFERENCES messages(id),
  nudge_type VARCHAR(50), -- 'sowing_credit' | 'harvest_loan' | 'equipment'
  clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impact metrics (aggregated daily)
CREATE TABLE IF NOT EXISTS impact_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  active_farmers INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  ai_queries INTEGER DEFAULT 0,
  loan_nudges_clicked INTEGER DEFAULT 0,
  scheme_alerts_viewed INTEGER DEFAULT 0,
  image_diagnoses INTEGER DEFAULT 0,
  state VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: Default groups
INSERT INTO groups (name, description, type, tag) VALUES
  ('🌾 Wheat Farmers Forum', 'Group for wheat growers across India', 'crop', 'wheat'),
  ('🍚 Rice & Paddy Network', 'Paddy growers share tips and prices', 'crop', 'rice'),
  ('🌿 Organic Farming Circle', 'Chemical-free farming discussions', 'crop', 'organic'),
  ('💧 Maharashtra Farmers', 'Village network for Maharashtra region', 'village', 'maharashtra'),
  ('🌱 Punjab Kisan Sabha', 'Punjab farmers collective', 'village', 'punjab'),
  ('🏪 FPO Marketplace', 'Buy/sell seeds and inputs via FPOs', 'fpo', 'marketplace'),
  ('👨‍🌾 Expert Helpdesk', 'Connect with agronomists', 'expert', 'expert')
ON CONFLICT DO NOTHING;

-- Seed: Government schemes
INSERT INTO government_schemes (title, description, category, deadline, link) VALUES
  ('PM-KISAN Samman Nidhi', 'Rs. 6,000 per year direct income support for small and marginal farmers. Register on PM-KISAN portal.', 'pmkisan', '2024-12-31', 'https://pmkisan.gov.in'),
  ('Pradhan Mantri Fasal Bima Yojana', 'Crop insurance scheme covering losses due to natural calamities, pests and diseases.', 'insurance', '2024-07-31', 'https://pmfby.gov.in'),
  ('Kisan Credit Card (KCC)', 'Short-term credit for crop cultivation at subsidised interest rates. Apply at nearest bank.', 'loan', NULL, 'https://www.paisabazaar.com/kisan-credit-card/'),
  ('Soil Health Card Scheme', 'Free soil testing and recommendations. Visit nearest Krishi Vigyan Kendra.', 'subsidy', NULL, 'https://soilhealth.dac.gov.in'),
  ('PM Krishi Sinchai Yojana', 'Irrigation subsidy — drip and sprinkler systems at 55-75% subsidy.', 'subsidy', '2024-09-30', 'https://pmksy.gov.in')
ON CONFLICT DO NOTHING;

-- Seed: Mandi prices
INSERT INTO mandi_prices (crop, market, state, min_price, max_price, modal_price) VALUES
  ('Wheat', 'Azadpur, Delhi', 'Delhi', 2150, 2350, 2250),
  ('Rice (Common)', 'Amritsar', 'Punjab', 1800, 2100, 1950),
  ('Cotton', 'Yavatmal', 'Maharashtra', 6200, 6800, 6500),
  ('Soybean', 'Indore', 'Madhya Pradesh', 4200, 4600, 4400),
  ('Tomato', 'Nashik', 'Maharashtra', 800, 1400, 1100),
  ('Onion', 'Lasalgaon', 'Maharashtra', 1200, 1800, 1500),
  ('Potato', 'Agra', 'Uttar Pradesh', 600, 900, 750),
  ('Maize', 'Davangere', 'Karnataka', 1700, 1950, 1820),
  ('Sugarcane', 'Kolhapur', 'Maharashtra', 285, 295, 290),
  ('Mustard', 'Jaipur', 'Rajasthan', 5100, 5500, 5300)
ON CONFLICT DO NOTHING;
