import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MarketSnapshot } from '../lib/streamState'
import { StreamClient, type UiMessage } from '../lib/streamClient'

export type MarketStreamState = {
  selectedMarketId: string
  setSelectedMarketId: (marketId: string) => void
  snapshot: MarketSnapshot | null
  snapshotConnected: boolean
  bestBackLayBySelectionId: Map<
    number,
    {
      back: Array<{ price: number; size: number }>
      lay: Array<{ price: number; size: number }>
      ltp?: number
    }
  >
  disconnect: () => void
}

export function useMarketStream(args: {
  wsUrl: string
  appKey: string
  sessionToken: string
  onInfo?: (m: UiMessage) => void
  onError?: (m: UiMessage) => void
}): MarketStreamState {
  const streamRef = useRef<StreamClient | null>(null)
  const [selectedMarketId, setSelectedMarketIdState] = useState<string>('')
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)

  const ensureClient = useCallback((): StreamClient => {
    if (streamRef.current) return streamRef.current

    const client = new StreamClient({
      wsUrl: args.wsUrl,
      appKey: args.appKey,
      sessionToken: args.sessionToken,
      onSnapshot: (s) => setSnapshot(s),
      onInfo: args.onInfo,
      onError: args.onError,
    })

    streamRef.current = client
    return client
  }, [args.appKey, args.onError, args.onInfo, args.sessionToken, args.wsUrl])

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

      if (!args.wsUrl || !args.appKey || !args.sessionToken) return

      const client = ensureClient()
      client.subscribeToMarket(marketId)
    },
    [args.appKey, args.sessionToken, args.wsUrl, ensureClient],
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
      }
    >()

    if (!snapshot) return map
    for (const r of snapshot.runners) {
      const back = (r.batb ?? []).slice(0, 3).map((x) => ({ price: x.price, size: x.size }))
      const lay = (r.batl ?? []).slice(0, 3).map((x) => ({ price: x.price, size: x.size }))
      map.set(r.selectionId, { back, lay, ltp: r.ltp })
    }

    return map
  }, [snapshot])

  return {
    selectedMarketId,
    setSelectedMarketId,
    snapshot,
    snapshotConnected: Boolean(snapshot),
    bestBackLayBySelectionId,
    disconnect,
  }
}
