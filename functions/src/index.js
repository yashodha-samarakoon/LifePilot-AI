import { onCall, HttpsError } from 'firebase-functions/v2/https';
import axios from 'axios';
import {
  buildUserContext,
  checkRateLimit,
  cacheResult,
} from './ai/qwen.client.js';
import {
  HEALTH_INSIGHTS_PROMPT,
  DECISION_SIMULATOR_PROMPT,
  BLIND_SPOT_PROMPT,
  OPPORTUNITY_PROMPT,
  MOMENTUM_COACH_PROMPT,
} from './ai/prompts/index.js';

// Qwen API configuration
const QWEN_API_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_MODEL = 'qwen-plus';

/**
 * Call the Qwen API with a system prompt and user context.
 * Returns parsed JSON response.
 */
async function callQwen(systemPrompt, userContext, additionalData = {}) {
  const userMessage = JSON.stringify({ ...userContext, ...additionalData });

  const response = await axios.post(
    QWEN_API_URL,
    {
      model: QWEN_MODEL,
      input: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      },
      parameters: {
        result_format: 'message',
        temperature: 0.7,
        max_tokens: 2000,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = response.data?.output?.choices?.[0]?.message?.content
    || response.data?.output?.text
    || '';

  // Parse JSON from response (strip markdown if present)
  const cleaned = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If JSON parsing fails, wrap in a basic structure
    return { raw: content, error: 'Failed to parse AI response' };
  }
}

/**
 * Validate that the caller is authenticated.
 */
function requireAuth(context) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  return context.auth.uid;
}

// ============================================================
// CLOUD FUNCTIONS
// ============================================================

/**
 * Get AI-powered financial health insights.
 */
export const getHealthInsights = onCall(async (request) => {
  const uid = requireAuth(request);

  // Check cache
  const cached = await checkRateLimit(uid, 'health');
  if (cached) return cached;

  // Build context and call Qwen
  const context = await buildUserContext(uid);
  const result = await callQwen(HEALTH_INSIGHTS_PROMPT, context);

  // Cache result
  await cacheResult(uid, 'health', result);

  return result;
});

/**
 * Simulate a financial decision.
 */
export const simulateDecision = onCall(async (request) => {
  const uid = requireAuth(request);
  const { type, input } = request.data || {};

  if (!type || !input) {
    throw new HttpsError('invalid-argument', 'Decision type and input are required.');
  }

  // Build context and call Qwen
  const context = await buildUserContext(uid);
  const result = await callQwen(DECISION_SIMULATOR_PROMPT, context, {
    decisionType: type,
    decisionInput: input,
  });

  return result;
});

/**
 * Detect financial blind spots.
 */
export const detectBlindSpots = onCall(async (request) => {
  const uid = requireAuth(request);

  // Check cache
  const cached = await checkRateLimit(uid, 'blindspots');
  if (cached) return cached;

  const context = await buildUserContext(uid);
  const result = await callQwen(BLIND_SPOT_PROMPT, context);

  await cacheResult(uid, 'blindspots', result);

  return result;
});

/**
 * Explore financial opportunities.
 */
export const exploreOpportunities = onCall(async (request) => {
  const uid = requireAuth(request);

  // Check cache
  const cached = await checkRateLimit(uid, 'opportunities');
  if (cached) return cached;

  const context = await buildUserContext(uid);
  const result = await callQwen(OPPORTUNITY_PROMPT, context);

  await cacheResult(uid, 'opportunities', result);

  return result;
});

/**
 * Get personalized coaching guidance.
 */
export const getCoaching = onCall(async (request) => {
  const uid = requireAuth(request);

  // Check cache
  const cached = await checkRateLimit(uid, 'coaching');
  if (cached) return cached;

  const context = await buildUserContext(uid);
  const result = await callQwen(MOMENTUM_COACH_PROMPT, context);

  await cacheResult(uid, 'coaching', result);

  return result;
});
