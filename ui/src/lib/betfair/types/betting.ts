/**
 * Betfair Betting API types
 */

import type { TimeRange, PriceSize, Side, PersistenceType, OrderType } from './common'

export interface MarketFilter {
  eventTypeIds?: string[] // e.g., "7" for Horse Racing, "1" for Football
  eventIds?: string[]
  competitionIds?: string[]
  marketIds?: string[]
  marketTypeCodes?: string[] // e.g., "WIN", "MATCH_ODDS"
  marketStartTime?: TimeRange
  venues?: string[]
  countryCodes?: string[] // e.g., "GB", "IE", "US"
  bspMarket?: boolean
  turnInPlayEnabled?: boolean
  textQuery?: string
  bettingTypes?: string[]
}

export type MarketProjection =
  | 'COMPETITION'
  | 'EVENT'
  | 'EVENT_TYPE'
  | 'MARKET_START_TIME'
  | 'MARKET_DESCRIPTION'
  | 'RUNNER_DESCRIPTION'
  | 'RUNNER_METADATA'

export type MarketSort =
  | 'MINIMUM_TRADED'
  | 'MAXIMUM_TRADED'
  | 'MINIMUM_AVAILABLE'
  | 'MAXIMUM_AVAILABLE'
  | 'FIRST_TO_START'
  | 'LAST_TO_START'

export interface MarketCatalogueRunner {
  selectionId: number
  runnerName: string
  handicap?: number
  sortPriority?: number
  metadata?: {
    runnerId?: number
    [key: string]: unknown
  }
}

export interface MarketCatalogue {
  marketId: string
  marketName: string
  totalMatched?: number
  marketStartTime?: string
  runners?: MarketCatalogueRunner[]
  event?: {
    id?: string
    name?: string
    countryCode?: string
    timezone?: string
    venue?: string
    openDate?: string
  }
  competition?: {
    id?: string
    name?: string
  }
  description?: {
    bettingType?: string
    marketType?: string
    marketTime?: string
    [key: string]: unknown
  }
}

export interface ListMarketCatalogueRequest {
  filter: MarketFilter
  marketProjection?: MarketProjection[]
  sort?: MarketSort
  maxResults?: string // API expects string like "100"
}

// Browse results
export interface EventTypeResult {
  eventType: { id: string; name: string }
  marketCount: number
}

export interface CompetitionResult {
  competition: { id: string; name: string }
  marketCount: number
  eventType?: { id: string }
}

export interface EventResult {
  event: { id: string; name: string; countryCode?: string; timezone?: string; venue?: string; openDate?: string }
  marketCount: number
}

export interface TimeRangeResult {
  timeRange: TimeRange
  marketCount: number
}

export interface CountryCodeResult {
  countryCode: string
  marketCount: number
}

export interface VenueResult {
  venue: string
  marketCount: number
}

export interface MarketTypeResult {
  marketType: string
  marketCount: number
}

// Projections
export interface PriceProjection {
  priceData?: Array<'EX_ALL_OFFERS' | 'EX_BEST_OFFERS' | 'EX_TRADED' | 'SP_AVAILABLE' | 'SP_TRADED'>
  virtualise?: boolean
  rolloverStakes?: boolean
}

export type OrderProjection = 'ALL' | 'EXECUTABLE' | 'EXECUTION_COMPLETE'
export type MatchProjection = 'NO_ROLLUP' | 'ROLLED_UP_BY_PRICE' | 'ROLLED_UP_BY_AVG_PRICE'

// Market book
export interface RunnerExchangePrices {
  availableToBack?: PriceSize[]
  availableToLay?: PriceSize[]
  tradedVolume?: PriceSize[]
}

export interface Runner {
  selectionId: number
  handicap?: number
  status?: string
  lastPriceTraded?: number
  totalMatched?: number
  ex?: RunnerExchangePrices
}

export interface MarketBook {
  marketId: string
  isRunnersVoidable?: boolean
  totalMatched?: number
  runners?: Runner[]
}

// Orders
export interface CurrentOrderSummary {
  betId: string
  marketId: string
  selectionId: number
  side: Side
  priceSize?: PriceSize
  price?: number
  size?: number
  status: 'EXECUTABLE' | 'EXECUTION_COMPLETE'
  persistenceType?: PersistenceType
  placedDate?: string
  matchedDate?: string
  customerOrderRef?: string
  customerStrategyRef?: string
}

export interface ListCurrentOrdersResponse {
  currentOrders: CurrentOrderSummary[]
  moreAvailable?: boolean
}

export interface PlaceInstruction {
  selectionId: number
  side: Side
  orderType: 'LIMIT' | 'LIMIT_ON_CLOSE' | 'MARKET_ON_CLOSE'
  limitOrder?: { size: number; price: number; persistenceType: PersistenceType }
  limitOnCloseOrder?: { liability: number; price: number }
  marketOnCloseOrder?: { liability: number }
}

export interface PlaceExecutionReport {
  status: 'SUCCESS' | 'FAILURE' | 'PROCESSED_WITH_ERRORS'
  marketId?: string
  instructionReports?: Array<{
    status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT'
    betId?: string
    errorCode?: string
    orderStatus?: string
    placedDate?: string
    averagePriceMatched?: number
    sizeMatched?: number
  }>
}

export interface CancelInstruction {
  betId?: string
  sizeReduction?: number
}

export interface CancelExecutionReport {
  status: string
  instructionReports?: Array<{
    status: string
    errorCode?: string
    sizeCancelled?: number
    cancelledDate?: string
  }>
}

export interface ReplaceInstruction {
  betId: string
  newPrice: number
}

export interface ReplaceExecutionReport {
  status: string
  instructionReports?: Array<{
    status: string
    cancelReport?: CancelExecutionReport
    placeReport?: PlaceExecutionReport
  }>
}

export interface UpdateInstruction {
  betId: string
  newPersistenceType: PersistenceType
}

export interface UpdateExecutionReport {
  status: string
  instructionReports?: Array<{
    status: string
    errorCode?: string
  }>
}

// Cleared orders
export interface ItemDescription {
  eventTypeDesc?: string
  eventDesc?: string
  marketDesc?: string
  selectionDesc?: string
  marketType?: string
}

export interface ClearedOrderSummary {
  eventTypeId?: string
  eventId?: string
  marketId?: string
  selectionId?: number
  handicap?: number
  betId?: string
  placedDate?: string
  persistenceType?: PersistenceType
  orderType?: OrderType
  side?: Side
  price?: number
  size?: number
  bsp?: number
  settledDate?: string
  profit?: number
  commission?: number
  priceMatched?: number
  priceReduced?: boolean
  sizeReduced?: number
  customerOrderRef?: string
  customerStrategyRef?: string
  itemDescription?: ItemDescription
}

export interface ClearedOrderSummaryReport {
  clearedOrders: ClearedOrderSummary[]
  moreAvailable?: boolean
}

// Market profit and loss
export interface RunnerProfitAndLoss {
  selectionId?: number
  ifWin?: number
  ifLose?: number
  ifPlace?: number
}

export interface MarketProfitAndLoss {
  marketId?: string
  commissionApplied?: number
  profitAndLosses?: RunnerProfitAndLoss[]
}

export interface ListMarketProfitAndLossResponse {
  result?: MarketProfitAndLoss[]
}
