import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'

export type ColorMode = 'light' | 'dark'

const STORAGE_KEY = 'app.colorMode'

function readInitialMode(): ColorMode {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'light' || raw === 'dark' ? raw : 'dark'
}

type ColorModeContextValue = {
  mode: ColorMode
  setMode: (mode: ColorMode) => void
  toggleMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null)

export function ColorModeProvider(props: PropsWithChildren): React.ReactNode {
  const [mode, setModeState] = useState<ColorMode>(() => readInitialMode())

  const value = useMemo<ColorModeContextValue>(() => {
    return {
      mode,
      setMode: (next) => {
        setModeState(next)
        localStorage.setItem(STORAGE_KEY, next)
      },
      toggleMode: () => {
        const next: ColorMode = mode === 'dark' ? 'light' : 'dark'
        setModeState(next)
        localStorage.setItem(STORAGE_KEY, next)
      },
    }
  }, [mode])

  return <ColorModeContext.Provider value={value}>{props.children}</ColorModeContext.Provider>
}

export function useColorMode(): ColorModeContextValue {
  const ctx = useContext(ColorModeContext)
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider')
  return ctx
}
