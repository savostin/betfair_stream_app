/**
 * Betfair Stream API types
 */

export type SegmentType = 'SEG_START' | 'SEG' | 'SEG_END'
export type ChangeType = 'SUB_IMAGE' | 'RESUB_DELTA' | 'HEARTBEAT'

export type RunnerStatus = 'ACTIVE' | 'REMOVED' | 'LOSER' | 'WINNER' | 'HIDDEN'

export interface RunnerDefinition {
  id?: number
  name?: string
  status?: RunnerStatus
  sortPriority?: number
  // For REMOVED runners (Rule 4 withdrawals in horse racing)
  adjustmentFactor?: number  // Reduction factor applied to matched bets (e.g., 0.5 for 50%)
  removalDate?: number       // Timestamp when runner was withdrawn (milliseconds)
  // Additional fields preserved from stream
  metadata?: Record<string, unknown>
}

export interface MarketDefinition {
  marketStatus?: 'OPEN' | 'SUSPENDED' | 'CLOSED'
  inPlay?: boolean
  persistenceType?: string
  marketTime?: string
  suspendTime?: string
  settledTime?: string
  bettingType?: string
  bspMarket?: boolean
  turnInPlayEnabled?: boolean
  numberOfWinners?: number
  numberOfRunners?: number
  numberOfActiveRunners?: number
  betDelay?: number
  status?: 'OPEN' | 'SUSPENDED' | 'CLOSED'
  runners?: RunnerDefinition[]
}

export type StreamMcmMessage = {
  op?: 'mcm'
  id?: number
  ct?: ChangeType
  segmentType?: SegmentType
  pt?: number
  clk?: string
  initialClk?: string
  mc?: MarketChange[]
}

export type MarketChange = {
  id?: string
  img?: boolean
  tv?: number
  marketDefinition?: MarketDefinition
  rc?: RunnerChange[]
}

export type RunnerChange = {
  id?: number
  ltp?: number
  tv?: number
  batb?: Array<[number, number, number]>
  batl?: Array<[number, number, number]>
}

export type LadderLevel = { level: number; price: number; size: number }

export type RunnerState = {
  selectionId: number
  ltp?: number
  tv?: number
  batb: Map<number, LadderLevel>
  batl: Map<number, LadderLevel>
}

export type MarketState = {
  marketId: string
  publishTime?: number
  clk?: string
  tradedVolume?: number
  marketDefinition?: MarketDefinition
  runners: Map<number, RunnerState>
}

export type MarketSnapshot = {
  marketId: string
  publishTime?: number
  clk?: string
  tradedVolume?: number
  marketDefinition?: MarketDefinition
  runners: Array<{
    selectionId: number
    ltp?: number
    tv?: number
    batb: LadderLevel[]
    batl: LadderLevel[]
  }>
}

export type ApplyMcmOptions = {
  currentSubscriptionId: number
  selectedMarketId: string
}
