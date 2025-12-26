import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react'
import { useAccountDetails, useAccountFunds } from '@lib/queries'
import { useSessionContext } from './sessionContext'
import { useNotifications } from './notificationsContext'

export type AccountValue = {
  funds: ReturnType<typeof useAccountFunds>['data'] | null
  accountCurrency: string | null
  isLoading: boolean
  error: unknown
  refresh: () => Promise<void>
}

const AccountContext = createContext<AccountValue | undefined>(undefined)

export function AccountProvider({ children }: PropsWithChildren): React.ReactNode {
  const { isAuthed } = useSessionContext()
  const notifications = useNotifications()

  const fundsQuery = useAccountFunds(isAuthed)
  const detailsQuery = useAccountDetails(isAuthed)

  useEffect(() => {
    if (fundsQuery.error) notifications.error(fundsQuery.error)
  }, [fundsQuery.error, notifications])

  useEffect(() => {
    if (detailsQuery.error) notifications.error(detailsQuery.error)
  }, [detailsQuery.error, notifications])

  const value = useMemo<AccountValue>(
    () => ({
      funds: fundsQuery.data ?? null,
      accountCurrency: detailsQuery.data?.currencyCode ?? null,
      isLoading: fundsQuery.isLoading || detailsQuery.isLoading,
      error: fundsQuery.error ?? detailsQuery.error ?? null,
      refresh: async () => {
        await Promise.all([fundsQuery.refetch(), detailsQuery.refetch()])
      },
    }),
    [detailsQuery.data, detailsQuery.error, detailsQuery.isLoading, fundsQuery.data, fundsQuery.error, fundsQuery.isLoading, fundsQuery.refetch],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccountContext(): AccountValue {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('AccountProvider is missing')
  return ctx
}
