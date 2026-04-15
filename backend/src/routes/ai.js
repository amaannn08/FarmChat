import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Loan nudge keywords that trigger contextual suggestions
const SOWING_KEYWORDS = ['seed', 'sowing', 'plantation', 'biji', 'बुआई', 'बीज', 'पर्याय', 'खरीफ', 'रबी', 'kharif', 'rabi', 'fertilizer', 'khaad', 'खाद'];
const HARVEST_KEYWORDS = ['harvest', 'fasal', 'फसल', 'khatam', 'yield', 'produce', 'sell', 'market', 'mandi'];

// AI Crop Advisor
router.post('/ask', verifyToken, async (req, res) => {
  const { question, language = 'en' } = req.body;
  if (!question) return res.status(400).json({ error: 'Question required' });

  const langInstructions = {
    'hi': 'Please respond in Hindi (Devanagari script). Keep it simple and practical for farmers.',
    'pa': 'Please respond in Punjabi. Keep it simple and practical for farmers.',
    'mr': 'Please respond in Marathi. Keep it simple and practical for farmers.',
    'ta': 'Please respond in Tamil. Keep it simple and practical for farmers.',
    'te': 'Please respond in Telugu. Keep it simple and practical for farmers.',
    'bn': 'Please respond in Bengali. Keep it simple and practical for farmers.',
    'en': 'Respond in simple English suitable for farmers.',
  };

  const systemPrompt = `You are KisanBot, an expert agricultural advisor for Indian farmers. 
You have deep knowledge of:
- Indian crops: wheat, rice, cotton, sugarcane, pulses, vegetables, spices
- Pest and disease management using both chemical and organic methods
- Soil health, fertilizers (NPK), and micronutrients common in India
- Indian farming seasons: Kharif (June-Nov), Rabi (Nov-Apr), Zaid
- Government schemes: PM-KISAN, PMFBY, KCC, Soil Health Cards
- Local market prices (mandis) and MSP (Minimum Support Price)

Rules:
- Give practical, actionable advice
- Mention specific products available in India
- ${langInstructions[language] || langInstructions['en']}
- Keep responses concise (2-4 paragraphs max)
- If question is about disease, describe symptoms + remedy + prevention`;

  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo') {
      // Demo mode: return a mock response
      const mockResponses = {
        default: `Based on your query about "${question}", here is expert advice:\n\n🌱 **Soil Preparation**: Ensure proper NPK balance (recommended ratio: 120:60:40 kg/ha for most crops). Test soil pH — ideal range is 6.0-7.5 for most Indian crops.\n\n💊 **Pest Management**: For common pest control, use neem-based pesticides (Azadirachtin 0.03%). Apply in early morning or evening for best results.\n\n🌧️ **Water Management**: Ensure proper drainage. Over-irrigation is a common mistake — check soil moisture before watering.\n\n📞 Contact your nearest Krishi Vigyan Kendra (KVK) for field-specific advice.`,
      };
      
      // Check for loan nudge trigger
      const loanNudge = checkLoanNudge(question);
      
      return res.json({
        answer: mockResponses.default,
        type: 'ai',
        loan_nudge: loanNudge,
        demo_mode: true,
      });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(`${systemPrompt}\n\nFarmer's question: ${question}`);
    const answer = result.response.text();

    const loanNudge = checkLoanNudge(question);

    res.json({ answer, type: 'ai', loan_nudge: loanNudge });
  } catch (err) {
    console.error('[AI] Error:', err.message);
    res.status(500).json({ error: 'AI service temporarily unavailable', details: err.message });
  }
});

// Image-based crop disease diagnosis
router.post('/diagnose', verifyToken, async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Image required' });

  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo') {
      return res.json({
        diagnosis: `🔬 **Crop Disease Analysis** (Demo Mode)\n\n**Detected**: Early Blight (Alternaria solani) — 78% confidence\n\n**Symptoms**: Brown spots with concentric rings, yellowing around lesions, starting on lower leaves.\n\n**Treatment**:\n1. Remove affected leaves immediately\n2. Apply Mancozeb 75% WP (@ 2.5 g/L water)\n3. Or use Chlorothalonil 75% WP as alternative\n4. Spray every 7-10 days for 3 applications\n\n**Prevention**:\n- Avoid overhead irrigation\n- Maintain proper plant spacing\n- Crop rotation every season\n\n⚠️ Please consult your local KVK to confirm diagnosis.`,
        demo_mode: true,
      });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      `You are an expert plant pathologist for Indian agriculture. Analyze this crop image and provide:
1. Disease/pest name (with confidence %)
2. Visible symptoms description
3. Treatment recommendations (specific products available in India)
4. Prevention measures
Format your response clearly with headers. Be practical and specific to Indian farming context.`,
      { inlineData: { data: imageBase64, mimeType } }
    ]);

    res.json({ diagnosis: result.response.text(), type: 'diagnosis' });
  } catch (err) {
    console.error('[DIAGNOSE] Error:', err.message);
    res.status(500).json({ error: 'Diagnosis service temporarily unavailable' });
  }
});

function checkLoanNudge(text) {
  const lower = text.toLowerCase();
  if (SOWING_KEYWORDS.some(k => lower.includes(k))) {
    return {
      type: 'sowing_credit',
      title: 'Kisan Credit Card (KCC)',
      description: 'Get up to ₹3 lakh credit at 4% interest for seeds, fertilizers & pesticides.',
      cta: 'Check Eligibility',
      link: 'https://www.nabard.org/content.aspx?id=572',
    };
  }
  if (HARVEST_KEYWORDS.some(k => lower.includes(k))) {
    return {
      type: 'harvest_loan',
      title: 'Post-Harvest Loan Scheme',
      description: 'Warehouse receipt financing — store your produce & get 75% value as loan.',
      cta: 'Learn More',
      link: 'https://www.nabard.org',
    };
  }
  return null;
}

export default router;
