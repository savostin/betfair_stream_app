import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { formatPrice } from '@lib/price'

export function LtpCell(props: { ltp: number | null; runnerTv: number | null; marketTv?: number | null }): React.ReactNode {
  const { t } = useTranslation('common')
  const { ltp, runnerTv, marketTv } = props

  const percentage =
    typeof runnerTv === 'number' && typeof marketTv === 'number' && marketTv > 0
      ? ((runnerTv / marketTv) * 100).toFixed(2) + '%'
      : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
      <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }} align="center">
        {typeof ltp === 'number' ? formatPrice(ltp) : t('placeholder.dash')}
      </Typography>
      {percentage && (
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {percentage}
        </Typography>
      )}
    </Box>
  )
}
