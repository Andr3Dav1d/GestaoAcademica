'use client'

import React from 'react'
import { Theme } from '@carbon/react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme="g100">{children}</Theme>
  )
}
