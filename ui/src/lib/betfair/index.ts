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

// Account API
export { getAccountFunds, getAccountDetails } from './account'

// Betting API
export { listMarketCatalogue, listNextHorseWinMarkets } from './betting'
