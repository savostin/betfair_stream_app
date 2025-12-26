/**
 * Betfair Betting API methods
 */

import type { MarketCatalogue } from '@betfair/types/betting'
import { listMarketCatalogue } from '@betfair/api/betting'

// Custom helpers live here; general API lives under ./api/

/**
 * Helper: List next horse WIN markets (common use case)
 */
export async function listNextHorseWinMarkets(): Promise<MarketCatalogue[]> {
  const nowIso = new Date().toISOString()

  return listMarketCatalogue(
    {
      eventTypeIds: ['7'],
      marketTypeCodes: ['WIN'],
      marketStartTime: { from: nowIso },
    },
    {
      marketProjection: ['RUNNER_DESCRIPTION', 'EVENT', 'MARKET_START_TIME'],
      sort: 'FIRST_TO_START',
      maxResults: 100,
    },
  )
}
