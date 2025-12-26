/**
 * Common Betfair types
 */

export interface TimeRange {
  from?: string
  to?: string
}

export type BettingType = 'ODDS' | 'LINE' | 'RANGE' | 'ASIAN_HANDICAP_DOUBLE_LINE' | 'ASIAN_HANDICAP_SINGLE_LINE'

export type Side = 'BACK' | 'LAY'
export type PersistenceType = 'LAPSE' | 'PERSIST' | 'MARKET_ON_CLOSE'
export type OrderType = 'LIMIT' | 'LIMIT_ON_CLOSE' | 'MARKET_ON_CLOSE'
export type OrderStatus = 'EXECUTABLE' | 'EXECUTION_COMPLETE'
export type ClearedOrderStatus = 'SETTLED' | 'VOIDED' | 'LAPSED' | 'CANCELLED' | 'ALL'
export type TimeGranularity = 'HOURS' | 'DAYS' | 'MONTHS'

export interface PriceSize {
  price: number
  size: number
}
