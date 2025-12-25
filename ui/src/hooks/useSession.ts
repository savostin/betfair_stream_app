import { useCallback, useState } from 'react'
import { betfairLogin } from '../lib/betfair'
import { clearSession, getAppKey, getSessionToken, setAppKey as persistAppKey, setSessionToken } from '../lib/storage'
import { UiError } from '../errors/UiError'

export type SessionState = {
  appKey: string
  wsUrl: string
  sessionToken: string
  isAuthed: boolean
  setAppKey: (next: string) => void
  setWsUrl: (next: string) => void
  login: (args: { username: string; password: string }) => Promise<void>
  logout: () => void
}

const DEFAULT_WS_URL = 'ws://127.0.0.1:8080/ws'

export function useSession(): SessionState {
  const [appKey, setAppKeyState] = useState(() => getAppKey())
  const [wsUrl, setWsUrlState] = useState(() => DEFAULT_WS_URL)
  const [sessionToken, setSessionTokenState] = useState(() => getSessionToken())

  const setAppKey = useCallback((next: string) => {
    setAppKeyState(next)
    persistAppKey(next)
  }, [])

  const setWsUrl = useCallback((next: string) => {
    setWsUrlState(next)
  }, [])

  const login = useCallback(
    async (args: { username: string; password: string }) => {
      if (!appKey) throw new UiError({ key: 'errors:validation.appKeyRequired' })
      if (!args.username) throw new UiError({ key: 'errors:validation.usernameRequired' })
      if (!args.password) throw new UiError({ key: 'errors:validation.passwordRequired' })

      const token = await betfairLogin({ appKey, username: args.username, password: args.password })
      setSessionToken(token)
      setSessionTokenState(token)
    },
    [appKey],
  )

  const logout = useCallback(() => {
    clearSession()
    setSessionTokenState('')
  }, [])

  return {
    appKey,
    wsUrl,
    sessionToken,
    isAuthed: Boolean(sessionToken),
    setAppKey,
    setWsUrl,
    login,
    logout,
  }
}
