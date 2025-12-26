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

export interface DeveloperAppKey {
  appName?: string
  appId?: number
  appVersion?: string
  delayData?: boolean
  gpdrRetention?: boolean
  ipAddress?: string
  appType?: string
  lastUsedDate?: string
  creationDate?: string
  idempotencyKeys?: Array<{
    idempotencyKey?: string
    requestDate?: string
  }>
}

export interface GetDeveloperAppKeysResponse {
  appKeys: DeveloperAppKey[]
}

export interface VendorClientIdResponse {
  vendorClientId?: string
}

export interface CurrencyRate {
  currencyCode?: string
  rate?: number
}

export interface ListCurrencyRatesResponse {
  currencyRates: CurrencyRate[]
}

export interface StatementItem {
  refId?: string
  itemDate?: string
  amount?: number
  balance?: number
  itemClass?: string
  itemClassData?: Record<string, unknown>
  legacyData?: string
}

export interface GetAccountStatementResponse {
  moreAvailable?: boolean
  accountStatement: StatementItem[]
}
