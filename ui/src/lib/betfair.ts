/**
 * Legacy betfair.ts - re-exports from new structure + auth functions
 * 
 * This file is kept for backwards compatibility and auth-related functions.
 * For new code, import directly from './betfair/' (the module folder).
 */

import { authInvokeSafe } from '@betfair/invoke'

// Re-export everything from the new modular structure
export * from '@betfair/index'

// Auth functions (kept in this file)
export type LoginArgs = {
  username: string
  password: string
}

export async function betfairLogin(args: LoginArgs): Promise<void> {
  await authInvokeSafe<void>('auth_login', { username: args.username, password: args.password })
}
