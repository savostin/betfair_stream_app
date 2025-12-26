/**
 * Betfair Account API methods
 */

import { tauriInvoke } from '../tauri'
import { UiError } from '../../errors/UiError'
import { extractInvokeUiError } from './errors'
import type { AccountDetails, AccountFunds, GetAccountFundsRequest } from './types/account'

/**
 * Get account funds with optional wallet specification
 */
export async function getAccountFunds(request?: GetAccountFundsRequest): Promise<AccountFunds> {
  const params = request?.wallet ? { wallet: request.wallet } : { wallet: 'UK' }

  try {
    return await tauriInvoke<AccountFunds>('betfair_rpc', {
      args: {
        service: 'account',
        method: 'getAccountFunds',
        params,
      },
    })
  } catch (e) {
    const extracted = extractInvokeUiError(e)
    if (extracted) throw new UiError(extracted)
    throw e
  }
}

/**
 * Get account details including currency code
 */
export async function getAccountDetails(): Promise<AccountDetails> {
  try {
    return await tauriInvoke<AccountDetails>('betfair_rpc', {
      args: {
        service: 'account',
        method: 'getAccountDetails',
        params: {},
      },
    })
  } catch (e) {
    const extracted = extractInvokeUiError(e)
    if (extracted) throw new UiError(extracted)
    throw e
  }
}
