import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react'
import { useCurrentOrders } from '@lib/queries'
import { useSessionContext } from './sessionContext'
import { useNotifications } from './notificationsContext'

export type OrdersValue = {
  orders: ReturnType<typeof useCurrentOrders>['data'] | null
  isLoading: boolean
  error: unknown
  refresh: () => Promise<void>
}

const OrdersContext = createContext<OrdersValue | undefined>(undefined)

export function OrdersProvider({ children }: PropsWithChildren): React.ReactNode {
  const { isAuthed } = useSessionContext()
  const notifications = useNotifications()
  const ordersQuery = useCurrentOrders(isAuthed)

  useEffect(() => {
    if (ordersQuery.error) notifications.error(ordersQuery.error)
  }, [notifications, ordersQuery.error])

  const value = useMemo<OrdersValue>(
    () => ({
      orders: ordersQuery.data ?? null,
      isLoading: ordersQuery.isLoading,
      error: ordersQuery.error ?? null,
      refresh: async () => {
        await ordersQuery.refetch()
      },
    }),
    [ordersQuery.data, ordersQuery.error, ordersQuery.isLoading, ordersQuery.refetch],
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrdersContext(): OrdersValue {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('OrdersProvider is missing')
  return ctx
}
