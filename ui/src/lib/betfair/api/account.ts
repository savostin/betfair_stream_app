/**
 * Betfair Account API (general methods)
 */

import { betfairInvokeSafe } from '@betfair/invoke'
import type { AccountDetails, AccountFunds, GetAccountFundsRequest, GetDeveloperAppKeysResponse, VendorClientIdResponse, ListCurrencyRatesResponse, GetAccountStatementResponse } from '@betfair/types/account'

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

/**
 * Get developer app keys
 */
export async function getDeveloperAppKeys(): Promise<GetDeveloperAppKeysResponse> {
  return betfairInvokeSafe<GetDeveloperAppKeysResponse>({
    service: 'account',
    method: 'getDeveloperAppKeys',
    params: {},
  })
}

/**
 * Get vendor client ID
 */
export async function getVendorClientId(): Promise<VendorClientIdResponse> {
  return betfairInvokeSafe<VendorClientIdResponse>({
    service: 'account',
    method: 'getVendorClientId',
    params: {},
  })
}

/**
 * List currency rates
 */
export async function listCurrencyRates(): Promise<ListCurrencyRatesResponse> {
  return betfairInvokeSafe<ListCurrencyRatesResponse>({
    service: 'account',
    method: 'listCurrencyRates',
    params: {},
  })
}

/**
 * Get account statement
 */
export async function getAccountStatement(options?: {
  locale?: string
  fromRecord?: number
  recordCount?: number
  includeSettledBets?: boolean
  includeCancelledOrders?: boolean
}): Promise<GetAccountStatementResponse> {
  const params = {
    ...(options?.locale && { locale: options.locale }),
    ...(options?.fromRecord !== undefined && { fromRecord: options.fromRecord }),
    ...(options?.recordCount !== undefined && { recordCount: options.recordCount }),
    ...(options?.includeSettledBets !== undefined && { includeSettledBets: options.includeSettledBets }),
    ...(options?.includeCancelledOrders !== undefined && { includeCancelledOrders: options.includeCancelledOrders }),
  }

  return betfairInvokeSafe<GetAccountStatementResponse>({
    service: 'account',
    method: 'getAccountStatement',
    params,
  })
}
