'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Theme } from '@carbon/react'

type ThemeMode = 'g10' | 'g100'

interface ThemeContextType {
  theme: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'g100',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('g100')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('app-carbon-theme') as ThemeMode
    if (saved === 'g10' || saved === 'g100') {
      setTheme(saved)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-carbon-theme', theme)
      localStorage.setItem('app-carbon-theme', theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'g10' ? 'g100' : 'g10'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Theme theme={theme}>{children}</Theme>
    </ThemeContext.Provider>
  )
}

export const useAppTheme = () => useContext(ThemeContext)
