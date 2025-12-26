export type BetfairLoginResponse = {
  status?: 'SUCCESS' | 'FAIL'
  token?: string
  sessionToken?: string
  error?: string
  product?: string
}

export type MarketCatalogueRunner = {
  selectionId: number
  runnerName: string
  handicap?: number
  sortPriority?: number
}

export type MarketCatalogue = {
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
}

export type ListMarketCatalogueResponse = MarketCatalogue[]

export type AccountFunds = {
  availableToBetBalance?: number
  exposure?: number
  retainedCommission?: number
  exposureLimit?: number
  discountRate?: number
  pointsBalance?: number
  wallet?: string
}

export type AccountDetails = {
  currencyCode?: string
  firstName?: string
  lastName?: string
  localeCode?: string
  region?: string
  timezone?: string
  discountRate?: number
  pointsBalance?: number
  countryCode?: string
}
