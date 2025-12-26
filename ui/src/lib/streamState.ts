export type SegmentType = 'SEG_START' | 'SEG' | 'SEG_END'
export type ChangeType = 'SUB_IMAGE' | 'RESUB_DELTA' | 'HEARTBEAT'

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
  marketDefinition?: unknown
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
  marketDefinition?: unknown
  runners: Map<number, RunnerState>
}

export type MarketSnapshot = {
  marketId: string
  publishTime?: number
  clk?: string
  tradedVolume?: number
  marketDefinition?: unknown
  runners: Array<{
    selectionId: number
    ltp?: number
    tv?: number
    batb: LadderLevel[]
    batl: LadderLevel[]
  }>
}

function upsertLadderLevels(
  target: Map<number, LadderLevel>,
  changes: Array<[number, number, number]> | undefined,
): void {
  if (!changes) return
  for (const [level, price, size] of changes) {
    if (size === 0) {
      target.delete(level)
    } else {
      target.set(level, { level, price, size })
    }
  }
}

function toSortedLadder(map: Map<number, LadderLevel>): LadderLevel[] {
  return Array.from(map.values()).sort((a, b) => a.level - b.level)
}

export function emptyMarketState(marketId: string): MarketState {
  return {
    marketId,
    runners: new Map(),
  }
}

export type ApplyMcmOptions = {
  currentSubscriptionId: number
  selectedMarketId: string
}

export function applyMcm(
  prev: MarketState | undefined,
  msg: StreamMcmMessage,
  opts: ApplyMcmOptions,
): MarketState | undefined {
  if (msg.op !== 'mcm') return prev
  if (typeof msg.id !== 'number' || msg.id !== opts.currentSubscriptionId) return prev
  if (msg.ct === 'HEARTBEAT') return prev

  const marketChange = (msg.mc ?? []).find((m) => m.id === opts.selectedMarketId)
  if (!marketChange) return prev
  const marketId = opts.selectedMarketId

  const shouldClear =
    msg.ct === 'SUB_IMAGE' &&
    (!msg.segmentType || msg.segmentType === 'SEG_START')

  let next: MarketState
  if (!prev || prev.marketId !== marketId || shouldClear || marketChange?.img) {
    next = emptyMarketState(marketId)
  } else {
    next = {
      ...prev,
      runners: new Map(prev.runners),
    }
  }

  if (typeof msg.pt === 'number') next.publishTime = msg.pt
  if (typeof msg.clk === 'string') next.clk = msg.clk
  if (typeof marketChange.tv === 'number') next.tradedVolume = marketChange.tv
  if (marketChange.marketDefinition !== undefined) {
    next.marketDefinition = marketChange.marketDefinition
  }

  for (const rc of marketChange.rc ?? []) {
    if (typeof rc.id !== 'number') continue

    const existing = next.runners.get(rc.id)
    const runner: RunnerState = existing
      ? {
          ...existing,
          batb: new Map(existing.batb),
          batl: new Map(existing.batl),
        }
      : {
          selectionId: rc.id,
          batb: new Map(),
          batl: new Map(),
        }

    if (typeof rc.ltp === 'number') runner.ltp = rc.ltp
    if (typeof rc.tv === 'number') runner.tv = rc.tv

    upsertLadderLevels(runner.batb, rc.batb)
    upsertLadderLevels(runner.batl, rc.batl)

    next.runners.set(rc.id, runner)
  }

  return next
}

export function toSnapshot(state: MarketState): MarketSnapshot {
  const tradedVolume =
    typeof state.tradedVolume === 'number'
      ? state.tradedVolume
      : Array.from(state.runners.values()).reduce((acc, r) => acc + (typeof r.tv === 'number' ? r.tv : 0), 0)

  return {
    marketId: state.marketId,
    publishTime: state.publishTime,
    clk: state.clk,
    tradedVolume,
    marketDefinition: state.marketDefinition,
    runners: Array.from(state.runners.values())
      .sort((a, b) => a.selectionId - b.selectionId)
      .map((r) => ({
        selectionId: r.selectionId,
        ltp: r.ltp,
        tv: r.tv,
        batb: toSortedLadder(r.batb),
        batl: toSortedLadder(r.batl),
      })),
  }
}
