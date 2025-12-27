import { Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getFundsRefreshInterval, setFundsRefreshInterval, getDefaultBetSize, setDefaultBetSize, getPriceOffsetTicks, setPriceOffsetTicks, getPriceLadderDepth, setPriceLadderDepth } from '@lib/storage'
import { LanguageSelect } from './LanguageSelect'
import { ThemeModeToggle } from './ThemeModeToggle'

export function SettingsPanel(): React.ReactNode {
  const { t } = useTranslation('settings')
  const [refreshInterval, setRefreshIntervalLocal] = useState(() => getFundsRefreshInterval())
  const [betSize, setBetSizeLocal] = useState(() => getDefaultBetSize())
  const [priceOffset, setPriceOffsetLocal] = useState(() => getPriceOffsetTicks())
  const [priceDepth, setPriceDepthLocal] = useState(() => getPriceLadderDepth())

  const handleRefreshIntervalChange = (value: string) => {
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && parsed >= 15) {
      setRefreshIntervalLocal(parsed)
      setFundsRefreshInterval(parsed)
    } else if (value === '') {
      setRefreshIntervalLocal(15)
    }
  }

  const handleBetSizeChange = (value: string) => {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed >= 0.5) {
      setBetSizeLocal(parsed)
      setDefaultBetSize(parsed)
    } else if (value === '') {
      setBetSizeLocal(0.5)
    }
  }

  const handlePriceOffsetChange = (value: string) => {
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
      setPriceOffsetLocal(parsed)
      setPriceOffsetTicks(parsed)
    } else if (value === '') {
      setPriceOffsetLocal(0)
    }
  }

  const handlePriceDepthChange = (value: string) => {
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && (parsed === 1 || parsed === 3)) {
      setPriceDepthLocal(parsed)
      setPriceLadderDepth(parsed)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack spacing={1.25}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {t('panel.title')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }} flexWrap="wrap">
          <LanguageSelect />
          <ThemeModeToggle />
          <TextField
            label={t('panel.fundsRefreshInterval')}
            type="number"
            size="small"
            value={refreshInterval}
            onChange={(e) => handleRefreshIntervalChange(e.target.value)}
            inputProps={{ min: 15, step: 5 }}
            sx={{ minWidth: 180 }}
            helperText={t('panel.fundsRefreshIntervalHelp')}
          />
          <TextField
            label={t('panel.defaultBetSize')}
            type="number"
            size="small"
            value={betSize}
            onChange={(e) => handleBetSizeChange(e.target.value)}
            inputProps={{ min: 0.5, step: 0.5 }}
            sx={{ minWidth: 150 }}
            helperText={t('panel.defaultBetSizeHelp')}
          />
          <TextField
            label={t('panel.priceOffsetTicks')}
            type="number"
            size="small"
            value={priceOffset}
            onChange={(e) => handlePriceOffsetChange(e.target.value)}
            inputProps={{ min: 0, max: 10, step: 1 }}
            sx={{ minWidth: 150 }}
            helperText={t('panel.priceOffsetTicksHelp')}
          />
          <TextField
            label={t('panel.priceLadderDepth')}
            select
            size="small"
            value={priceDepth}
            onChange={(e) => handlePriceDepthChange(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ minWidth: 180 }}
            helperText={t('panel.priceLadderDepthHelp')}
          >
            <option value={1}>{t('panel.priceLadderDepthBest')}</option>
            <option value={3}>{t('panel.priceLadderDepthThree')}</option>
          </TextField>
        </Stack>
      </Stack>
    </Paper>
  )
}
