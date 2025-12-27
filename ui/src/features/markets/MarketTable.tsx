import { lighten, darken, useTheme, alpha } from '@mui/material/styles'
import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAccountContext } from '@hooks/accountContext'
import { useSelectedMarketContext } from '@hooks/selectedMarketContext'
import { useSessionContext } from '@hooks/sessionContext'
import { useNotifications } from '@hooks/notificationsContext'
import { useMarketProfitAndLoss } from '@hooks/useMarketProfitAndLoss'
import { quickPlaceBet } from '@betfair'
import type { Side } from '@betfair/types/common'
import { formatMoney } from '@lib/format'
import { getPriceLadderDepth } from '@lib/storage'
import { LtpCell } from './cells/LtpCell'
import { PriceAmountCell } from './cells/PriceAmountCell'
import { BACK_COLOR, LAY_COLOR } from '@theme/colors'

export function MarketTable(): React.ReactNode {
  const theme = useTheme()
  const { t } = useTranslation(['markets', 'common'])
  const queryClient = useQueryClient()
  const { isAuthed } = useSessionContext()
  const { accountCurrency } = useAccountContext()
  const { selectedMarket, snapshot, bestBackLayBySelectionId, marketTradedVolume } = useSelectedMarketContext()
  const notifications = useNotifications()
  const { pnlBySelection } = useMarketProfitAndLoss(selectedMarket?.marketId ?? null, isAuthed)
  const [priceDepth, setPriceDepth] = useState<number>(() => getPriceLadderDepth())

  const dash = t('common:placeholder.dash')
  const formatAmount = (n: number) => formatMoney(n, dash, accountCurrency ?? undefined)

  const handleQuickPlace = async (selectionId: number, side: Side, price: number, runnerName: string) => {
    if (!selectedMarket) return

    try {
      const result = await quickPlaceBet(selectedMarket.marketId, selectionId, side, price)

      if (result.status === 'SUCCESS') {
        notifications.info(t('markets:bet.placed', { side, runner: runnerName }))
        // Refresh orders and account funds
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['orders'] }),
          queryClient.invalidateQueries({ queryKey: ['accountFunds'] }),
        ])
      } else {
        const errorCode = result.instructionReports?.[0]?.errorCode
        notifications.error(errorCode ? t(`markets:bet.error.${errorCode}`, { defaultValue: errorCode }) : t('markets:bet.error.unknown'))
      }
    } catch (error) {
      notifications.error(error)
    }
  }

  useEffect(() => {
    const onDepthChange = () => setPriceDepth(getPriceLadderDepth())
    window.addEventListener('priceLadderDepthChanged', onDepthChange)
    return () => window.removeEventListener('priceLadderDepthChanged', onDepthChange)
  }, [])

  if (!selectedMarket) {
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

  const runners = (selectedMarket.runners ?? [])
    .slice()
    .sort((a, b) => (a.sortPriority ?? 0) - (b.sortPriority ?? 0))
    .map(r => ({ ...r, def: snapshot?.marketDefinition?.runners?.find(rd => rd.id === r.selectionId) }))
    .filter((r) => r.def?.status !== 'HIDDEN');

  const matchedVolume = marketTradedVolume ?? selectedMarket.totalMatched
  const marketStatus = snapshot?.marketDefinition?.status === 'OPEN' && snapshot?.marketDefinition?.inPlay ? 'IN-PLAY' : snapshot?.marketDefinition?.status ?? 'OPEN'

  // Use lighter/darker variants for sticky header to avoid transparency issues
  const backHeaderBg = alpha(theme.palette.mode === 'dark' ? darken(BACK_COLOR, 0.6) : darken(BACK_COLOR, 0.2), 0.8)
  const layHeaderBg = alpha(theme.palette.mode === 'dark' ? darken(LAY_COLOR, 0.6) : darken(LAY_COLOR, 0.2), 0.8)
  const backCellBg = theme.palette.mode === 'dark' ? darken(BACK_COLOR, 0.8) : lighten(BACK_COLOR, 0.25)
  const layCellBg = theme.palette.mode === 'dark' ? darken(LAY_COLOR, 0.8) : lighten(LAY_COLOR, 0.25)

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={0.5}
        justifyContent="space-between"
        alignItems={{ sm: 'flex-start' }}
        sx={{ mb: 0.75 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 800 }} noWrap>
            {selectedMarket.marketName}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
            {bestBackLayBySelectionId.size > 0 && bestBackLayBySelectionId.values().next().value?.ltp && (
              <Typography
                variant="caption"
                sx={{
                  px: 0.5,
                  py: 0.15,
                  borderRadius: 0.75,
                  bgcolor: alpha(marketStatus === 'SUSPENDED' ? theme.palette.grey[500] : theme.palette.info.main, 0.15),
                  color: marketStatus === 'SUSPENDED' ? theme.palette.error.main : theme.palette.primary.main,
                  fontWeight: 600,
                }}
              >
                {t(`markets:status.betfair.${marketStatus}`)}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {selectedMarket.marketStartTime ? new Date(selectedMarket.marketStartTime).toLocaleString() : ''}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
            {t('markets:meta.matched', { amount: formatMoney(matchedVolume, dash, accountCurrency ?? undefined) })}
          </Typography>
        </Box>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Table size="small" stickyHeader sx={{ '& td, & th': { py: 0.3, px: 0.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, width: { xs: 138, sm: 188 }, bgcolor: alpha(theme.palette.grey[theme.palette.mode === 'dark' ? 900 : 100], 0.8), backdropFilter: 'blur(3px)', py: 0.3, px: 0.4 }}>{t('markets:table.selection')}</TableCell>
              <TableCell align="center" colSpan={priceDepth} sx={{ fontWeight: 800, bgcolor: backHeaderBg, backdropFilter: 'blur(3px)', py: 0.35 }}>
                {t('markets:table.back')}
              </TableCell>
              <TableCell align="center" sx={{ bgcolor: alpha(theme.palette.grey[theme.palette.mode === 'dark' ? 900 : 100], 0.8), fontWeight: 800, backdropFilter: 'blur(3px)', py: 0.35, px: 0.4 }}>
                {t('markets:table.ltp')}
              </TableCell>
              <TableCell align="center" colSpan={priceDepth} sx={{ fontWeight: 800, bgcolor: layHeaderBg, backdropFilter: 'blur(3px)', py: 0.35 }}>
                {t('markets:table.lay')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runners.map((r) => {
              const best = bestBackLayBySelectionId.get(r.selectionId)
              const b1 = best?.back[0]
              const b2 = best?.back[1]
              const b3 = best?.back[2]
              const l1 = best?.lay[0]
              const l2 = best?.lay[1]
              const l3 = best?.lay[2]
              const depth = priceDepth === 3 ? 3 : 1
              const ltp = best?.ltp
              const runnerTv = best?.tv
              const pnl = pnlBySelection.get(r.selectionId)
              const ifWin = pnl?.ifWin
              const ifLose = pnl?.ifLose

              const runnerStatus = r.def?.status ?? 'ACTIVE'
              const isRemoved = runnerStatus === 'REMOVED'

              return (
                <TableRow key={r.selectionId} hover sx={{ opacity: isRemoved ? 0.5 : 1 }}>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      width: { xs: 138, sm: 188 },
                      maxWidth: { xs: 138, sm: 188 },
                      py: 0.3,
                      px: 0.4,
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, lineHeight: 1.1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: isRemoved ? 'text.disabled' : 'inherit',
                        }}
                      >
                        {r.runnerName}
                      </Typography>
                      {(ifWin !== undefined || ifLose !== undefined) && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: (ifWin ?? 0) > 0 ? 'success.main' : (ifWin ?? 0) < 0 ? 'error.main' : 'text.secondary',
                            fontWeight: 600,
                            display: 'block',
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1.15,
                          }}
                        >
                          {ifWin !== undefined && ifWin !== 0
                            ? `${ifWin > 0 ? '+' : ''}${formatMoney(ifWin, dash, accountCurrency ?? undefined)}`
                            : ifLose !== undefined && ifLose !== 0
                              ? `${ifLose > 0 ? '+' : ''}${formatMoney(ifLose, dash, accountCurrency ?? undefined)}`
                              : ' '}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {isRemoved ?
                    <TableCell
                      colSpan={depth === 3 ? 7 : 3}
                      align="center"
                      sx={{
                        py: 0.3,
                        px: 0.4,
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                        {r.def?.adjustmentFactor !== undefined && (
                          <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                            {r.def.adjustmentFactor.toFixed(2)}%
                          </Typography>
                        )}
                        {r.def?.removalDate && (
                          <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                            {new Date(r.def.removalDate).toLocaleDateString()} {new Date(r.def.removalDate).toLocaleTimeString()}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    :
                    <>{depth === 3 &&
                      <TableCell align="center" sx={{ bgcolor: backCellBg, width: 76, borderRight: 1, borderRightColor: theme.palette.background.default, py: 0.3, px: 0.4 }}>
                        <PriceAmountCell price={b3?.price} amount={b3?.size} formatAmount={formatAmount} />
                      </TableCell>}
                      {depth === 3 && <TableCell align="center" sx={{ bgcolor: backCellBg, width: 76, borderRight: 1, borderRightColor: theme.palette.background.default, py: 0.3, px: 0.4 }}>
                        <PriceAmountCell price={b2?.price} amount={b2?.size} formatAmount={formatAmount} />
                      </TableCell>}
                      <TableCell
                        align="center"
                        sx={{
                          bgcolor: backCellBg,
                          width: depth === 3 ? 78 : 90,
                          py: 0.3,
                          px: 0.4,
                          '&:hover': b1?.price ? { bgcolor: backHeaderBg } : {},
                          transition: 'background-color 0.15s ease-in-out',
                        }}
                      >
                        <PriceAmountCell
                          price={b1?.price}
                          amount={b1?.size}
                          formatAmount={formatAmount}
                          onClick={b1?.price ? () => handleQuickPlace(r.selectionId, 'BACK', b1.price, r.runnerName) : undefined}
                          clickable={b1?.price !== undefined}
                        />
                      </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, width: 60, py: 0.3 }}>
                      <LtpCell ltp={ltp} runnerTv={runnerTv} marketTv={matchedVolume} />
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        bgcolor: layCellBg,
                        width: depth === 3 ? 78 : 90,
                        py: 0.3,
                        px: 0.4,
                        borderRight: depth === 3 ? 1 : 0,
                        borderRightColor: theme.palette.background.default,
                        '&:hover': l1?.price ? { bgcolor: layHeaderBg } : {},
                        transition: 'background-color 0.15s ease-in-out',
                      }}
                    >
                      <PriceAmountCell
                        price={l1?.price}
                        amount={l1?.size}
                        formatAmount={formatAmount}
                        onClick={l1?.price ? () => handleQuickPlace(r.selectionId, 'LAY', l1.price, r.runnerName) : undefined}
                        clickable={l1?.price !== undefined}
                      />
                    </TableCell>
                  {depth === 3 && (
                    <TableCell align="center" sx={{ bgcolor: layCellBg, width: 76, borderRight: 1, borderRightColor: theme.palette.background.default, py: 0.3, px: 0.4 }}>
                      <PriceAmountCell price={l2?.price} amount={l2?.size} formatAmount={formatAmount} />
                    </TableCell>
                  )}
                  {depth === 3 && (
                    <TableCell align="center" sx={{ bgcolor: layCellBg, width: 76, py: 0.3, px: 0.4 }}>
                      <PriceAmountCell price={l3?.price} amount={l3?.size} formatAmount={formatAmount} />
                    </TableCell>
                  )}
                  </>}
                </TableRow>
            )})
          }
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
