import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import type { AlertColor } from '@mui/material'
import { isUiError } from '@errors/UiError'
import type { UiMessage } from '@lib/stream'

export type SnackbarState =
  | null
  | {
      severity: AlertColor
      message: string
    }

export type NotificationsValue = {
  error: (messageOrError: string | UiMessage | unknown) => void
  warn: (message: string | UiMessage) => void
  info: (message: string | UiMessage) => void
  status: (message: string) => void
  // Internal state for AppShell to render
  _snackbar: SnackbarState
  _clearSnackbar: () => void
  _statusMessage: string
}

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined)

export function NotificationsProvider({ children }: PropsWithChildren): React.ReactNode {
  const { t } = useTranslation(['common', 'auth', 'markets', 'errors'])
  const [snackbar, setSnackbar] = useState<SnackbarState>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const clearSnackbar = useCallback(() => setSnackbar(null), [])

  const showSnackbar = useCallback(
    (key: string, values: Record<string, unknown> | undefined, severity: AlertColor) => {
      setSnackbar({ severity, message: t(key, values) })
    },
    [t],
  )

  const error = useCallback(
    (messageOrError: string | UiMessage | unknown) => {
      if (typeof messageOrError === 'string') {
        showSnackbar(messageOrError, undefined, 'error')
      } else if (messageOrError && typeof messageOrError === 'object' && 'key' in messageOrError) {
        const msg = messageOrError as UiMessage
        showSnackbar(msg.key, msg.values, 'error')
      } else {
        // Unknown error
        if (isUiError(messageOrError)) {
          showSnackbar(messageOrError.key, messageOrError.values, 'error')
        } else if (messageOrError instanceof Error && messageOrError.message) {
          showSnackbar('errors:unexpected.withDetails', { details: messageOrError.message }, 'error')
        } else {
          showSnackbar('errors:unexpected.title', undefined, 'error')
        }
      }
    },
    [showSnackbar],
  )

  const warn = useCallback(
    (message: string | UiMessage) => {
      if (typeof message === 'string') {
        showSnackbar(message, undefined, 'warning')
      } else {
        showSnackbar(message.key, message.values, 'warning')
      }
    },
    [showSnackbar],
  )

  const info = useCallback(
    (message: string | UiMessage) => {
      // Info goes to status bar instead of snackbar to avoid noise
      if (typeof message === 'string') {
        setStatusMessage(message)
      } else {
        // For UiMessage, we need translation - for now use key
        setStatusMessage(message.key)
      }
    },
    [],
  )

  const status = useCallback((message: string) => {
    setStatusMessage(message)
  }, [])

  const value = useMemo<NotificationsValue>(
    () => ({
      error,
      warn,
      info,
      status,
      _snackbar: snackbar,
      _clearSnackbar: clearSnackbar,
      _statusMessage: statusMessage,
    }),
    [error, warn, info, status, snackbar, clearSnackbar, statusMessage],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('NotificationsProvider is missing')
  return ctx
}
