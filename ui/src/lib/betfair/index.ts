/**
 * Betfair API client - re-exports
 */

// Types
export type { TimeRange, BettingType } from './types/common'
export type {
  Wallet,
  GetAccountFundsRequest,
  AccountFunds,
  AccountDetails,
} from './types/account'
export type {
  MarketFilter,
  MarketProjection,
  MarketSort,
  MarketCatalogueRunner,
  MarketCatalogue,
  ListMarketCatalogueRequest,
} from './types/betting'

// Account API (general)
export { getAccountFunds, getAccountDetails } from './api/account'

// Betting API
export { listMarketCatalogue } from './api/betting'
export { listNextHorseWinMarkets } from './betting'
// Auth
export { betfairLogin } from '../betfair'
