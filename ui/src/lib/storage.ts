const APP_KEY_KEY = 'betfair.appKey'
const SESSION_TOKEN_KEY = 'betfair.sessionToken'
const FUNDS_REFRESH_INTERVAL_KEY = 'betfair.fundsRefreshInterval'

const DEFAULT_FUNDS_REFRESH_INTERVAL = 30
const MIN_FUNDS_REFRESH_INTERVAL = 15

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
