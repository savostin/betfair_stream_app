import { useCallback, useEffect, useRef, useState } from 'react'
import type { MarketCatalogue } from '../types/betfair'
import { listNextHorseWinMarkets } from '../lib/betfair'

export type MarketsState = {
  markets: MarketCatalogue[]
  marketsLoading: boolean
  refreshMarkets: () => Promise<void>
  clearMarkets: () => void
}

export function useMarkets({
  appKey,
  sessionToken,
  onLoaded,
  onError,
}: {
  appKey: string
  sessionToken: string
  onLoaded?: (count: number) => void
  onError?: (e: unknown) => void
}): MarketsState {
  const [markets, setMarkets] = useState<MarketCatalogue[]>([])
  const [marketsLoading, setMarketsLoading] = useState(false)

  const onLoadedRef = useRef(onLoaded)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const clearMarkets = useCallback(() => {
    setMarkets([])
  }, [])

  const refreshMarkets = useCallback(async () => {
    if (!appKey || !sessionToken) return

    setMarketsLoading(true)
    try {
      const data = await listNextHorseWinMarkets({ appKey, sessionToken })
      setMarkets(data)
      onLoadedRef.current?.(data.length)
    } catch (e) {
      onErrorRef.current?.(e)
    } finally {
      setMarketsLoading(false)
    }
  }, [appKey, sessionToken])

  useEffect(() => {
    if (!appKey || !sessionToken) return
    void refreshMarkets()
  }, [appKey, sessionToken, refreshMarkets])

  return { markets, marketsLoading, refreshMarkets, clearMarkets }
}
