import { applyMcm, emptyMarketState, toSnapshot, type MarketSnapshot, type MarketState, type StreamMcmMessage } from './streamState'

export type UiMessage = { key: string; values?: Record<string, unknown> }

type StatusMessage = {
  op?: 'status'
  id?: number
  statusCode?: 'SUCCESS' | 'FAILURE'
  errorCode?: string
  errorMessage?: string
  connectionClosed?: boolean
}

type ConnectionMessage = {
  op?: 'connection'
  connectionId?: string
}

export type StreamClientOptions = {
  wsUrl: string
  appKey: string
  sessionToken: string
  onSnapshot: (snapshot: MarketSnapshot) => void
  onInfo?: (message: UiMessage) => void
  onError?: (error: UiMessage) => void
}

export class StreamClient {
  private readonly opts: StreamClientOptions
  private ws: WebSocket | null = null
  private nextId = 1
  private authenticated = false
  private currentMarketId: string | null = null
  private currentSubscriptionId: number | null = null
  private marketState: MarketState | undefined
  private pendingAuthRequestId: number | null = null

  constructor(opts: StreamClientOptions) {
    this.opts = opts
  }

  connect(): void {
    if (this.ws) return

    this.authenticated = false
    this.currentSubscriptionId = null
    this.pendingAuthRequestId = null

    this.ws = new WebSocket(this.opts.wsUrl)

    this.ws.onopen = () => {
      this.opts.onInfo?.({ key: 'errors:stream.websocketConnected' })
      this.sendAuth()
    }

    this.ws.onclose = () => {
      this.opts.onInfo?.({ key: 'errors:stream.websocketDisconnected' })
      this.ws = null
      this.authenticated = false
      this.currentSubscriptionId = null
      this.pendingAuthRequestId = null
    }

    this.ws.onerror = () => {
      this.opts.onError?.({ key: 'errors:stream.websocketError' })
    }

    this.ws.onmessage = (ev) => {
      const parsed = safeJsonParse(ev.data)
      if (!parsed) return

      if (parsed.op === 'connection') {
        const c = parsed as ConnectionMessage
        if (c.connectionId) this.opts.onInfo?.({ key: 'errors:stream.connectionId', values: { id: c.connectionId } })
        return
      }

      if (parsed.op === 'status') {
        this.handleStatus(parsed as StatusMessage)
        return
      }

      if (parsed.op === 'mcm') {
        this.handleMcm(parsed as StreamMcmMessage)
      }
    }
  }

  disconnect(): void {
    if (!this.ws) return
    try {
      this.ws.close()
    } catch {
      // ignore
    }
    this.ws = null
    this.authenticated = false
    this.currentMarketId = null
    this.currentSubscriptionId = null
    this.marketState = undefined
    this.pendingAuthRequestId = null
  }

  subscribeToMarket(marketId: string): void {
    this.currentMarketId = marketId

    if (!this.ws) {
      this.connect()
      // subscription will be sent after auth succeeds
      return
    }

    if (!this.authenticated) {
      // wait until auth success
      return
    }

    this.sendMarketSubscription(marketId)
  }

  private sendAuth(): void {
    const id = this.nextId++
    this.pendingAuthRequestId = id

    this.send({
      op: 'authentication',
      id,
      appKey: this.opts.appKey,
      session: this.opts.sessionToken,
    })
  }

  private sendMarketSubscription(marketId: string): void {
    const id = this.nextId++
    this.currentSubscriptionId = id
    this.marketState = emptyMarketState(marketId)
    this.opts.onSnapshot(toSnapshot(this.marketState))

    this.send({
      op: 'marketSubscription',
      id,
      segmentationEnabled: true,
      conflateMs: 0,
      heartbeatMs: 5000,
      marketFilter: {
        marketIds: [marketId],
      },
      marketDataFilter: {
        ladderLevels: 3,
        fields: ['EX_MARKET_DEF', 'EX_LTP', 'EX_BEST_OFFERS'],
      },
    })
  }

  private handleStatus(msg: StatusMessage): void {
    if (typeof msg.id !== 'number') return

    if (this.pendingAuthRequestId === msg.id) {
      if (msg.statusCode === 'SUCCESS') {
        this.authenticated = true
        this.opts.onInfo?.({ key: 'errors:stream.authenticated' })
        this.pendingAuthRequestId = null

        if (this.currentMarketId) {
          this.sendMarketSubscription(this.currentMarketId)
        }
      } else {
        const details = msg.errorMessage ?? msg.errorCode
        this.opts.onError?.(
          details
            ? { key: 'errors:stream.authenticationFailedWithDetails', values: { details } }
            : { key: 'errors:stream.authenticationFailed' },
        )
        this.disconnect()
      }
      return
    }

    // subscription status (optional info)
    if (msg.statusCode === 'FAILURE') {
      const details = msg.errorMessage ?? msg.errorCode
      this.opts.onError?.(
        details
          ? { key: 'errors:stream.subscriptionFailedWithDetails', values: { details } }
          : { key: 'errors:stream.subscriptionFailed' },
      )
    }
  }

  private handleMcm(msg: StreamMcmMessage): void {
    if (!this.currentMarketId || !this.currentSubscriptionId) return

    const next = applyMcm(this.marketState, msg, {
      currentSubscriptionId: this.currentSubscriptionId,
      selectedMarketId: this.currentMarketId,
    })

    if (!next) return
    this.marketState = next
    this.opts.onSnapshot(toSnapshot(next))
  }

  private send(obj: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(obj))
  }
}

function safeJsonParse(data: unknown): any | null {
  try {
    if (typeof data !== 'string') return null
    return JSON.parse(data)
  } catch {
    return null
  }
}
