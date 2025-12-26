import { useCallback, useEffect, useRef, useState } from 'react'
import type { MarketCatalogue } from '../lib/betfair'
import { listNextHorseWinMarkets } from '../lib/betfair'

export type MarketsState = {
  markets: MarketCatalogue[]
  marketsLoading: boolean
  refreshMarkets: () => Promise<void>
  clearMarkets: () => void
}

export function useMarkets({
  isAuthed,
  onLoaded,
  onError,
}: {
  isAuthed: boolean
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
    if (!isAuthed) return

    setMarketsLoading(true)
    try {
      const data = await listNextHorseWinMarkets()
      setMarkets(data)
      onLoadedRef.current?.(data.length)
    } catch (e) {
      onErrorRef.current?.(e)
    } finally {
      setMarketsLoading(false)
    }
  }, [isAuthed])

  useEffect(() => {
    if (!isAuthed) return
    void refreshMarkets()
  }, [isAuthed, refreshMarkets])

  return { markets, marketsLoading, refreshMarkets, clearMarkets }
}
