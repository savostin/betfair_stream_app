import { Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { SettingsPanel } from '@features/settings/SettingsPanel'

export function SettingsPage(): React.ReactNode {
  const { t } = useTranslation('settings')

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <Stack spacing={1.5} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h6" sx={{ fontSize: 16 }}>
          {t('panel.title')}
        </Typography>
        <SettingsPanel />
      </Stack>
    </Box>
  )
}
