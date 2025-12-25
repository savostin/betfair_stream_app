import { Paper, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { LanguageSelect } from './LanguageSelect'
import { ThemeModeToggle } from './ThemeModeToggle'

export function SettingsPanel(): React.ReactNode {
  const { t } = useTranslation('settings')

  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {t('panel.title')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ ml: { sm: 'auto' } }}>
          <LanguageSelect />
          <ThemeModeToggle />
        </Stack>
      </Stack>
    </Paper>
  )
}
