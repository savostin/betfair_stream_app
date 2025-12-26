import { Paper, Stack } from '@mui/material'
import { MarketList } from './MarketList'
import { MarketTable } from './MarketTable'

export function MarketsView(): React.ReactNode {
  return (
    <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="stretch" sx={{ flex: 1, minHeight: 0 }}>
        <MarketList />

        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <MarketTable />
        </Paper>
      </Stack>
    </Stack>
  )
}
