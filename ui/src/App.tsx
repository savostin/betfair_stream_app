import { Box, Container } from '@mui/material'
import { useState } from 'react'

import { AppShell } from './app/AppShell'
import { AuthGate } from './app/AuthGate'
import { useAppModel } from './app/useAppModel'
import { LoginController } from './features/auth/LoginController'
import { MarketsView } from './features/markets/MarketsView'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  const model = useAppModel()
  const [page, setPage] = useState<'main' | 'settings'>('main')

  function onLogout(): void {
    setPage('main')
    model.logout()
  }

  return (
    <AppShell
      isAuthed={model.isAuthed}
      onLogout={model.isAuthed ? onLogout : undefined}
      isSettingsPage={page === 'settings'}
      onOpenSettings={page !== 'settings' ? () => setPage('settings') : undefined}
      onCloseSettings={page === 'settings' ? () => setPage('main') : undefined}
      snackbar={model.snackbar}
      onCloseSnackbar={model.clearSnackbar}
      funds={model.funds}
    >
      <Container
        maxWidth={false}
        sx={{
          pt: 2,
          pb: 0,
          px: { xs: 1, sm: 2 },
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {page === 'settings' ? (
            <SettingsPage />
          ) : (
            <AuthGate
              isAuthed={model.isAuthed}
              unauthenticated={
                <LoginController
                  login={model.login}
                />
              }
              authenticated={
                <MarketsView
                  markets={model.markets}
                  marketsLoading={model.marketsLoading}
                  selectedMarketId={model.selectedMarketId}
                  selectedMarket={model.selectedMarket}
                  onRefreshMarkets={model.refreshMarkets}
                  onSelectMarket={model.setSelectedMarketId}
                  bestBackLayBySelectionId={model.bestBackLayBySelectionId}
                  snapshotConnected={model.snapshotConnected}
                  marketTradedVolume={model.marketTradedVolume}
                />
              }
            />
          )}
        </Box>
      </Container>
    </AppShell>
  )
}

export default App
