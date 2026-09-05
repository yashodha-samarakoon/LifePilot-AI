import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getCurrencyForCountry, getDefaultCurrency } from './countries';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve the currency config for formatting.
 * Accepts a currency code string, or a country code, or nothing (defaults to USD).
 */
function resolveCurrency(currencyOrCountry, locale) {
  if (!currencyOrCountry) return getDefaultCurrency();
  // If it looks like a 2-letter country code, resolve it
  if (currencyOrCountry.length === 2 && currencyOrCountry === currencyOrCountry.toUpperCase()) {
    return getCurrencyForCountry(currencyOrCountry);
  }
  // Otherwise treat as currency code
  return {
    currency: currencyOrCountry,
    symbol: '',
    locale: locale || 'en-US',
  };
}

/**
 * Format a number as currency.
 * @param {number} amount
 * @param {string} currencyOrCountry - Currency code (e.g. "INR") or country code (e.g. "IN")
 * @param {string} [locale] - Override locale
 */
export function formatCurrency(amount, currencyOrCountry, locale) {
  const { currency, locale: resolvedLocale } = resolveCurrency(currencyOrCountry, locale);
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    // Fallback if locale/currency combo is invalid
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }
}

/**
 * Format a number with locale-aware separators.
 */
export function formatNumber(num, locale) {
  try {
    return new Intl.NumberFormat(locale || 'en-US').format(num || 0);
  } catch {
    return String(num || 0);
  }
}

/**
 * Format a date with locale-aware formatting.
 */
export function formatDate(date, locale) {
  try {
    return new Intl.DateTimeFormat(locale || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date instanceof Date ? date : new Date(date));
  } catch {
    return String(date);
  }
}

/**
 * Get a currency symbol for a given currency code or country code.
 */
export function getCurrencySymbol(currencyOrCountry) {
  const { symbol } = resolveCurrency(currencyOrCountry);
  return symbol || currencyOrCountry;
}

export function getScoreColor(score) {
  if (score >= 71) return { text: 'text-emerald-600', bg: 'bg-emerald-500', ring: '#10B981', label: 'Excellent' };
  if (score >= 41) return { text: 'text-amber-600', bg: 'bg-amber-500', ring: '#F59E0B', label: 'Moderate' };
  return { text: 'text-rose-600', bg: 'bg-rose-500', ring: '#F43F5E', label: 'Needs Attention' };
}

export function getDaysRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Estimate monthly expenses from a list of tracked transactions.
 * Sums expense transactions from the last 30 days.
 */
export function estimateMonthlyExpenses(transactions = []) {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return transactions
    .filter((t) => t.type === 'expense' && (t.date || t.createdAt) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}
