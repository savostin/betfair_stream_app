import { Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getFundsRefreshInterval, setFundsRefreshInterval } from '../../lib/storage'
import { LanguageSelect } from './LanguageSelect'
import { ThemeModeToggle } from './ThemeModeToggle'

export function SettingsPanel(): React.ReactNode {
  const { t } = useTranslation('settings')
  const [refreshInterval, setRefreshIntervalLocal] = useState(() => getFundsRefreshInterval())

  const handleRefreshIntervalChange = (value: string) => {
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && parsed >= 15) {
      setRefreshIntervalLocal(parsed)
      setFundsRefreshInterval(parsed)
    } else if (value === '') {
      setRefreshIntervalLocal(15)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack spacing={1.25}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {t('panel.title')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
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
        </Stack>
      </Stack>
    </Paper>
  )
}
