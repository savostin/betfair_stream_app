/**
 * TanStack Query hooks for Betfair API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAccountFunds,
  getAccountDetails,
  listNextHorseWinMarkets,
  listCurrentOrders,
  getAccountStatement,
} from '@betfair'

/**
 * Fetch account funds
 */
export function useAccountFunds(enabled = true) {
  return useQuery({
    queryKey: ['accountFunds'],
    queryFn: () => getAccountFunds(),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Fetch account details
 */
export function useAccountDetails(enabled = true) {
  return useQuery({
    queryKey: ['accountDetails'],
    queryFn: () => getAccountDetails(),
    enabled,
    staleTime: 60 * 1000, // 60 seconds
  })
}

/**
 * Fetch next horse racing WIN markets
 */
export function useNextHorseWinMarkets(enabled = true) {
  return useQuery({
    queryKey: ['markets', 'horseWin'],
    queryFn: () => listNextHorseWinMarkets(),
    enabled,
    staleTime: 10 * 1000, // 10 seconds
  })
}

/**
 * Fetch current orders
 */
export function useCurrentOrders(enabled = true) {
  return useQuery({
    queryKey: ['currentOrders'],
    queryFn: () => listCurrentOrders(),
    enabled,
    staleTime: 15 * 1000, // 15 seconds
  })
}

/**
 * Fetch account statement
 */
export function useAccountStatement(
  options?: { locale?: string; fromRecord?: number; recordCount?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ['accountStatement', options],
    queryFn: () => getAccountStatement(options),
    enabled,
    staleTime: 60 * 1000, // 60 seconds
  })
}

/**
 * Mutation hook for refreshing account funds
 */
export function useRefreshAccountFunds() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => getAccountFunds(),
    onSuccess: (data) => {
      queryClient.setQueryData(['accountFunds'], data)
    },
  })
}

/**
 * Mutation hook for refreshing markets
 */
export function useRefreshMarkets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => listNextHorseWinMarkets(),
    onSuccess: (data) => {
      queryClient.setQueryData(['markets', 'horseWin'], data)
    },
  })
}

/**
 * Invalidate all queries (useful on logout)
 */
export function useInvalidateAllQueries() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries()
  }
}
