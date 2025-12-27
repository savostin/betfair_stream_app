const APP_KEY_KEY = 'betfair.appKey'
const SESSION_TOKEN_KEY = 'betfair.sessionToken'
const FUNDS_REFRESH_INTERVAL_KEY = 'betfair.fundsRefreshInterval'
const DEFAULT_BET_SIZE_KEY = 'betfair.defaultBetSize'
const PRICE_OFFSET_TICKS_KEY = 'betfair.priceOffsetTicks'
const PRICE_LADDER_DEPTH_KEY = 'betfair.priceLadderDepth'

const DEFAULT_FUNDS_REFRESH_INTERVAL = 30
const MIN_FUNDS_REFRESH_INTERVAL = 15
const DEFAULT_BET_SIZE = 10
const MIN_BET_SIZE = 0.5
const DEFAULT_PRICE_OFFSET_TICKS = 0
const MIN_PRICE_OFFSET_TICKS = 0
const MAX_PRICE_OFFSET_TICKS = 10
const DEFAULT_PRICE_LADDER_DEPTH = 3
const MIN_PRICE_LADDER_DEPTH = 1
const MAX_PRICE_LADDER_DEPTH = 3

export function getAppKey(): string {
  return localStorage.getItem(APP_KEY_KEY) ?? ''
}

export function setAppKey(appKey: string): void {
  localStorage.setItem(APP_KEY_KEY, appKey)
}

export function getSessionToken(): string {
  return localStorage.getItem(SESSION_TOKEN_KEY) ?? ''
}

export function setSessionToken(sessionToken: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, sessionToken)
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

export function getFundsRefreshInterval(): number {
  const stored = localStorage.getItem(FUNDS_REFRESH_INTERVAL_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= MIN_FUNDS_REFRESH_INTERVAL) {
      return parsed
    }
  }
  return DEFAULT_FUNDS_REFRESH_INTERVAL
}

export function setFundsRefreshInterval(seconds: number): void {
  const clamped = Math.max(MIN_FUNDS_REFRESH_INTERVAL, Math.floor(seconds))
  localStorage.setItem(FUNDS_REFRESH_INTERVAL_KEY, String(clamped))
}

export function getDefaultBetSize(): number {
  const stored = localStorage.getItem(DEFAULT_BET_SIZE_KEY)
  if (stored) {
    const parsed = parseFloat(stored)
    if (!isNaN(parsed) && parsed >= MIN_BET_SIZE) {
      return parsed
    }
  }
  return DEFAULT_BET_SIZE
}

export function setDefaultBetSize(size: number): void {
  const clamped = Math.max(MIN_BET_SIZE, size)
  localStorage.setItem(DEFAULT_BET_SIZE_KEY, String(clamped))
}

export function getPriceOffsetTicks(): number {
  const stored = localStorage.getItem(PRICE_OFFSET_TICKS_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= MIN_PRICE_OFFSET_TICKS && parsed <= MAX_PRICE_OFFSET_TICKS) {
      return parsed
    }
  }
  return DEFAULT_PRICE_OFFSET_TICKS
}

export function setPriceOffsetTicks(ticks: number): void {
  const clamped = Math.max(MIN_PRICE_OFFSET_TICKS, Math.min(MAX_PRICE_OFFSET_TICKS, Math.floor(ticks)))
  localStorage.setItem(PRICE_OFFSET_TICKS_KEY, String(clamped))
}

export function getPriceLadderDepth(): number {
  const stored = localStorage.getItem(PRICE_LADDER_DEPTH_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= MIN_PRICE_LADDER_DEPTH && parsed <= MAX_PRICE_LADDER_DEPTH) {
      return parsed
    }
  }
  return DEFAULT_PRICE_LADDER_DEPTH
}

export function setPriceLadderDepth(depth: number): void {
  const clamped = Math.max(MIN_PRICE_LADDER_DEPTH, Math.min(MAX_PRICE_LADDER_DEPTH, Math.floor(depth)))
  localStorage.setItem(PRICE_LADDER_DEPTH_KEY, String(clamped))
  window.dispatchEvent(new Event('priceLadderDepthChanged'))
}
