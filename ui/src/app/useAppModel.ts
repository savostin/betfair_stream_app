import { useMemo } from 'react'
import type { AccountFunds, MarketCatalogue } from '@betfair'
import { useAppSnackbar } from '../hooks/useAppSnackbar'
import { useFunds } from '../hooks/useFunds'
import { useMarkets } from '../hooks/useMarkets'
import { useMarketStream } from '../hooks/useMarketStream'
import { useSession } from '../hooks/useSession'

export type AppModel = {
  // Session
  isAuthed: boolean
  login: (args: { username: string; password: string }) => Promise<void>
  logout: () => void

  // Funds
  funds: AccountFunds | null
  accountCurrency: string | null
  fundsLoading: boolean
  refreshFunds: () => Promise<void>

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
      tv?: number
    }
  >
  snapshotConnected: boolean
  marketTradedVolume: number | null

  // Notifications
  snackbar: ReturnType<typeof useAppSnackbar>['snackbar']
  clearSnackbar: () => void
}

export function useAppModel(): AppModel {
  const snackbar = useAppSnackbar()
  const session = useSession()

  const funds = useFunds({
    isAuthed: session.isAuthed,
    onError: snackbar.showFromUnknownError,
  })

  const markets = useMarkets({
    isAuthed: session.isAuthed,
    onLoaded: (count) => snackbar.showInfo('markets:toast.loadedMarkets', { count }),
    onError: snackbar.showFromUnknownError,
  })

  const stream = useMarketStream({
    isAuthed: session.isAuthed,
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
    isAuthed: session.isAuthed,
    login,
    logout,

    funds: funds.funds,
    accountCurrency: funds.accountDetails?.currencyCode ?? null,
    fundsLoading: funds.fundsLoading,
    refreshFunds: funds.refreshFunds,

    markets: markets.markets,
    marketsLoading: markets.marketsLoading,
    refreshMarkets: markets.refreshMarkets,
    selectedMarketId: stream.selectedMarketId,
    setSelectedMarketId: stream.setSelectedMarketId,
    selectedMarket,

    bestBackLayBySelectionId: stream.bestBackLayBySelectionId,
    snapshotConnected: stream.snapshotConnected,
    marketTradedVolume: stream.marketTradedVolume,

    snackbar: snackbar.snackbar,
    clearSnackbar: snackbar.clearSnackbar,
  }
}
