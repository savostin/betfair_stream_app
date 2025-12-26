import { useCallback, useEffect, useState } from 'react'
import { betfairLogin } from '@betfair'
import { UiError } from '../errors/UiError'
import { tauriInvoke } from '../lib/tauri'

export type SessionState = {
  isAuthed: boolean
  login: (args: { username: string; password: string }) => Promise<void>
  logout: () => void
}

export function useSession(): SessionState {
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const status = await tauriInvoke<{ isLoggedIn: boolean }>('auth_status')
        setIsAuthed(Boolean(status?.isLoggedIn))
      } catch {
        setIsAuthed(false)
      }
    })()
  }, [])

  const login = useCallback(
    async (args: { username: string; password: string }) => {
      if (!args.username) throw new UiError({ key: 'errors:validation.usernameRequired' })
      if (!args.password) throw new UiError({ key: 'errors:validation.passwordRequired' })

      await betfairLogin({ username: args.username, password: args.password })
      setIsAuthed(true)
    },
    [],
  )

  const logout = useCallback(() => {
    void tauriInvoke<void>('auth_logout').catch(() => {
      // ignore
    })
    setIsAuthed(false)
  }, [])

  return {
    isAuthed,
    login,
    logout,
  }
}
