import { useCallback, useEffect, useState } from 'react'
import type { AccountDetails, AccountFunds } from '@betfair'
import { getAccountDetails, getAccountFunds } from '@betfair'
import { getFundsRefreshInterval } from '../lib/storage'

export type FundsState = {
  funds: AccountFunds | null
  accountDetails: AccountDetails | null
  fundsLoading: boolean
  refreshFunds: () => Promise<void>
}

export function useFunds({
  isAuthed,
  onError,
}: {
  isAuthed: boolean
  onError?: (e: unknown) => void
}): FundsState {
  const [funds, setFunds] = useState<AccountFunds | null>(null)
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null)
  const [fundsLoading, setFundsLoading] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(() => getFundsRefreshInterval())

  const refreshFunds = useCallback(async () => {
    if (!isAuthed) {
      setFunds(null)
      setAccountDetails(null)
      return
    }

    setFundsLoading(true)
    try {
      const [fundsResult, detailsResult] = await Promise.all([
        getAccountFunds(),
        getAccountDetails(),
      ])
      setFunds(fundsResult)
      setAccountDetails(detailsResult)
    } catch (e) {
      onError?.(e)
      setFunds(null)
      setAccountDetails(null)
    } finally {
      setFundsLoading(false)
    }
  }, [isAuthed, onError])

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthed) {
      void refreshFunds()
    } else {
      setFunds(null)
    }
  }, [isAuthed, refreshFunds])

  // Periodic refresh
  useEffect(() => {
    if (!isAuthed) return

    // Update local interval state from storage
    const currentInterval = getFundsRefreshInterval()
    setRefreshInterval(currentInterval)

    const intervalId = setInterval(() => {
      void refreshFunds()
    }, currentInterval * 1000)

    return () => clearInterval(intervalId)
  }, [isAuthed, refreshFunds, refreshInterval])

  // Re-sync interval when storage might have changed
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshInterval(getFundsRefreshInterval())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return {
    funds,
    accountDetails,
    fundsLoading,
    refreshFunds,
  }
}
