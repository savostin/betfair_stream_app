import { Box, Container } from '@mui/material'
import { AppShell } from '@app/AppShell'
import { LoginController } from '@features/auth/LoginController'
import { useNavigation } from '@hooks/navigationContext'
import { useSessionContext } from '@hooks/sessionContext'
import { routes } from '@pages/Router'

function App() {
  const session = useSessionContext()
  const { currentPage } = useNavigation()

  const PageComponent = routes[currentPage]

  return (
    <AppShell>
      {!session.isAuthed ? (
        <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <LoginController login={session.login} />
        </Container>
      ) : (
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
            <PageComponent />
          </Box>
        </Container>
      )}
    </AppShell>
  )
}

export default App
