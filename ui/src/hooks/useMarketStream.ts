import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MarketSnapshot } from '@lib/streamState'
import { TauriStreamClient, type UiMessage } from '@lib/stream'

export type MarketStreamState = {
  selectedMarketId: string
  setSelectedMarketId: (marketId: string) => void
  snapshot: MarketSnapshot | null
  snapshotConnected: boolean
  marketTradedVolume: number | null
  bestBackLayBySelectionId: Map<
    number,
    {
      back: Array<{ price: number; size: number }>
      lay: Array<{ price: number; size: number }>
      ltp?: number
      tv?: number
    }
  >
  disconnect: () => void
}

export function useMarketStream(args: {
  isAuthed: boolean
  onInfo?: (m: UiMessage) => void
  onError?: (m: UiMessage) => void
}): MarketStreamState {
  const streamRef = useRef<{ disconnect: () => void; subscribeToMarket: (marketId: string) => void } | null>(null)
  const [selectedMarketId, setSelectedMarketIdState] = useState<string>('')
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)

  const ensureClient = useCallback(() => {
    if (streamRef.current) return streamRef.current

    const client = new TauriStreamClient({
      onSnapshot: (s) => setSnapshot(s),
      onInfo: args.onInfo,
      onError: args.onError,
    })

    streamRef.current = client
    return client
  }, [args.onError, args.onInfo])

  const disconnect = useCallback(() => {
    streamRef.current?.disconnect()
    streamRef.current = null
    setSnapshot(null)
    setSelectedMarketIdState('')
  }, [])

  const setSelectedMarketId = useCallback(
    (marketId: string) => {
      setSelectedMarketIdState(marketId)
      setSnapshot(null)

      if (!args.isAuthed) return

      const client = ensureClient()
      client.subscribeToMarket(marketId)
    },
    [args.isAuthed, ensureClient],
  )

  useEffect(() => {
    return () => {
      streamRef.current?.disconnect()
      streamRef.current = null
    }
  }, [])

  const bestBackLayBySelectionId = useMemo(() => {
    const map = new Map<
      number,
      {
        back: Array<{ price: number; size: number }>
        lay: Array<{ price: number; size: number }>
        ltp?: number
        tv?: number
      }
    >()

    if (!snapshot) return map
    for (const r of snapshot.runners) {
      const back = (r.batb ?? []).slice(0, 3).map((x) => ({ price: x.price, size: x.size }))
      const lay = (r.batl ?? []).slice(0, 3).map((x) => ({ price: x.price, size: x.size }))
      map.set(r.selectionId, { back, lay, ltp: r.ltp, tv: r.tv })
    }

    return map
  }, [snapshot])

  return {
    selectedMarketId,
    setSelectedMarketId,
    snapshot,
    snapshotConnected: Boolean(snapshot),
    marketTradedVolume: typeof snapshot?.tradedVolume === 'number' ? snapshot.tradedVolume : null,
    bestBackLayBySelectionId,
    disconnect,
  }
}
