import { NextResponse } from 'next/server'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tarefas } from '@/lib/db/schema'
import { cuidLike, normalizeStringArray } from '@/lib/db/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const disciplinaId = searchParams.get('disciplinaId')
    const apenasIndividuais = searchParams.get('individuais') === 'true'
    const status = searchParams.get('status')

    const filters = [
      disciplinaId ? eq(tarefas.disciplinaId, disciplinaId) : undefined,
      apenasIndividuais ? isNull(tarefas.grupoId) : undefined,
      status ? eq(tarefas.status, status) : undefined,
    ].filter(Boolean)

    const rows = await db.query.tarefas.findMany({
      where: filters.length ? and(...filters) : undefined,
      with: { disciplina: true, grupo: true },
      orderBy: [asc(tarefas.prazo)],
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error listing tarefas:', error)
    return NextResponse.json({ error: 'Erro ao listar tarefas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { titulo, descricao, disciplinaId, grupoId, status, prazo, responsaveis } = body

    if (!titulo || !prazo) {
      return NextResponse.json({ error: 'Título e prazo são obrigatórios' }, { status: 400 })
    }

    const tarefa = {
      id: cuidLike(),
      titulo,
      descricao: descricao || null,
      disciplinaId: disciplinaId || null,
      grupoId: grupoId || null,
      status: status || 'A_FAZER',
      prazo: new Date(prazo),
      responsaveis: normalizeStringArray(responsaveis),
      notificada: false,
    }

    await db.insert(tarefas).values(tarefa)
    const created = await db.query.tarefas.findFirst({
      where: (table, { eq }) => eq(table.id, tarefa.id),
      with: { disciplina: true, grupo: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating tarefa:', error)
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}
