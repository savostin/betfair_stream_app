import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SnackbarState } from '../app/AppShell'
import { isUiError } from '../errors/UiError'
import type { UiMessage } from '../lib/stream'

export type UseAppSnackbar = {
  snackbar: SnackbarState
  clearSnackbar: () => void
  showInfo: (key: string, values?: Record<string, unknown>) => void
  showError: (key: string, values?: Record<string, unknown>) => void
  showFromUiMessage: (severity: 'info' | 'error', msg: UiMessage) => void
  showFromUnknownError: (e: unknown) => void
}

export function useAppSnackbar(): UseAppSnackbar {
  const { t } = useTranslation(['common', 'auth', 'markets', 'errors'])
  const [snackbar, setSnackbar] = useState<SnackbarState>(null)

  const clearSnackbar = useCallback(() => setSnackbar(null), [])

  const showInfo = useCallback(
    (key: string, values?: Record<string, unknown>) => {
      setSnackbar({ severity: 'info', message: t(key, values) })
    },
    [t],
  )

  const showError = useCallback(
    (key: string, values?: Record<string, unknown>) => {
      setSnackbar({ severity: 'error', message: t(key, values) })
    },
    [t],
  )

  const showFromUiMessage = useCallback(
    (severity: 'info' | 'error', msg: UiMessage) => {
      if (severity === 'info') showInfo(msg.key, msg.values)
      else showError(msg.key, msg.values)
    },
    [showError, showInfo],
  )

  const showFromUnknownError = useCallback(
    (e: unknown) => {
      if (isUiError(e)) {
        showError(e.key, e.values)
        return
      }

      if (e instanceof Error && e.message) {
        showError('errors:unexpected.withDetails', { details: e.message })
        return
      }

      showError('errors:unexpected.title')
    },
    [showError],
  )

  return {
    snackbar,
    clearSnackbar,
    showInfo,
    showError,
    showFromUiMessage,
    showFromUnknownError,
  }
}
