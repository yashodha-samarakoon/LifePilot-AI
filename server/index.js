import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const API_VERSION = 'v1beta';
const ENDPOINT = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${GEMINI_MODEL}:generateContent`;

if (!GEMINI_API_KEY) {
  console.error('[Server] GEMINI_API_KEY is not set. Please add it to your .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
});

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Health check endpoint.
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: GEMINI_MODEL, endpoint: ENDPOINT, apiVersion: API_VERSION });
});

/**
 * List available Gemini models.
 */
app.get('/api/models', async (_req, res) => {
  const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models?key=${GEMINI_API_KEY}&pageSize=100`;
  try {
    console.log('[Gemini] Listing models from:', url.split('?')[0]);
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      console.error('[Gemini] List models error:', data);
      return res.status(response.status).json({ type: 'error', error: data });
    }
    return res.json(data);
  } catch (err) {
    console.error('[Gemini] List models failed:', err);
    return res.status(500).json({ type: 'error', error: err.message });
  }
});

/**
 * Chat endpoint used by the LifePilot AI Companion.
 */
app.post('/api/chat', async (req, res) => {
  const { message, context, history = [] } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      type: 'error',
      content: 'No message provided.',
      actions: [],
    });
  }

  console.log('[Gemini] Received message:', message);
  console.log('[Gemini] User context:', JSON.stringify(context, null, 2));
  console.log('[Gemini] Endpoint:', ENDPOINT);
  console.log('[Gemini] Model:', GEMINI_MODEL);
  console.log('[Gemini] API version:', API_VERSION);

  try {
    const contents = buildContents(message, history);
    const systemInstruction = buildSystemInstruction(context);
    console.log('[Gemini] Sending request with', contents.length, 'content turns');
    console.log('[Gemini] System instruction:\n', systemInstruction);

    const result = await model.generateContent({
      systemInstruction,
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });

    const response = result.response;
    const text = response?.text?.() || '';

    console.log('[Gemini] Response:', text);

    return res.json({
      type: 'text',
      content: text.trim(),
      actions: [],
    });
  } catch (err) {
    const errorPayload = {
      status: err.status ?? null,
      statusText: err.statusText ?? null,
      message: err.message ?? String(err),
      stack: err.stack ?? null,
      raw: err,
    };
    console.error('[Gemini] Full error:', JSON.stringify(errorPayload, null, 2));

    return res.status(502).json({
      type: 'error',
      content: `Gemini API error: ${err.message}`,
      error: errorPayload,
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] LifePilot AI Gemini proxy running on http://localhost:${PORT}`);
  console.log(`[Server] Using model: ${GEMINI_MODEL}`);
  console.log(`[Server] Endpoint: ${ENDPOINT}`);
});

/**
 * Build the system instruction sent with every request.
 * Includes the user's profile so Gemini can personalize answers and avoid
 * asking for information that is already stored in Firestore.
 */
function buildSystemInstruction(context = {}) {
  const { personal = {}, financial = {}, goals = [] } = context || {};
  const { name, age, country, currency, riskTolerance, financialGoal } = personal;
  const { monthlyIncome, totalSavings, totalDebt, monthlyExpenses } = financial;

  const fmt = (value) =>
    value != null && value !== 0
      ? `${Number(value).toLocaleString()} ${currency || ''}`.trim()
      : 'Not provided';

  const goalList =
    goals.length > 0
      ? goals
          .map(
            (g) =>
              `- ${g.title || 'Unnamed goal'}: ${g.currentAmount || 0} / ${g.targetAmount || 0} ${currency || ''} (${g.progress || 0}%)`
          )
          .join('\n')
      : 'None provided';

  return `You are LifePilot AI, a friendly and knowledgeable personal finance assistant.

User Profile:
- Name: ${name || 'Not provided'}
- Age: ${age != null ? age : 'Not provided'}
- Country: ${country || 'Not provided'}
- Currency: ${currency || 'Not provided'}
- Monthly Income: ${fmt(monthlyIncome)}
- Monthly Expenses: ${fmt(monthlyExpenses)}
- Total Savings: ${fmt(totalSavings)}
- Total Debt: ${fmt(totalDebt)}
- Risk Tolerance: ${riskTolerance || 'Not provided'}
- Financial Goal: ${financialGoal || 'Not provided'}
- Active Goals:
${goalList}

Important instructions:
- Use the profile information above to personalize every response.
- Do NOT ask the user for information that is already provided in the profile.
- If a value is "Not provided", only ask for it when it is genuinely needed to answer the question.
- Provide educational financial guidance only. Do not guarantee financial outcomes.
- Encourage users to consult qualified financial professionals before making major financial decisions.
- Answer naturally, keep responses concise, actionable, and supportive.
- Use the user's currency when mentioning amounts.`;
}

/**
 * Build the Gemini contents array from the current message and chat history.
 */
function buildContents(message, history) {
  const contents = [];

  for (const item of history) {
    const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: String(item.content || '') }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: String(message) }],
  });

  return contents;
}
