import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react'
import { useSession } from './useSession'
import { useInvalidateAllQueries } from '@lib/queries'
import { useNavigation } from './navigationContext'

export type SessionValue = {
  isAuthed: boolean
  login: (args: { username: string; password: string }) => Promise<void>
  logout: () => void
}

const SessionContext = createContext<SessionValue | undefined>(undefined)

export function SessionProvider({ children }: PropsWithChildren): React.ReactNode {
  const session = useSession()
  const invalidateAll = useInvalidateAllQueries()
  const navigation = useNavigation()

  const logout = useCallback(() => {
    session.logout()
    invalidateAll()
    navigation.reset()
  }, [invalidateAll, navigation, session])

  const value = useMemo<SessionValue>(
    () => ({
      isAuthed: session.isAuthed,
      login: session.login,
      logout,
    }),
    [logout, session.isAuthed, session.login],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessionContext(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('SessionProvider is missing')
  return ctx
}
