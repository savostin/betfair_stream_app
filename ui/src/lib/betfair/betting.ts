/**
 * Betfair Betting API methods
 */

import { tauriInvoke } from '../tauri'
import { UiError } from '../../errors/UiError'
import { extractInvokeUiError } from './errors'
import type {
  MarketCatalogue,
  MarketFilter,
  MarketProjection,
  MarketSort,
} from './types/betting'

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

  try {
    return await tauriInvoke<MarketCatalogue[]>('betfair_rpc', {
      args: { service: 'betting', method: 'listMarketCatalogue', params: requestBody },
    })
  } catch (e) {
    const extracted = extractInvokeUiError(e)
    if (extracted) throw new UiError(extracted)
    throw e
  }
}

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
