import { createTheme, type Theme } from '@mui/material'
import type { ColorMode } from './ColorModeProvider'

export function createAppTheme(mode: ColorMode): Theme {
  return createTheme({
    palette: {
      mode,
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    },
    components: {
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiButton: {
        defaultProps: {
          size: 'small',
        },
      },
    },
  })
}
