export function formatMoney(n: number | undefined, placeholder: string, currency?: string): string {
  if (n === undefined || Number.isNaN(n)) return placeholder
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${getCurrencySymbol(currency)}${formatted}` : formatted
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  AUD: 'A$',
  CAD: 'C$',
  DKK: 'kr',
  HKD: 'HK$',
  NOK: 'kr',
  NZD: 'NZ$',
  SEK: 'kr',
  SGD: 'S$',
}

export function getCurrencySymbol(currencyCode: string | null): string {
  if (!currencyCode) return '£'
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] ?? currencyCode
}
