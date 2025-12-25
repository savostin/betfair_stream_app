import { Paper, Stack } from '@mui/material'
import type { MarketCatalogue } from '../../types/betfair'
import { MarketList } from './MarketList'
import { MarketTable } from './MarketTable'

export function MarketsView(props: {
  markets: MarketCatalogue[]
  marketsLoading: boolean
  selectedMarketId: string
  selectedMarket: MarketCatalogue | null
  onRefreshMarkets: () => void
  onSelectMarket: (marketId: string) => void
  bestBackLayBySelectionId: Map<
    number,
    {
      back: Array<{ price: number; size: number }>
      lay: Array<{ price: number; size: number }>
      ltp?: number
    }
  >
  snapshotConnected: boolean
}): React.ReactNode {
  return (
    <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="stretch" sx={{ flex: 1, minHeight: 0 }}>
        <MarketList
          markets={props.markets}
          selectedMarketId={props.selectedMarketId}
          marketsLoading={props.marketsLoading}
          onRefresh={props.onRefreshMarkets}
          onSelectMarket={props.onSelectMarket}
        />

        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <MarketTable
            selectedMarket={props.selectedMarket}
            bestBackLayBySelectionId={props.bestBackLayBySelectionId}
            snapshotConnected={props.snapshotConnected}
          />
        </Paper>
      </Stack>
    </Stack>
  )
}
