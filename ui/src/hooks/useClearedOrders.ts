import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClearedOrderSummary, ClearedOrderSummaryReport } from '@betfair'
import { listClearedOrders } from '@betfair'
import type { ClearedOrderStatus } from '@betfair/types/common'

export type ClearedOrdersState = {
  clearedOrders: ClearedOrderSummary[]
  moreAvailable: boolean
  loading: boolean
  refresh: (opts?: RefreshOptions) => Promise<void>
  clear: () => void
}

export type RefreshOptions = {
  betStatus?: ClearedOrderStatus
  params?: {
    eventTypeIds?: string[]
    eventIds?: string[]
    marketIds?: string[]
    runnerIds?: string[]
    betIds?: string[]
    side?: 'BACK' | 'LAY'
    customerOrderRefs?: string[]
    customerStrategyRefs?: string[]
    includeItemDescription?: boolean
    fromRecord?: number
    recordCount?: number
    locale?: string
  }
}

export function useClearedOrders({
  isAuthed,
  defaultStatus = 'SETTLED',
  defaultParams,
  onLoaded,
  onError,
}: {
  isAuthed: boolean
  defaultStatus?: ClearedOrderStatus
  defaultParams?: RefreshOptions['params']
  onLoaded?: (count: number) => void
  onError?: (e: unknown) => void
}): ClearedOrdersState {
  const [clearedOrders, setClearedOrders] = useState<ClearedOrderSummary[]>([])
  const [moreAvailable, setMoreAvailable] = useState(false)
  const [loading, setLoading] = useState(false)

  const statusRef = useRef(defaultStatus)
  const paramsRef = useRef(defaultParams)
  const onLoadedRef = useRef(onLoaded)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    statusRef.current = defaultStatus
  }, [defaultStatus])

  useEffect(() => {
    paramsRef.current = defaultParams
  }, [defaultParams])

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const clear = useCallback(() => {
    setClearedOrders([])
    setMoreAvailable(false)
  }, [])

  const refresh = useCallback(async (opts?: RefreshOptions) => {
    if (!isAuthed) return
    setLoading(true)
    try {
      const betStatus = opts?.betStatus ?? statusRef.current
      const params = opts?.params ?? paramsRef.current
      const report: ClearedOrderSummaryReport = await listClearedOrders(betStatus, params)
      setClearedOrders(report.clearedOrders ?? [])
      setMoreAvailable(Boolean(report.moreAvailable))
      onLoadedRef.current?.(report.clearedOrders?.length ?? 0)
    } catch (e) {
      onErrorRef.current?.(e)
    } finally {
      setLoading(false)
    }
  }, [isAuthed])

  useEffect(() => {
    if (!isAuthed) return
    void refresh()
  }, [isAuthed, refresh])

  return { clearedOrders, moreAvailable, loading, refresh, clear }
}
