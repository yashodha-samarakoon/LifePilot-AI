import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseConfigured } from './firebase';

// Cloud Function references (only available when Firebase is configured)
let getHealthInsightsFn = null;
let simulateDecisionFn = null;
let detectBlindSpotsFn = null;
let exploreOpportunitiesFn = null;
let getCoachingFn = null;

if (isFirebaseConfigured && functions) {
  getHealthInsightsFn = httpsCallable(functions, 'getHealthInsights');
  simulateDecisionFn = httpsCallable(functions, 'simulateDecision');
  detectBlindSpotsFn = httpsCallable(functions, 'detectBlindSpots');
  exploreOpportunitiesFn = httpsCallable(functions, 'exploreOpportunities');
  getCoachingFn = httpsCallable(functions, 'getCoaching');
}

export async function getHealthInsights() {
  if (!getHealthInsightsFn) {
    throw new Error('Cloud Functions not available. AI features require Firebase to be configured.');
  }
  const result = await getHealthInsightsFn();
  return result.data;
}

export async function simulateDecision(decisionType, inputData) {
  if (!simulateDecisionFn) {
    throw new Error('Cloud Functions not available. AI features require Firebase to be configured.');
  }
  const result = await simulateDecisionFn({ type: decisionType, input: inputData });
  return result.data;
}

export async function detectBlindSpots() {
  if (!detectBlindSpotsFn) {
    throw new Error('Cloud Functions not available. AI features require Firebase to be configured.');
  }
  const result = await detectBlindSpotsFn();
  return result.data;
}

export async function exploreOpportunities() {
  if (!exploreOpportunitiesFn) {
    throw new Error('Cloud Functions not available. AI features require Firebase to be configured.');
  }
  const result = await exploreOpportunitiesFn();
  return result.data;
}

export async function getCoaching() {
  if (!getCoachingFn) {
    throw new Error('Cloud Functions not available. AI features require Firebase to be configured.');
  }
  const result = await getCoachingFn();
  return result.data;
}
