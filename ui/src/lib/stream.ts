import {
  applyMcm,
  emptyMarketState,
  toSnapshot,
  type MarketSnapshot,
  type MarketState,
  type StreamMcmMessage,
} from './streamState'
import { tauriInvoke, tauriListen } from './tauri'

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

const EVENT_STREAM_LINE = 'betfair_stream_line'
const AUTH_REQUEST_ID = 1

export type TauriStreamClientOptions = {
  onSnapshot: (snapshot: MarketSnapshot) => void
  onInfo?: (message: UiMessage) => void
  onError?: (error: UiMessage) => void
}

export class TauriStreamClient {
  private readonly opts: TauriStreamClientOptions
  private nextId = 1000
  private authenticated = false
  private currentMarketId: string | null = null
  private currentSubscriptionId: number | null = null
  private marketState: MarketState | undefined
  private pendingAuth = true
  private unlisten: (() => void) | null = null
  private connected = false

  constructor(opts: TauriStreamClientOptions) {
    this.opts = opts
  }

  connect(): void {
    if (this.connected) return

    this.connected = true
    this.authenticated = false
    this.currentSubscriptionId = null
    this.pendingAuth = true

    void this.start()
  }

  disconnect(): void {
    this.unlisten?.()
    this.unlisten = null

    this.connected = false
    this.authenticated = false
    this.currentMarketId = null
    this.currentSubscriptionId = null
    this.marketState = undefined
    this.pendingAuth = false

    void tauriInvoke<void>('stream_disconnect').catch(() => {
      // ignore
    })
  }

  subscribeToMarket(marketId: string): void {
    this.currentMarketId = marketId

    if (!this.connected) {
      this.connect()
      return
    }

    if (!this.authenticated) {
      return
    }

    this.sendMarketSubscription(marketId)
  }

  private async start(): Promise<void> {
    try {
      this.unlisten = await tauriListen<string>(EVENT_STREAM_LINE, (line) => {
        this.handleLine(line)
      })

      await tauriInvoke<void>('stream_connect')
      this.opts.onInfo?.({ key: 'errors:stream.websocketConnected' })
    } catch (e) {
      this.opts.onError?.({ key: 'errors:stream.websocketError' })
      this.disconnect()
    }
  }

  private handleLine(line: string): void {
    const parsed = safeJsonParse(line)
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

  private handleStatus(msg: StatusMessage): void {
    // Auth status: the Rust side sends auth with id=1.
    if (this.pendingAuth && (msg.id === AUTH_REQUEST_ID || typeof msg.id !== 'number')) {
      if (msg.statusCode === 'SUCCESS') {
        this.authenticated = true
        this.pendingAuth = false

        if (this.currentMarketId) {
          this.sendMarketSubscription(this.currentMarketId)
        }
      } else if (msg.statusCode === 'FAILURE') {
        this.pendingAuth = false
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

    // Subscription status (optional)
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

    // Heartbeats are connection-health signals; they do not carry market changes.
    // Avoid re-emitting the same snapshot on every heartbeat.
    if (msg.ct === 'HEARTBEAT') return

    const next = applyMcm(this.marketState, msg, {
      currentSubscriptionId: this.currentSubscriptionId,
      selectedMarketId: this.currentMarketId,
    })

    if (!next) return
    this.marketState = next
    this.opts.onSnapshot(toSnapshot(next))
  }

  private sendMarketSubscription(marketId: string): void {
    const id = this.nextId++
    this.currentSubscriptionId = id
    this.marketState = emptyMarketState(marketId)
    this.opts.onSnapshot(toSnapshot(this.marketState))

    const line = JSON.stringify({
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
        fields: ['EX_MARKET_DEF', 'EX_LTP', 'EX_BEST_OFFERS', 'EX_TRADED_VOL'],
      },
    })

    void tauriInvoke<void>('stream_send', { line }).catch(() => {
      this.opts.onError?.({ key: 'errors:stream.websocketError' })
    })
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
