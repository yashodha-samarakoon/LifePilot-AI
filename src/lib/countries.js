/**
 * Country / Currency Registry
 * Each entry: { code, name, currency, symbol, locale }
 * Used by onboarding, formatters, and settings.
 */

export const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka',        currency: 'LKR', symbol: 'Rs',  locale: 'si-LK' },
  { code: 'IN', name: 'India',            currency: 'INR', symbol: '₹',   locale: 'en-IN' },
  { code: 'US', name: 'United States',    currency: 'USD', symbol: '$',   locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom',   currency: 'GBP', symbol: '£',   locale: 'en-GB' },
  { code: 'AU', name: 'Australia',        currency: 'AUD', symbol: 'A$',  locale: 'en-AU' },
  { code: 'CA', name: 'Canada',           currency: 'CAD', symbol: 'C$',  locale: 'en-CA' },
  { code: 'SG', name: 'Singapore',        currency: 'SGD', symbol: 'S$',  locale: 'en-SG' },
  { code: 'AE', name: 'UAE',              currency: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SA', name: 'Saudi Arabia',     currency: 'SAR', symbol: '﷼',   locale: 'ar-SA' },
  { code: 'QA', name: 'Qatar',            currency: 'QAR', symbol: 'ر.ق', locale: 'ar-QA' },
  { code: 'KW', name: 'Kuwait',           currency: 'KWD', symbol: 'د.ك', locale: 'ar-KW' },
  { code: 'MY', name: 'Malaysia',         currency: 'MYR', symbol: 'RM',  locale: 'ms-MY' },
  { code: 'JP', name: 'Japan',            currency: 'JPY', symbol: '¥',   locale: 'ja-JP' },
  { code: 'DE', name: 'Germany',          currency: 'EUR', symbol: '€',   locale: 'de-DE' },
  { code: 'FR', name: 'France',           currency: 'EUR', symbol: '€',   locale: 'fr-FR' },
  { code: 'NZ', name: 'New Zealand',      currency: 'NZD', symbol: 'NZ$', locale: 'en-NZ' },
  { code: 'PK', name: 'Pakistan',         currency: 'PKR', symbol: 'Rs',  locale: 'en-PK' },
  { code: 'BD', name: 'Bangladesh',       currency: 'BDT', symbol: '৳',   locale: 'bn-BD' },
  { code: 'NG', name: 'Nigeria',          currency: 'NGN', symbol: '₦',   locale: 'en-NG' },
  { code: 'ZA', name: 'South Africa',     currency: 'ZAR', symbol: 'R',   locale: 'en-ZA' },
  { code: 'BR', name: 'Brazil',           currency: 'BRL', symbol: 'R$',  locale: 'pt-BR' },
  { code: 'PH', name: 'Philippines',      currency: 'PHP', symbol: '₱',   locale: 'en-PH' },
  { code: 'KR', name: 'South Korea',      currency: 'KRW', symbol: '₩',   locale: 'ko-KR' },
  { code: 'CN', name: 'China',            currency: 'CNY', symbol: '¥',   locale: 'zh-CN' },
];

/**
 * Look up a country by its ISO code.
 */
export function getCountryByCode(code) {
  return COUNTRIES.find((c) => c.code === code) || null;
}

/**
 * Get the currency info for a country code.
 */
export function getCurrencyForCountry(code) {
  const country = getCountryByCode(code);
  if (!country) return { currency: 'USD', symbol: '$', locale: 'en-US' };
  return { currency: country.currency, symbol: country.symbol, locale: country.locale };
}

/**
 * Get default currency (used when no country is selected yet).
 */
export function getDefaultCurrency() {
  return { currency: 'USD', symbol: '$', locale: 'en-US' };
}

/**
 * Get a flat list of unique currencies with their symbols.
 */
export function getUniqueCurrencies() {
  const seen = new Set();
  return COUNTRIES.filter((c) => {
    if (seen.has(c.currency)) return false;
    seen.add(c.currency);
    return true;
  }).map(({ currency, symbol }) => ({ currency, symbol }));
}
