/**
 * Betfair RPC invoke helper
 */
import { tauriInvoke } from '@lib/tauri'
import { UiError } from '@errors/UiError'
import { extractInvokeUiError } from '@betfair/errors'

export type BetfairService = 'account' | 'betting' | 'heartbeat'

export async function betfairInvoke<T>(args: {
  service: BetfairService
  method: string
  params: unknown
}): Promise<T> {
  return tauriInvoke<T>('betfair_rpc', { args })
}

/**
 * Safe wrapper: invokes Betfair RPC and throws UiError on structured errors
 */
export async function betfairInvokeSafe<T>(args: {
  service: BetfairService
  method: string
  params: unknown
}): Promise<T> {
  try {
    return await betfairInvoke<T>(args)
  } catch (e) {
    const extracted = extractInvokeUiError(e)
    if (extracted) throw new UiError(extracted)
    throw e
  }
}

/**
 * Auth-safe wrapper: invokes auth commands and throws UiError on structured errors
 */
export async function authInvokeSafe<T>(command: 'auth_login', args: Record<string, unknown>): Promise<T> {
  try {
    return await tauriInvoke<T>(command, { args })
  } catch (e) {
    const extracted = extractInvokeUiError(e)
    if (extracted) throw new UiError(extracted)
    throw e
  }
}
