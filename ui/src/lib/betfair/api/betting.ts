/**
 * Betfair Betting API (general methods)
 */

import { betfairInvokeSafe } from '@betfair/invoke'
import type {
  MarketCatalogue,
  MarketFilter,
  MarketProjection,
  MarketSort,
  EventTypeResult,
  CompetitionResult,
  EventResult,
  TimeRangeResult,
  CountryCodeResult,
  VenueResult,
  MarketTypeResult,
  PriceProjection,
  OrderProjection,
  MatchProjection,
  MarketBook,
  ListCurrentOrdersResponse,
  PlaceInstruction,
  PlaceExecutionReport,
  CancelInstruction,
  CancelExecutionReport,
  ReplaceInstruction,
  ReplaceExecutionReport,
  UpdateInstruction,
  UpdateExecutionReport,
  ClearedOrderSummaryReport,
} from '@betfair/types/betting'
import type { TimeGranularity, ClearedOrderStatus } from '@betfair/types/common'

/**
 * List market catalogue with full filter support
 */
export async function listMarketCatalogue(
  filter: MarketFilter,
  options?: {
    marketProjection?: MarketProjection[]
    sort?: MarketSort
    maxResults?: number
  },
): Promise<MarketCatalogue[]> {
  const requestBody = {
    filter,
    ...(options?.marketProjection && { marketProjection: options.marketProjection }),
    ...(options?.sort && { sort: options.sort }),
    ...(options?.maxResults && { maxResults: String(options.maxResults) }),
  }

  return betfairInvokeSafe<MarketCatalogue[]>({
    service: 'betting',
    method: 'listMarketCatalogue',
    params: requestBody,
  })
}

export async function listEventTypes(filter: MarketFilter): Promise<EventTypeResult[]> {
  return betfairInvokeSafe<EventTypeResult[]>({ service: 'betting', method: 'listEventTypes', params: { filter } })
}

export async function listCompetitions(filter: MarketFilter): Promise<CompetitionResult[]> {
  return betfairInvokeSafe<CompetitionResult[]>({ service: 'betting', method: 'listCompetitions', params: { filter } })
}

export async function listTimeRanges(filter: MarketFilter, granularity: TimeGranularity): Promise<TimeRangeResult[]> {
  return betfairInvokeSafe<TimeRangeResult[]>({ service: 'betting', method: 'listTimeRanges', params: { filter, granularity } })
}

export async function listEvents(filter: MarketFilter): Promise<EventResult[]> {
  return betfairInvokeSafe<EventResult[]>({ service: 'betting', method: 'listEvents', params: { filter } })
}

export async function listMarketTypes(filter: MarketFilter): Promise<MarketTypeResult[]> {
  return betfairInvokeSafe<MarketTypeResult[]>({ service: 'betting', method: 'listMarketTypes', params: { filter } })
}

export async function listCountries(filter: MarketFilter): Promise<CountryCodeResult[]> {
  return betfairInvokeSafe<CountryCodeResult[]>({ service: 'betting', method: 'listCountries', params: { filter } })
}

export async function listVenues(filter: MarketFilter): Promise<VenueResult[]> {
  return betfairInvokeSafe<VenueResult[]>({ service: 'betting', method: 'listVenues', params: { filter } })
}

export async function listMarketBook(
  marketIds: string[],
  priceProjection?: PriceProjection,
  options?: {
    orderProjection?: OrderProjection
    matchProjection?: MatchProjection
    includeOverallPosition?: boolean
    partitionMatchedBySelection?: boolean
    customerStrategyRefs?: string[]
    currencyCode?: string
    locale?: string
  },
): Promise<MarketBook[]> {
  const params = {
    marketIds,
    ...(priceProjection && { priceProjection }),
    ...(options?.orderProjection && { orderProjection: options.orderProjection }),
    ...(options?.matchProjection && { matchProjection: options.matchProjection }),
    ...(options?.includeOverallPosition !== undefined && { includeOverallPosition: options.includeOverallPosition }),
    ...(options?.partitionMatchedBySelection !== undefined && { partitionMatchedBySelection: options.partitionMatchedBySelection }),
    ...(options?.customerStrategyRefs && { customerStrategyRefs: options.customerStrategyRefs }),
    ...(options?.currencyCode && { currencyCode: options.currencyCode }),
    ...(options?.locale && { locale: options.locale }),
  }

  return betfairInvokeSafe<MarketBook[]>({ service: 'betting', method: 'listMarketBook', params })
}

export async function listRunnerBook(
  marketId: string,
  selectionId: number,
  handicap?: number,
  priceProjection?: PriceProjection,
): Promise<MarketBook[]> {
  const params = {
    marketId,
    selectionId,
    ...(handicap !== undefined && { handicap }),
    ...(priceProjection && { priceProjection }),
  }
  return betfairInvokeSafe<MarketBook[]>({ service: 'betting', method: 'listRunnerBook', params })
}

