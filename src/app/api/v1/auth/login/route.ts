import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
    }

    const expectedUser = process.env.AUTH_USERNAME || 'admin'
    const expectedHash = process.env.AUTH_PASSWORD_HASH
    const expectedPlain = process.env.AUTH_PASSWORD || 'admin123'

    let isValid = false

    if (username === expectedUser) {
      if (expectedHash) {
        isValid = await bcrypt.compare(password, expectedHash)
      } else {
        isValid = password === expectedPlain
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const token = await signToken(username)

    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      user: { username },
    })

    // Usa HTTPS somente se APP_URL começar com https — permite Docker em HTTP local
    const isHttps = (process.env.APP_URL || '').startsWith('https')

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erro interno ao realizar login' }, { status: 500 })
  }
}
