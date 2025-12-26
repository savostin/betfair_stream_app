/**
 * Betfair Account API (general methods)
 */

import { betfairInvokeSafe } from '@betfair/invoke'
import type { AccountDetails, AccountFunds, GetAccountFundsRequest } from '@betfair/types/account'

/**
 * Get account funds
 */
export async function getAccountFunds(request?: GetAccountFundsRequest): Promise<AccountFunds> {
  const params = request ?? { wallet: 'UK' }

  return betfairInvokeSafe<AccountFunds>({
    service: 'account',
    method: 'getAccountFunds',
    params,
  })
}

/**
 * Get account details (includes currencyCode)
 */
export async function getAccountDetails(): Promise<AccountDetails> {
  return betfairInvokeSafe<AccountDetails>({
    service: 'account',
    method: 'getAccountDetails',
    params: {},
  })
}
