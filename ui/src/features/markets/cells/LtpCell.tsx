import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export function LtpCell(props: { ltp?: number }): React.ReactNode {
  const { t } = useTranslation('common')
  const { ltp } = props

  return (
    <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }} align="center">
      {typeof ltp === 'number' ? ltp.toFixed(2) : t('placeholder.dash')}
    </Typography>
  )
}
