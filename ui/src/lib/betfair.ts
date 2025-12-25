import type { ListMarketCatalogueResponse } from '../types/betfair'
import { UiError } from '../errors/UiError'
import { tauriInvoke } from './tauri'

type TauriInvokeUiError = { key: string; values?: Record<string, unknown> }

function extractInvokeUiError(e: unknown): TauriInvokeUiError | null {
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

      // Tauri may wrap structured errors into Error.message as JSON.
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

export type LoginArgs = {
  username: string
  password: string
}

export async function betfairLogin(args: LoginArgs): Promise<void> {
  try {
    await tauriInvoke<void>('auth_login', {
      args: { username: args.username, password: args.password },
    })
  } catch (e) {
    const extracted = extractInvokeUiError(e)
    if (extracted) throw new UiError(extracted)
    throw e
  }
}

export async function listNextHorseWinMarkets(): Promise<ListMarketCatalogueResponse> {
  const nowIso = new Date().toISOString()

  const requestBody = {
    filter: {
      eventTypeIds: ['7'],
      marketTypeCodes: ['WIN'],
      marketStartTime: { from: nowIso },
    },
    maxResults: '100',
    marketProjection: ['RUNNER_DESCRIPTION', 'EVENT', 'MARKET_START_TIME'],
    sort: 'FIRST_TO_START',
  }

  try {
    return await tauriInvoke<ListMarketCatalogueResponse>('betfair_rpc', {
      args: { service: 'betting', method: 'listMarketCatalogue', params: requestBody },
    })
  } catch (e) {
    const extracted = extractInvokeUiError(e)
    if (extracted) throw new UiError(extracted)
    throw e
  }
}
