import { Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useColorMode } from '@theme/ColorModeProvider'

export function ThemeModeToggle(props: { variant?: 'text' | 'outlined' | 'contained' } = {}): React.ReactNode {
  const { variant = 'outlined' } = props
  const { mode, toggleMode } = useColorMode()
  const { t } = useTranslation('settings')

  return (
    <Button variant={variant} onClick={toggleMode} aria-label={t('theme.toggle')}>
      {mode === 'dark' ? t('theme.dark') : t('theme.light')}
    </Button>
  )
}
