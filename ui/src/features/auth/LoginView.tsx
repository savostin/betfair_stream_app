import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

export function LoginView(props: {
  username: string
  password: string
  onChangeUsername: (next: string) => void
  onChangePassword: (next: string) => void
  onSubmit: (e: FormEvent) => void
}): React.ReactNode {
  const { t } = useTranslation(['auth'])

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontSize: 16, mb: 1 }}>
          {t('auth:login.sectionTitle')}
        </Typography>
        <Box component="form" onSubmit={props.onSubmit}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-end' }}>
            <TextField
              label={t('auth:login.usernameLabel')}
              value={props.username}
              onChange={(e) => props.onChangeUsername(e.target.value)}
              placeholder={t('auth:login.usernamePlaceholder')}
              autoComplete="username"
              fullWidth
            />
            <TextField
              label={t('auth:login.passwordLabel')}
              value={props.password}
              onChange={(e) => props.onChangePassword(e.target.value)}
              placeholder={t('auth:login.passwordPlaceholder')}
              type="password"
              autoComplete="current-password"
              fullWidth
            />
            <Button type="submit" variant="contained">
              {t('auth:login.submit')}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Stack>
  )
}
