import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, type PropsWithChildren } from 'react'
import { AccountProvider } from '@hooks/accountContext'
import { MarketsProvider } from '@hooks/marketsContext'
import { NavigationProvider } from '@hooks/navigationContext'
import { NotificationsProvider } from '@hooks/notificationsContext'
import { OrdersProvider } from '@hooks/ordersContext'
import { SelectedMarketProvider } from '@hooks/selectedMarketContext'
import { SessionProvider } from '@hooks/sessionContext'
import { ColorModeProvider, useColorMode } from '@theme/ColorModeProvider'
import { createAppTheme } from '@theme/createAppTheme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
    },
  },
})

function MuiThemeProviders(props: PropsWithChildren): React.ReactNode {
  const { mode } = useColorMode()
  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {props.children}
    </ThemeProvider>
  )
}

export function AppProviders(props: PropsWithChildren): React.ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <NavigationProvider>
          <SessionProvider>
            <AccountProvider>
              <MarketsProvider>
                <SelectedMarketProvider>
                  <OrdersProvider>
                    <ColorModeProvider>
                      <MuiThemeProviders>{props.children}</MuiThemeProviders>
                    </ColorModeProvider>
                  </OrdersProvider>
                </SelectedMarketProvider>
              </MarketsProvider>
            </AccountProvider>
          </SessionProvider>
        </NavigationProvider>
      </NotificationsProvider>
    </QueryClientProvider>
  )
}
