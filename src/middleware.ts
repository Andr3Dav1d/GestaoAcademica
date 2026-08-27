import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — sem autenticação necessária
  if (
    pathname === '/login' ||
    pathname === '/api/v1/auth/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Extrair token: primeiro cookie (Web UI), depois header Bearer (Flutter/API)
  let token: string | undefined = request.cookies.get('auth_token')?.value

  if (!token) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) token = authHeader.substring(7)
  }

  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
