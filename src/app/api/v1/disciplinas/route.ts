import { NextResponse } from 'next/server'
import { asc, count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { disciplinas, tarefas } from '@/lib/db/schema'
import { cuidLike } from '@/lib/db/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await db.query.disciplinas.findMany({
      with: {
        grupos: true,
        horariosFixos: true,
      },
      orderBy: [asc(disciplinas.nome)],
    })

    const counts = await db
      .select({ disciplinaId: tarefas.disciplinaId, total: count(tarefas.id) })
      .from(tarefas)
      .groupBy(tarefas.disciplinaId)

    const countMap = new Map(counts.map((item) => [item.disciplinaId, item.total]))

    return NextResponse.json(
      rows.map((item) => ({
        ...item,
        _count: { tarefas: countMap.get(item.id) ?? 0 },
      }))
    )
  } catch (error) {
    console.error('Error listing disciplinas:', error)
    return NextResponse.json({ error: 'Erro ao listar disciplinas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, periodo, sharepointSiteId } = body

    if (!nome || !periodo) {
      return NextResponse.json({ error: 'Nome e período são obrigatórios' }, { status: 400 })
    }

    const disciplina = {
      id: cuidLike(),
      nome,
      periodo,
      sharepointSiteId: sharepointSiteId || null,
    }

    await db.insert(disciplinas).values(disciplina)
    return NextResponse.json(disciplina, { status: 201 })
  } catch (error) {
    console.error('Error creating disciplina:', error)
    return NextResponse.json({ error: 'Erro ao criar disciplina' }, { status: 500 })
  }
}
