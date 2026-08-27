import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gestao-academica-secret-key-change-me-in-prod'
)

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (typeof payload.username === 'string') {
      return { username: payload.username }
    }
    return null
  } catch {
    return null
  }
}

export async function getAuthTokenFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, v.join('=')]
      })
    )
    if (cookies.auth_token) {
      return cookies.auth_token
    }
  }

  return null
}

export async function authenticateRequest(request: Request) {
  const token = await getAuthTokenFromRequest(request)
  if (!token) return null
  return await verifyToken(token)
}
