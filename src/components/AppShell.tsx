'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Content,
} from '@carbon/react'
import { Asleep, Light, Logout } from '@carbon/icons-react'
import { useAppTheme } from './ThemeProvider'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useAppTheme()

  const isLoginPage = pathname === '/login'

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  if (isLoginPage) {
    return <main>{children}</main>
  }

  return (
    <div className="app-shell">
      <Header aria-label="Gestão Acadêmica">
        <HeaderName href="/dashboard" prefix="ADS">
          Gestão Acadêmica
        </HeaderName>
        <HeaderNavigation aria-label="Navegação Principal">
          <HeaderMenuItem href="/dashboard" isActive={pathname === '/dashboard' || pathname === '/'}>
            Dashboard
          </HeaderMenuItem>
          <HeaderMenuItem href="/horario-fixo" isActive={pathname === '/horario-fixo'}>
            Horário Fixo
          </HeaderMenuItem>
          <HeaderMenuItem href="/disciplinas" isActive={pathname.startsWith('/disciplinas')}>
            Disciplinas & Grupos
          </HeaderMenuItem>
          <HeaderMenuItem href="/kanban" isActive={pathname === '/kanban'}>
            Kanban
          </HeaderMenuItem>
          <HeaderMenuItem href="/configuracoes" isActive={pathname === '/configuracoes'}>
            Configurações
          </HeaderMenuItem>
        </HeaderNavigation>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label={`Tema: ${theme === 'g10' ? 'Claro (g10)' : 'Escuro (g100)'}`}
            onClick={toggleTheme}
          >
            {theme === 'g10' ? <Asleep size={20} /> : <Light size={20} />}
          </HeaderGlobalAction>
          <HeaderGlobalAction aria-label="Sair do sistema" onClick={handleLogout}>
            <Logout size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <Content style={{ paddingTop: '4rem', minHeight: 'calc(100vh - 4rem)' }}>{children}</Content>
    </div>
  )
}
