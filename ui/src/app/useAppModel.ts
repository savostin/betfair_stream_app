import { useMemo } from 'react'
import type { MarketCatalogue } from '../types/betfair'
import { useAppSnackbar } from '../hooks/useAppSnackbar'
import { useMarkets } from '../hooks/useMarkets'
import { useMarketStream } from '../hooks/useMarketStream'
import { useSession } from '../hooks/useSession'

export type AppModel = {
  // Session/config
  appKey: string
  wsUrl: string
  isAuthed: boolean
  setAppKey: (next: string) => void
  setWsUrl: (next: string) => void
  login: (args: { username: string; password: string }) => Promise<void>
  logout: () => void

  // Markets + selection
  markets: MarketCatalogue[]
  marketsLoading: boolean
  refreshMarkets: () => Promise<void>
  selectedMarketId: string
  setSelectedMarketId: (marketId: string) => void
  selectedMarket: MarketCatalogue | null

  // Stream-derived view model
  bestBackLayBySelectionId: Map<
    number,
    {
      back: Array<{ price: number; size: number }>
      lay: Array<{ price: number; size: number }>
      ltp?: number
    }
  >
  snapshotConnected: boolean

  // Notifications
  snackbar: ReturnType<typeof useAppSnackbar>['snackbar']
  clearSnackbar: () => void
}

export function useAppModel(): AppModel {
  const snackbar = useAppSnackbar()
  const session = useSession()

  const markets = useMarkets({
    appKey: session.appKey,
    sessionToken: session.sessionToken,
    onLoaded: (count) => snackbar.showInfo('markets:toast.loadedMarkets', { count }),
    onError: snackbar.showFromUnknownError,
  })

  const stream = useMarketStream({
    wsUrl: session.wsUrl,
    appKey: session.appKey,
    sessionToken: session.sessionToken,
    onInfo: (m) => snackbar.showFromUiMessage('info', m),
    onError: (m) => snackbar.showFromUiMessage('error', m),
  })

  const selectedMarket = useMemo(() => {
    return markets.markets.find((m) => m.marketId === stream.selectedMarketId) ?? null
  }, [markets.markets, stream.selectedMarketId])

  async function login(args: { username: string; password: string }): Promise<void> {
    await session.login(args)
    snackbar.showInfo('auth:toast.loggedIn')
  }

  function logout(): void {
    stream.disconnect()
    markets.clearMarkets()
    session.logout()
    snackbar.showInfo('auth:toast.loggedOut')
  }

  return {
    appKey: session.appKey,
    wsUrl: session.wsUrl,
    isAuthed: session.isAuthed,
    setAppKey: session.setAppKey,
    setWsUrl: session.setWsUrl,
    login,
    logout,

    markets: markets.markets,
    marketsLoading: markets.marketsLoading,
    refreshMarkets: markets.refreshMarkets,
    selectedMarketId: stream.selectedMarketId,
    setSelectedMarketId: stream.setSelectedMarketId,
    selectedMarket,

    bestBackLayBySelectionId: stream.bestBackLayBySelectionId,
    snapshotConnected: stream.snapshotConnected,

    snackbar: snackbar.snackbar,
    clearSnackbar: snackbar.clearSnackbar,
  }
}
