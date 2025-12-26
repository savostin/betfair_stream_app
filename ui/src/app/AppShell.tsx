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
  type AlertColor,
} from '@mui/material'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMoney, getCurrencySymbol } from '@lib/format'
import type { AccountFunds } from '@betfair'
import { LanguageSelect } from '@features/settings/LanguageSelect'
import { ThemeModeToggle } from '@features/settings/ThemeModeToggle'

export type SnackbarState =
  | null
  | {
      severity: AlertColor
      message: string
    }

export function AppShell(props: {
  isAuthed: boolean
  onLogout?: () => void
  isSettingsPage?: boolean
  onOpenSettings?: () => void
  onCloseSettings?: () => void
  snackbar: SnackbarState
  onCloseSnackbar: () => void
  funds: AccountFunds | null
  accountCurrency: string | null
  statusMessage: string
  children: React.ReactNode
}): React.ReactNode {
  const { t } = useTranslation(['common', 'auth', 'settings'])

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
            {props.isAuthed && props.funds?.availableToBetBalance != null ? (
              <Chip
                label={`${getCurrencySymbol(props.accountCurrency)}${formatMoney(props.funds.availableToBetBalance, '0.00')}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            ) : null}

            {props.isSettingsPage && props.onCloseSettings ? (
              <Button color="inherit" onClick={props.onCloseSettings}>
                {t('common:actions.back')}
              </Button>
            ) : !props.isSettingsPage && props.onOpenSettings ? (
              <Button color="inherit" onClick={props.onOpenSettings}>
                {t('settings:panel.title')}
              </Button>
            ) : null}

            <Box sx={{ minWidth: 150 }}>
              <LanguageSelect />
            </Box>
            <ThemeModeToggle />
            {props.isAuthed && props.onLogout ? (
              <Button color="inherit" onClick={props.onLogout}>
                {t('auth:logout')}
              </Button>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>{props.children}</Box>

      <Paper elevation={1} sx={{ bgcolor: 'background.paper', px: 2, py: 1, borderTop: 1, borderTopColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {props.statusMessage}
        </Typography>
      </Paper>

      <Snackbar
        open={Boolean(props.snackbar)}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return
          props.onCloseSnackbar()
        }}
        autoHideDuration={props.snackbar?.severity === 'info' ? 2500 : 6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 64, sm: 72 } }}
      >
        <Alert
          severity={props.snackbar?.severity ?? 'info'}
          variant="filled"
          onClose={props.onCloseSnackbar}
          sx={{ width: '100%' }}
        >
          {props.snackbar?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
