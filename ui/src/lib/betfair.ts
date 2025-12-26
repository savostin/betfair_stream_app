/**
 * Legacy betfair.ts - re-exports from new structure + auth functions
 * 
 * This file is kept for backwards compatibility and auth-related functions.
 * For new code, import directly from './betfair/' (the module folder).
 */

import { UiError } from '../errors/UiError'
import { tauriInvoke } from './tauri'
import { extractInvokeUiError } from './betfair/errors'

// Re-export everything from the new modular structure
export * from './betfair/index'

// Auth functions (kept in this file)
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
