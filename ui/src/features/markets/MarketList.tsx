import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMarketsContext } from '@hooks/marketsContext'
import { useSelectedMarketContext } from '@hooks/selectedMarketContext'
import { formatTime } from '@lib/format'

export function MarketList(): React.ReactNode {
  const { t } = useTranslation(['markets', 'common'])
  const { markets, isLoading, refresh } = useMarketsContext()
  const { selectedMarketId, setSelectedMarketId } = useSelectedMarketContext()

  return (
    <Paper
      variant="outlined"
      sx={{
        width: { xs: '100%', md: 340 },
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.25 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 14 }}>
          {t('markets:panel.title')}
        </Typography>
        <Button variant="outlined" onClick={refresh} disabled={isLoading}>
          {isLoading ? t('common:actions.loading') : t('common:actions.refresh')}
        </Button>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {markets.length === 0 ? (
          <Box sx={{ p: 1.25 }}>
            <Typography variant="body2" color="text.secondary">
              {t('markets:empty.noMarkets')}
            </Typography>
          </Box>
        ) : null}

        {markets.map((m) => (
          <Box key={m.marketId}>
            <Button
              onClick={() => setSelectedMarketId(m.marketId)}
              variant={m.marketId === selectedMarketId ? 'contained' : 'text'}
              color={m.marketId === selectedMarketId ? 'primary' : 'inherit'}
              sx={{
                width: '100%',
                justifyContent: 'flex-start',
                textAlign: 'left',
                py: 1,
                px: 1.25,
                borderRadius: 0,
              }}
              title={m.marketId}
            >
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{m.marketName}</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {m.event?.name ?? ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {formatTime(m.marketStartTime, '–', false)}
                  </Typography>
                </Stack>
              </Box>
            </Button>
            <Divider />
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
