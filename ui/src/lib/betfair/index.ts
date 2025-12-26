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
  DeveloperAppKey,
  GetDeveloperAppKeysResponse,
  VendorClientIdResponse,
  CurrencyRate,
  ListCurrencyRatesResponse,
  StatementItem,
  GetAccountStatementResponse,
} from './types/account'
export type {
  MarketFilter,
  MarketProjection,
  MarketSort,
  MarketCatalogueRunner,
  MarketCatalogue,
  ListMarketCatalogueRequest,
  ItemDescription,
  ClearedOrderSummary,
  ClearedOrderSummaryReport,
} from './types/betting'

// Account API (general)
export { getAccountFunds, getAccountDetails, getDeveloperAppKeys, getVendorClientId, listCurrencyRates, getAccountStatement } from './api/account'

// Betting API
export {
  listMarketCatalogue,
  listEventTypes,
  listCompetitions,
  listTimeRanges,
  listEvents,
  listMarketTypes,
  listCountries,
  listVenues,
  listMarketBook,
  listRunnerBook,
  listCurrentOrders,
  listClearedOrders,
  placeOrders,
  cancelOrders,
  replaceOrders,
  updateOrders,
} from './api/betting'
export { listNextHorseWinMarkets } from './betting'
// Auth
export { betfairLogin } from '@lib/betfair'
