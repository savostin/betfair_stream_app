/**
 * Betfair Betting API methods
 */

import type { MarketCatalogue, PlaceExecutionReport } from '@betfair/types/betting'
import type { Side } from '@betfair/types/common'
import { listMarketCatalogue, placeOrders } from '@betfair/api/betting'
import { getDefaultBetSize, getPriceOffsetTicks } from '@lib/storage'
import { decrementPrice, incrementPrice } from '@lib/price'

// Custom helpers live here; general API lives under ./api/

/**
 * Helper: List next horse WIN markets (common use case)
 */
export async function listNextHorseWinMarkets(): Promise<MarketCatalogue[]> {
  const now = new Date()
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
  const fromIso = tenMinutesAgo.toISOString()

  return listMarketCatalogue(
    {
      eventTypeIds: ['7'],
      marketTypeCodes: ['WIN'],
      marketStartTime: { from: fromIso },
    },
    {
      marketProjection: ['RUNNER_DESCRIPTION', 'EVENT', 'MARKET_START_TIME'],
      sort: 'FIRST_TO_START',
      maxResults: 100,
    },
  )
}

/**
 * Quick place bet: places a LIMIT bet with configured size and price offset.
 * - BACK bets: decrements price by offset ticks (place below best back)
 * - LAY bets: increments price by offset ticks (place above best lay)
 * 
 * @param marketId - The market ID
 * @param selectionId - The runner selection ID
 * @param side - 'BACK' or 'LAY'
 * @param currentPrice - The current best price (B1 or L1)
 * @returns PlaceExecutionReport from the API
 */
export async function quickPlaceBet(
  marketId: string,
  selectionId: number,
  side: Side,
  currentPrice: number,
): Promise<PlaceExecutionReport> {
  const betSize = getDefaultBetSize()
  const offsetTicks = getPriceOffsetTicks()

  // Apply price offset: decrement for BACK, increment for LAY
  const adjustedPrice = side === 'BACK' 
    ? decrementPrice(currentPrice, offsetTicks)
    : incrementPrice(currentPrice, offsetTicks)

  const instruction = {
    selectionId,
    side,
    orderType: 'LIMIT' as const,
    limitOrder: {
      size: betSize,
      price: adjustedPrice,
      persistenceType: 'LAPSE' as const,
    },
  }

  return placeOrders(marketId, [instruction])
}
