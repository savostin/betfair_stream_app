/**
 * Hook for fetching market profit and loss data
 */

import { useQuery } from '@tanstack/react-query'
import { listMarketProfitAndLoss } from '@betfair'
import type { RunnerProfitAndLoss } from '@betfair'

export function useMarketProfitAndLoss(marketId: string | null, enabled = true) {
  const query = useQuery({
    queryKey: ['marketProfitAndLoss', marketId],
    queryFn: async () => {
      if (!marketId) return null
      const result = await listMarketProfitAndLoss([marketId], { 
        includeSettledBets: false,
        includeBspBets: false,
        netOfCommission: true,
      })
      return result[0] ?? null
    },
    enabled: enabled && !!marketId,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 5 * 1000, // Poll every 5 seconds
  })

  // Create a map of selectionId -> P&L for easy lookup
  const pnlBySelection = new Map<number, RunnerProfitAndLoss>()
  if (query.data?.profitAndLosses) {
    for (const runner of query.data.profitAndLosses) {
      if (runner.selectionId !== undefined) {
        pnlBySelection.set(runner.selectionId, runner)
      }
    }
  }

  return {
    data: query.data,
    pnlBySelection,
    isLoading: query.isLoading,
    error: query.error,
  }
}
