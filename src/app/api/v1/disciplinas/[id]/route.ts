import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { disciplinas, tarefas } from '@/lib/db/schema'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const disciplina = await db.query.disciplinas.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
      with: {
        grupos: true,
        horariosFixos: true,
        tarefas: {
          orderBy: [asc(tarefas.prazo)],
        },
      },
    })

    if (!disciplina) {
      return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
    }

    return NextResponse.json(disciplina)
  } catch (error) {
    console.error('Error fetching disciplina:', error)
    return NextResponse.json({ error: 'Erro ao buscar disciplina' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nome, periodo, sharepointSiteId } = body

    const existing = await db.query.disciplinas.findFirst({ where: (table, { eq }) => eq(table.id, params.id) })
    if (!existing) {
      return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
    }

    const data = {
      nome: nome ?? existing.nome,
      periodo: periodo ?? existing.periodo,
      sharepointSiteId: sharepointSiteId !== undefined ? sharepointSiteId : existing.sharepointSiteId,
      updatedAt: new Date(),
    }

    await db.update(disciplinas).set(data).where(eq(disciplinas.id, params.id))
    return NextResponse.json({ ...existing, ...data })
  } catch (error) {
    console.error('Error updating disciplina:', error)
    return NextResponse.json({ error: 'Erro ao atualizar disciplina' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(disciplinas).where(eq(disciplinas.id, params.id))
    return NextResponse.json({ message: 'Disciplina removida' })
  } catch (error) {
    console.error('Error deleting disciplina:', error)
    return NextResponse.json({ error: 'Erro ao remover disciplina' }, { status: 500 })
  }
}
