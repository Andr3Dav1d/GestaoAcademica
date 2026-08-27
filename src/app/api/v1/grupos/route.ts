import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { grupos } from '@/lib/db/schema'
import { cuidLike, normalizeStringArray } from '@/lib/db/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const disciplinaId = searchParams.get('disciplinaId')

    const rows = await db.query.grupos.findMany({
      where: disciplinaId ? (table, { eq }) => eq(table.disciplinaId, disciplinaId) : undefined,
      with: { disciplina: true, tarefas: true },
      orderBy: [asc(grupos.nome)],
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error listing grupos:', error)
    return NextResponse.json({ error: 'Erro ao listar grupos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, disciplinaId, tema, participantes } = body

    if (!nome || !disciplinaId) {
      return NextResponse.json({ error: 'Nome e disciplinaId são obrigatórios' }, { status: 400 })
    }

    const grupo = {
      id: cuidLike(),
      nome,
      disciplinaId,
      tema: tema || null,
      participantes: normalizeStringArray(participantes),
    }

    await db.insert(grupos).values(grupo)
    const created = await db.query.grupos.findFirst({
      where: (table, { eq }) => eq(table.id, grupo.id),
      with: { disciplina: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating grupo:', error)
    return NextResponse.json({ error: 'Erro ao criar grupo' }, { status: 500 })
  }
}
