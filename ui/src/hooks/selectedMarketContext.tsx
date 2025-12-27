import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react'
import type { MarketCatalogue } from '@betfair'
import type { MarketSnapshot } from '@betfair/types/stream'
import { useMarketStream } from './useMarketStream'
import { useSessionContext } from './sessionContext'
import { useMarketsContext } from './marketsContext'
import { useNotifications } from './notificationsContext'

export type SelectedMarketValue = {
  selectedMarketId: string
  setSelectedMarketId: (marketId: string) => void
  selectedMarket: MarketCatalogue | null
  snapshot: MarketSnapshot | null
  snapshotConnected: boolean
  marketTradedVolume: number | null
  bestBackLayBySelectionId: ReturnType<typeof useMarketStream>['bestBackLayBySelectionId']
}

const SelectedMarketContext = createContext<SelectedMarketValue | undefined>(undefined)

export function SelectedMarketProvider({ children }: PropsWithChildren): React.ReactNode {
  const { isAuthed } = useSessionContext()
  const { markets, isLoading: marketsLoading } = useMarketsContext()
  const notifications = useNotifications()

  const stream = useMarketStream({
    isAuthed,
    onInfo: (m) => notifications.info(m),
    onError: (m) => notifications.error(m),
  })

  useEffect(() => {
    if (!isAuthed) stream.disconnect()
  }, [isAuthed, stream])

  const selectedMarket = useMemo(() => {
    return markets.find((m) => m.marketId === stream.selectedMarketId) ?? null
  }, [markets, stream.selectedMarketId])

  useEffect(() => {
    if (marketsLoading) {
      notifications.status('↻ Loading markets...')
      return
    }

    if (!markets.length) {
      notifications.status('◇ No markets loaded')
      return
    }

    if (!stream.snapshotConnected) {
      notifications.status(`◇ ${markets.length} markets • ↻ Connecting to stream...`)
      return
    }

    notifications.status(`✓ ${markets.length} markets • ✓ Stream connected`)
  }, [markets.length, marketsLoading, notifications, stream.snapshotConnected])

  const value = useMemo<SelectedMarketValue>(
    () => ({
      selectedMarketId: stream.selectedMarketId,
      setSelectedMarketId: stream.setSelectedMarketId,
      selectedMarket,
      snapshot: stream.snapshot,
      snapshotConnected: stream.snapshotConnected,
      marketTradedVolume: stream.marketTradedVolume,
      bestBackLayBySelectionId: stream.bestBackLayBySelectionId,
    }),
    [selectedMarket, stream.bestBackLayBySelectionId, stream.marketTradedVolume, stream.selectedMarketId, stream.setSelectedMarketId, stream.snapshotConnected, stream.snapshot],
  )

  return <SelectedMarketContext.Provider value={value}>{children}</SelectedMarketContext.Provider>
}

export function useSelectedMarketContext(): SelectedMarketValue {
  const ctx = useContext(SelectedMarketContext)
  if (!ctx) throw new Error('SelectedMarketProvider is missing')
  return ctx
}
