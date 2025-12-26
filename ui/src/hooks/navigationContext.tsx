import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import type { Page } from '@pages/Router'

export type NavigationValue = {
  currentPage: Page
  navigate: (page: Page) => void
  reset: () => void
}

const NavigationContext = createContext<NavigationValue | undefined>(undefined)

export function NavigationProvider({ children }: PropsWithChildren): React.ReactNode {
  const [currentPage, setCurrentPage] = useState<Page>('main')

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page)
  }, [])

  const reset = useCallback(() => {
    setCurrentPage('main')
  }, [])

  const value = useMemo<NavigationValue>(
    () => ({
      currentPage,
      navigate,
      reset,
    }),
    [currentPage, navigate, reset],
  )

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation(): NavigationValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('NavigationProvider is missing')
  return ctx
}
