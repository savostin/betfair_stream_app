/**
 * Error handling utilities for Betfair API calls
 */

export type TauriInvokeUiError = { key: string; values?: Record<string, unknown> }

/**
 * Extract structured UI error from various Tauri invoke error shapes
 */
export function extractInvokeUiError(e: unknown): TauriInvokeUiError | null {
  if (typeof e === 'object' && e !== null) {
    const anyErr = e as any

    if (typeof anyErr.key === 'string') {
      return { key: anyErr.key, values: anyErr.values ?? undefined }
    }

    if (typeof anyErr.error === 'object' && anyErr.error !== null && typeof anyErr.error.key === 'string') {
      return { key: anyErr.error.key, values: anyErr.error.values ?? undefined }
    }

    if (typeof anyErr.message === 'string') {
      const msg = anyErr.message.trim()

      if (msg.startsWith('errors:')) {
        return { key: msg, values: {} }
      }

      if (msg.startsWith('{') && msg.endsWith('}')) {
        try {
          const parsed = JSON.parse(msg)
          if (parsed && typeof parsed.key === 'string') {
            return { key: parsed.key, values: parsed.values ?? undefined }
          }
          if (parsed && parsed.error && typeof parsed.error.key === 'string') {
            return { key: parsed.error.key, values: parsed.error.values ?? undefined }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (typeof e === 'string') {
    const msg = e.trim()
    if (msg.startsWith('errors:')) return { key: msg, values: {} }
    if (msg.startsWith('{') && msg.endsWith('}')) {
      try {
        const parsed = JSON.parse(msg)
        if (parsed && typeof parsed.key === 'string') {
          return { key: parsed.key, values: parsed.values ?? undefined }
        }
      } catch {
        // ignore
      }
    }
  }

  return null
}
