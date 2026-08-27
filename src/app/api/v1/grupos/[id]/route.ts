import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { grupos } from '@/lib/db/schema'
import { normalizeStringArray } from '@/lib/db/utils'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const grupo = await db.query.grupos.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
      with: { disciplina: true, tarefas: true },
    })

    if (!grupo) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    return NextResponse.json(grupo)
  } catch (error) {
    console.error('Error fetching grupo:', error)
    return NextResponse.json({ error: 'Erro ao buscar grupo' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nome, tema, participantes, disciplinaId } = body

    const existing = await db.query.grupos.findFirst({ where: (table, { eq }) => eq(table.id, params.id) })
    if (!existing) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    const data = {
      nome: nome ?? existing.nome,
      tema: tema !== undefined ? tema : existing.tema,
      disciplinaId: disciplinaId ?? existing.disciplinaId,
      participantes: participantes !== undefined ? normalizeStringArray(participantes) : existing.participantes,
      updatedAt: new Date(),
    }

    await db.update(grupos).set(data).where(eq(grupos.id, params.id))
    const updated = await db.query.grupos.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
      with: { disciplina: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating grupo:', error)
    return NextResponse.json({ error: 'Erro ao atualizar grupo' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(grupos).where(eq(grupos.id, params.id))
    return NextResponse.json({ message: 'Grupo removido' })
  } catch (error) {
    console.error('Error deleting grupo:', error)
    return NextResponse.json({ error: 'Erro ao remover grupo' }, { status: 500 })
  }
}
