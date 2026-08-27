'use client'

import React, { useState } from 'react'
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
  HeaderMenuButton,
  SideNav,
  SideNavItems,
  SideNavLink,
} from '@carbon/react'
import { Logout } from '@carbon/icons-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(false)

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
        <HeaderMenuButton
          aria-label={isSideNavExpanded ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setIsSideNavExpanded(!isSideNavExpanded)}
          isActive={isSideNavExpanded}
        />
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
          <HeaderGlobalAction aria-label="Sair do sistema" onClick={handleLogout}>
            <Logout size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      
      <SideNav
        aria-label="Navegação Lateral"
        expanded={isSideNavExpanded}
        isPersistent={false}
        onOverlayClick={() => setIsSideNavExpanded(false)}
      >
        <SideNavItems>
          <SideNavLink href="/dashboard" isActive={pathname === '/dashboard' || pathname === '/'}>
            Dashboard
          </SideNavLink>
          <SideNavLink href="/horario-fixo" isActive={pathname === '/horario-fixo'}>
            Horário Fixo
          </SideNavLink>
          <SideNavLink href="/disciplinas" isActive={pathname.startsWith('/disciplinas')}>
            Disciplinas & Grupos
          </SideNavLink>
          <SideNavLink href="/kanban" isActive={pathname === '/kanban'}>
            Kanban
          </SideNavLink>
          <SideNavLink href="/configuracoes" isActive={pathname === '/configuracoes'}>
            Configurações
          </SideNavLink>
        </SideNavItems>
      </SideNav>

      <Content style={{ paddingTop: '4rem', minHeight: 'calc(100vh - 4rem)' }}>{children}</Content>
    </div>
  )
}
