import { lighten, darken, useTheme, alpha } from '@mui/material/styles'
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
import type { MarketCatalogue } from '@betfair'
import { formatMoney } from '@lib/format'
import { LtpCell } from './cells/LtpCell'
import { PriceAmountCell } from './cells/PriceAmountCell'
import { BACK_COLOR, LAY_COLOR } from '@theme/colors'

export function MarketTable(props: {
  selectedMarket: MarketCatalogue | null
  bestBackLayBySelectionId: Map<
    number,
    {
      back: Array<{ price: number; size: number }>
      lay: Array<{ price: number; size: number }>
      ltp?: number
      tv?: number
    }
  >
  snapshotConnected: boolean
  marketTradedVolume: number | null
  accountCurrency: string | null
}): React.ReactNode {
  const theme = useTheme()
  const { t } = useTranslation(['markets', 'common'])

  const dash = t('common:placeholder.dash')
  const formatAmount = (n: number) => formatMoney(n, dash, props.accountCurrency ?? undefined)

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

  // Use lighter/darker variants for sticky header to avoid transparency issues
  const backHeaderBg = alpha(theme.palette.mode === 'dark' ? darken(BACK_COLOR, 0.6) : darken(BACK_COLOR, 0.2), 0.8)
  const layHeaderBg = alpha(theme.palette.mode === 'dark' ? darken(LAY_COLOR, 0.6) : darken(LAY_COLOR, 0.2), 0.8)
  const backCellBg = theme.palette.mode === 'dark' ? darken(BACK_COLOR, 0.8) : lighten(BACK_COLOR, 0.25)
  const layCellBg = theme.palette.mode === 'dark' ? darken(LAY_COLOR, 0.8) : lighten(LAY_COLOR, 0.25)

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
            {t('markets:meta.matched', { amount: formatMoney(matchedVolume, dash, props.accountCurrency ?? undefined) })}
          </Typography>
        </Box>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, width: { xs: 160, sm: 220 }, bgcolor: alpha(theme.palette.background.default, 0.8), backdropFilter: 'blur(3px)' }}>{t('markets:table.selection')}</TableCell>
              <TableCell
                align="center"
                colSpan={3}
                sx={{ fontWeight: 800, bgcolor: backHeaderBg, backdropFilter: 'blur(3px)' }}
              >
                {t('markets:table.back')}
              </TableCell>
              <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.background.default, 0.8), fontWeight: 800, backdropFilter: 'blur(3px)' }}>
                {t('markets:table.ltp')}
              </TableCell>
              <TableCell
                align="center"
                colSpan={3}
                sx={{ fontWeight: 800, bgcolor: layHeaderBg, backdropFilter: 'blur(3px)' }}
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
                const runnerTv = best?.tv

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
                    <TableCell align="center" sx={{ bgcolor: backCellBg, width: 92, borderRight: 1, borderRightColor: theme.palette.background.default }}>
                      <PriceAmountCell price={b3?.price} amount={b3?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: backCellBg, width: 92, borderRight: 1, borderRightColor:  theme.palette.background.default }}>
                      <PriceAmountCell price={b2?.price} amount={b2?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: backCellBg, width: 92 }}>
                      <PriceAmountCell price={b1?.price} amount={b1?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, width: 72 }}>
                      <LtpCell ltp={ltp} runnerTv={runnerTv} marketTv={matchedVolume} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: layCellBg, width: 92, borderRight: 1, borderRightColor:  theme.palette.background.default }}>
                      <PriceAmountCell price={l1?.price} amount={l1?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: layCellBg, width: 92, borderRight: 1, borderRightColor:  theme.palette.background.default }}>
                      <PriceAmountCell price={l2?.price} amount={l2?.size} formatAmount={formatAmount} />
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: layCellBg, width: 92 }}>
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
