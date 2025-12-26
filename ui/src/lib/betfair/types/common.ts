/**
 * Common Betfair types
 */

export interface TimeRange {
  from?: string
  to?: string
}

export type BettingType = 'ODDS' | 'LINE' | 'RANGE' | 'ASIAN_HANDICAP_DOUBLE_LINE' | 'ASIAN_HANDICAP_SINGLE_LINE'
