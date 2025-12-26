import { alpha, useTheme } from '@mui/material/styles'
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { MarketCatalogue } from '../../types/betfair'
import { formatMoney } from '../../lib/format'
import { LtpCell } from './cells/LtpCell'
import { PriceAmountCell } from './cells/PriceAmountCell'

export function MarketTable(props: {
  selectedMarket: MarketCatalogue | null
  bestBackLayBySelectionId: Map<
    number,
    {
      back: Array<{ price: number; size: number }>
      lay: Array<{ price: number; size: number }>
      ltp?: number
    }
  >
  snapshotConnected: boolean
  marketTradedVolume: number | null
}): React.ReactNode {
  const theme = useTheme()
  const { t } = useTranslation(['markets', 'common'])

  const dash = t('common:placeholder.dash')
  const formatAmount = (n: number) => formatMoney(n, dash)

  if (!props.selectedMarket) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="h6" sx={{ fontSize: 16, mb: 0.5 }}>
          {t('markets:empty.selectTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('markets:empty.selectSubtitle')}
        </Typography>
      </Box>
    )
  }

  const selectedMarket = props.selectedMarket
  const matchedVolume = props.marketTradedVolume ?? selectedMarket.totalMatched

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ sm: 'flex-start' }}
        sx={{ mb: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 800 }} noWrap>
            {selectedMarket.marketName}
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary">
              {t('markets:meta.marketId', { id: selectedMarket.marketId })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedMarket.marketStartTime ? new Date(selectedMarket.marketStartTime).toLocaleString() : ''}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {t('markets:meta.matched', { amount: formatMoney(matchedVolume, dash) })}
          </Typography>
        </Box>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, width: { xs: 160, sm: 220 } }}>{t('markets:table.selection')}</TableCell>
              <TableCell
                align="center"
                colSpan={3}
                sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.info.main, 0.18) }}
              >
                {t('markets:table.back')}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                {t('markets:table.ltp')}
              </TableCell>
              <TableCell
                align="center"
                colSpan={3}
                sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.error.main, 0.18) }}
              >
                {t('markets:table.lay')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(selectedMarket.runners ?? [])
              .slice()
              .sort((a, b) => (a.sortPriority ?? 0) - (b.sortPriority ?? 0))
              .map((r) => {
                const best = props.bestBackLayBySelectionId.get(r.selectionId)
                const b1 = best?.back[0]
                const b2 = best?.back[1]
                const b3 = best?.back[2]
                const l1 = best?.lay[0]
                const l2 = best?.lay[1]
                const l3 = best?.lay[2]
                const ltp = best?.ltp

                return (
                  <TableRow key={r.selectionId} hover>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        maxWidth: { xs: 160, sm: 220 },
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.runnerName}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 92 }}>
                      <PriceAmountCell price={b3?.price} amount={b3?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 92 }}>
                      <PriceAmountCell price={b2?.price} amount={b2?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 92 }}>
                      <PriceAmountCell price={b1?.price} amount={b1?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, width: 72 }}>
                      <LtpCell ltp={ltp} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), width: 92 }}>
                      <PriceAmountCell price={l1?.price} amount={l1?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), width: 92 }}>
                      <PriceAmountCell price={l2?.price} amount={l2?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), width: 92 }}>
                      <PriceAmountCell price={l3?.price} amount={l3?.size} formatAmount={formatAmount} />
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </TableContainer>

      {!props.snapshotConnected ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {t('markets:status.connecting')}
        </Typography>
      ) : null}
    </>
  )
}
