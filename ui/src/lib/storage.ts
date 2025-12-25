const APP_KEY_KEY = 'betfair.appKey'
const SESSION_TOKEN_KEY = 'betfair.sessionToken'

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
