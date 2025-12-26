import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '@features/settings/LanguageSelect'
import { ThemeModeToggle } from '@features/settings/ThemeModeToggle'
import { useAccountContext } from '@hooks/accountContext'
import { useNavigation } from '@hooks/navigationContext'
import { useNotifications } from '@hooks/notificationsContext'
import { useSessionContext } from '@hooks/sessionContext'
import { formatMoney, getCurrencySymbol } from '@lib/format'

export function AppShell(props: {
  children: React.ReactNode
}): React.ReactNode {
  const { t } = useTranslation(['common', 'auth', 'settings'])
  const session = useSessionContext()
  const account = useAccountContext()
  const notifications = useNotifications()
  const navigation = useNavigation()

  useEffect(() => {
    document.title = t('common:app.title')
  }, [t])

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: 16 }}>
            {t('common:app.title')}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {session.isAuthed && account.funds?.availableToBetBalance != null ? (
              <Chip
                label={`${getCurrencySymbol(account.accountCurrency)}${formatMoney(account.funds.availableToBetBalance, '0.00')}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            ) : null}

            {navigation.currentPage === 'settings' ? (
              <Button color="inherit" onClick={() => navigation.navigate('main')}>
                {t('common:actions.back')}
              </Button>
            ) : (
              <Button color="inherit" onClick={() => navigation.navigate('settings')}>
                {t('settings:panel.title')}
              </Button>
            )}

            <Box sx={{ minWidth: 150 }}>
              <LanguageSelect />
            </Box>
            <ThemeModeToggle />
            {session.isAuthed ? (
              <Button color="inherit" onClick={session.logout}>
                {t('auth:logout')}
              </Button>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>{props.children}</Box>

      <Paper elevation={1} sx={{ bgcolor: 'background.paper', px: 2, py: 1, borderTop: 1, borderTopColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {notifications._statusMessage}
        </Typography>
      </Paper>

      <Snackbar
        open={Boolean(notifications._snackbar)}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return
          notifications._clearSnackbar()
        }}
        autoHideDuration={notifications._snackbar?.severity === 'info' ? 2500 : 6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 64, sm: 72 } }}
      >
        <Alert
          severity={notifications._snackbar?.severity ?? 'info'}
          variant="filled"
          onClose={notifications._clearSnackbar}
          sx={{ width: '100%' }}
        >
          {notifications._snackbar?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
