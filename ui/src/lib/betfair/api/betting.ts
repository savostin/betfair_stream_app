/**
 * Betfair Betting API (general methods)
 */

import { betfairInvokeSafe } from '@betfair/invoke'
import type { MarketCatalogue, MarketFilter, MarketProjection, MarketSort } from '@betfair/types/betting'

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
