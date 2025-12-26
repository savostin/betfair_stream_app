import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react'
import type { MarketCatalogue } from '@betfair'
import { useNextHorseWinMarkets } from '@lib/queries'
import { useSessionContext } from './sessionContext'
import { useNotifications } from './notificationsContext'

export type MarketsValue = {
  markets: MarketCatalogue[]
  isLoading: boolean
  error: unknown
  refresh: () => Promise<void>
}

const MarketsContext = createContext<MarketsValue | undefined>(undefined)

export function MarketsProvider({ children }: PropsWithChildren): React.ReactNode {
  const { isAuthed } = useSessionContext()
  const notifications = useNotifications()
  const marketsQuery = useNextHorseWinMarkets(isAuthed)

  useEffect(() => {
    if (marketsQuery.error) notifications.error(marketsQuery.error)
  }, [marketsQuery.error, notifications])

  const value = useMemo<MarketsValue>(
    () => ({
      markets: marketsQuery.data ?? [],
      isLoading: marketsQuery.isLoading,
      error: marketsQuery.error ?? null,
      refresh: async () => {
        await marketsQuery.refetch()
      },
    }),
    [marketsQuery.data, marketsQuery.error, marketsQuery.isLoading, marketsQuery.refetch],
  )

  return <MarketsContext.Provider value={value}>{children}</MarketsContext.Provider>
}

export function useMarketsContext(): MarketsValue {
  const ctx = useContext(MarketsContext)
  if (!ctx) throw new Error('MarketsProvider is missing')
  return ctx
}
