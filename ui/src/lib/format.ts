type DateLike = Date | string | number | null | undefined

export function formatMoney(n: number | null, placeholder: string, currency: string | null): string {
  if (n === null || Number.isNaN(n)) return placeholder
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${sign}${getCurrencySymbol(currency)}${formatted}` : `${sign}${formatted}`
}

export function formatAmount(n: number | null, placeholder: string, currency: string | null): string {
  return formatMoney(n, placeholder, currency)
}

export function formatPl(value: number | null, placeholder: string, currency: string | null): string {
  if (value === null || value === 0) return placeholder
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatMoney(value, placeholder, currency)}`
}

const toDate = (value: DateLike): Date | null => {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: DateLike, placeholder: string, locale?: string): string {
  const date = toDate(value)
  if (!date) return placeholder
  return date.toLocaleDateString(locale)
}

export function formatTime(value: DateLike, placeholder: string, includeSeconds = false, locale?: string): string {
  const date = toDate(value)
  if (!date) return placeholder
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  })
}

export function formatDateTime(value: DateLike, placeholder: string, includeSeconds = false, locale?: string): string {
  const date = toDate(value)
  if (!date) return placeholder
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  })
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
