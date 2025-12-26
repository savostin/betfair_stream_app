/**
 * Betfair Betting API types
 */

import type { TimeRange } from './common'

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
