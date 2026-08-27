export interface Agendamento {
  id: string
  title: string
  start: string
  end: string
  color?: string
  status?: string
  tipo?: string
  descricao?: string
  observacao?: string
  usuario_nome: string
  sala_nome: string
}

export interface SalaAcessoLivre {
  id: string
  nome_sala: string
  ocupacao: number
  quantidade_computadores: number
  observacao?: string
  status?: string
}

export interface SalasApiResponse {
  agendamentos: Agendamento[]
  salas_acesso_livre: SalaAcessoLivre[]
}

let cachedData: SalasApiResponse | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 4 * 60 * 1000 // 4 minutes

export async function fetchSalasToday(): Promise<SalasApiResponse> {
  const now = Date.now()
  if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData
  }

  const tenant = process.env.GESTAO_SALAS_TENANT || 'alcindo'
  const url = `https://ecosistemaveloz.com.br/api/v1/gestao-salas/agendamentos/today/?tenant=${tenant}`

  try {
    const res = await fetch(url, {
      next: { revalidate: 240 },
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`External API returned HTTP ${res.status}`)
    }

    const data: SalasApiResponse = await res.json()
    cachedData = {
      agendamentos: Array.isArray(data.agendamentos) ? data.agendamentos : [],
      salas_acesso_livre: Array.isArray(data.salas_acesso_livre) ? data.salas_acesso_livre : [],
    }
    cacheTimestamp = now
    return cachedData
  } catch (error) {
    console.error('Error fetching salas API:', error)
    return cachedData || { agendamentos: [], salas_acesso_livre: [] }
  }
}
