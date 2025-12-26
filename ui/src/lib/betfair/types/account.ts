/**
 * Betfair Account API types
 */

export type Wallet = 'UK' | 'AUSTRALIAN'

export interface GetAccountFundsRequest {
  wallet?: Wallet
}

export interface AccountFunds {
  availableToBetBalance?: number
  exposure?: number
  retainedCommission?: number
  exposureLimit?: number
  discountRate?: number
  pointsBalance?: number
  wallet?: string
}

export interface AccountDetails {
  currencyCode?: string
  firstName?: string
  lastName?: string
  localeCode?: string
  region?: string
  timezone?: string
  discountRate?: number
  pointsBalance?: number
  countryCode?: string
}
