import { CssBaseline, ThemeProvider } from '@mui/material'
import { useMemo, type PropsWithChildren } from 'react'
import { ColorModeProvider, useColorMode } from '@theme/ColorModeProvider'
import { createAppTheme } from '@theme/createAppTheme'

function MuiThemeProviders(props: PropsWithChildren): React.ReactNode {
  const { mode } = useColorMode()
  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {props.children}
    </ThemeProvider>
  )
}

export function AppProviders(props: PropsWithChildren): React.ReactNode {
  return (
    <ColorModeProvider>
      <MuiThemeProviders>{props.children}</MuiThemeProviders>
    </ColorModeProvider>
  )
}
