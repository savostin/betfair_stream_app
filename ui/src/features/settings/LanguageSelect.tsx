import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material'
import { useTranslation } from 'react-i18next'

const LANGS = ['en', 'es', 'ru'] as const
export type AppLanguage = (typeof LANGS)[number]

function isAppLanguage(v: string): v is AppLanguage {
  return (LANGS as readonly string[]).includes(v)
}

export function LanguageSelect(props: { fullWidth?: boolean; size?: 'small' | 'medium' } = {}): React.ReactNode {
  const { fullWidth = false, size = 'small' } = props
  const { t, i18n } = useTranslation(['settings', 'common'])

  const value = isAppLanguage(i18n.resolvedLanguage ?? i18n.language) ? (i18n.resolvedLanguage ?? i18n.language) : 'en'

  function onChange(e: SelectChangeEvent): void {
    const next = String(e.target.value)
    if (!isAppLanguage(next)) return
    void i18n.changeLanguage(next)
    localStorage.setItem('app.language', next)
  }

  return (
    <FormControl size={size} fullWidth={fullWidth}>
      <InputLabel id="language-select-label">{t('settings:language.label')}</InputLabel>
      <Select
        labelId="language-select-label"
        label={t('settings:language.label')}
        value={value}
        onChange={onChange}
      >
        <MenuItem value="en">{t('common:language.en')}</MenuItem>
        <MenuItem value="es">{t('common:language.es')}</MenuItem>
        <MenuItem value="ru">{t('common:language.ru')}</MenuItem>
      </Select>
    </FormControl>
  )
}
