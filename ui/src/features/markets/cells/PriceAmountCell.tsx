import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { formatPrice } from '@lib/price'

export function PriceAmountCell(props: { 
  price?: number
  amount?: number
  formatAmount: (n: number) => string
  onClick?: () => void
  clickable?: boolean
}): React.ReactNode {
  const { t } = useTranslation('common')

  const { price, amount, formatAmount, onClick, clickable } = props
  if (price === undefined || amount === undefined) {
    return (
      <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} align="center">
        {t('placeholder.dash')}
      </Typography>
    )
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        lineHeight: 1.1,
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
    >
      <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>{formatPrice(price)}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatAmount(amount)}
      </Typography>
    </Box>
  )
}