export async function listCurrentOrders(options?: {
  betIds?: string[]
  marketIds?: string[]
  orderProjection?: OrderProjection
  customerOrderRefs?: string[]
  customerStrategyRefs?: string[]
  fromRecord?: number
  recordCount?: number
  locale?: string
}): Promise<ListCurrentOrdersResponse> {
  const params = {
    ...(options?.betIds && { betIds: options.betIds }),
    ...(options?.marketIds && { marketIds: options.marketIds }),
    ...(options?.orderProjection && { orderProjection: options.orderProjection }),
    ...(options?.customerOrderRefs && { customerOrderRefs: options.customerOrderRefs }),
    ...(options?.customerStrategyRefs && { customerStrategyRefs: options.customerStrategyRefs }),
    ...(options?.fromRecord !== undefined && { fromRecord: options.fromRecord }),
    ...(options?.recordCount !== undefined && { recordCount: options.recordCount }),
    ...(options?.locale && { locale: options.locale }),
  }
  return betfairInvokeSafe<ListCurrentOrdersResponse>({ service: 'betting', method: 'listCurrentOrders', params })
}

export async function listClearedOrders(
  betStatus: ClearedOrderStatus,
  options?: {
    eventTypeIds?: string[]
    eventIds?: string[]
    marketIds?: string[]
    runnerIds?: string[]
    betIds?: string[]
    side?: 'BACK' | 'LAY'
    customerOrderRefs?: string[]
    customerStrategyRefs?: string[]
    includeItemDescription?: boolean
    fromRecord?: number
    recordCount?: number
    locale?: string
  },
): Promise<ClearedOrderSummaryReport> {
  const params = {
    betStatus,
    ...(options?.eventTypeIds && { eventTypeIds: options.eventTypeIds }),
    ...(options?.eventIds && { eventIds: options.eventIds }),
    ...(options?.marketIds && { marketIds: options.marketIds }),
    ...(options?.runnerIds && { runnerIds: options.runnerIds }),
    ...(options?.betIds && { betIds: options.betIds }),
    ...(options?.side && { side: options.side }),
    ...(options?.customerOrderRefs && { customerOrderRefs: options.customerOrderRefs }),
    ...(options?.customerStrategyRefs && { customerStrategyRefs: options.customerStrategyRefs }),
    ...(options?.includeItemDescription !== undefined && { includeItemDescription: options.includeItemDescription }),
    ...(options?.fromRecord !== undefined && { fromRecord: options.fromRecord }),
    ...(options?.recordCount !== undefined && { recordCount: options.recordCount }),
    ...(options?.locale && { locale: options.locale }),
  }
  return betfairInvokeSafe<ClearedOrderSummaryReport>({ service: 'betting', method: 'listClearedOrders', params })
}

export async function placeOrders(
  marketId: string,
  instructions: PlaceInstruction[],
  customerRef?: string,
  options?: { marketVersion?: number; async?: boolean },
): Promise<PlaceExecutionReport> {
  const params = {
    marketId,
    instructions,
    ...(customerRef && { customerRef }),
    ...(options?.marketVersion !== undefined && { marketVersion: options.marketVersion }),
    ...(options?.async !== undefined && { async: options.async }),
  }
  return betfairInvokeSafe<PlaceExecutionReport>({ service: 'betting', method: 'placeOrders', params })
}

export async function cancelOrders(options?: { marketId?: string; instructions?: CancelInstruction[]; customerRef?: string }): Promise<CancelExecutionReport> {
  const params = {
    ...(options?.marketId && { marketId: options.marketId }),
    ...(options?.instructions && { instructions: options.instructions }),
    ...(options?.customerRef && { customerRef: options.customerRef }),
  }
  return betfairInvokeSafe<CancelExecutionReport>({ service: 'betting', method: 'cancelOrders', params })
}

export async function replaceOrders(
  marketId: string,
  instructions: ReplaceInstruction[],
  customerRef?: string,
): Promise<ReplaceExecutionReport> {
  const params = {
    marketId,
    instructions,
    ...(customerRef && { customerRef }),
  }
  return betfairInvokeSafe<ReplaceExecutionReport>({ service: 'betting', method: 'replaceOrders', params })
}

export async function updateOrders(
  marketId: string,
  instructions: UpdateInstruction[],
  customerRef?: string,
): Promise<UpdateExecutionReport> {
  const params = {
    marketId,
    instructions,
    ...(customerRef && { customerRef }),
  }
  return betfairInvokeSafe<UpdateExecutionReport>({ service: 'betting', method: 'updateOrders', params })
}
