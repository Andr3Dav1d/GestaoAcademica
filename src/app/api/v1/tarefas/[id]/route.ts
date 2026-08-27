import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tarefas } from '@/lib/db/schema'
import { normalizeStringArray } from '@/lib/db/utils'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const tarefa = await db.query.tarefas.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
      with: { disciplina: true, grupo: true },
    })

    if (!tarefa) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Error fetching tarefa:', error)
    return NextResponse.json({ error: 'Erro ao buscar tarefa' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { titulo, descricao, disciplinaId, grupoId, status, prazo, responsaveis, notificada } = body

    const existing = await db.query.tarefas.findFirst({ where: (table, { eq }) => eq(table.id, params.id) })
    if (!existing) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const nextPrazo = prazo !== undefined ? new Date(prazo) : existing.prazo
    const prazoMudou = prazo !== undefined && existing.prazo.getTime() !== nextPrazo.getTime()

    await db
      .update(tarefas)
      .set({
        titulo: titulo ?? existing.titulo,
        descricao: descricao !== undefined ? descricao : existing.descricao,
        disciplinaId: disciplinaId !== undefined ? disciplinaId || null : existing.disciplinaId,
        grupoId: grupoId !== undefined ? grupoId || null : existing.grupoId,
        status: status ?? existing.status,
        prazo: nextPrazo,
        responsaveis: responsaveis !== undefined ? normalizeStringArray(responsaveis) : existing.responsaveis,
        notificada: prazoMudou ? false : notificada !== undefined ? notificada : existing.notificada,
        updatedAt: new Date(),
      })
      .where(eq(tarefas.id, params.id))

    const updated = await db.query.tarefas.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
      with: { disciplina: true, grupo: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating tarefa:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(tarefas).where(eq(tarefas.id, params.id))
    return NextResponse.json({ message: 'Tarefa removida' })
  } catch (error) {
    console.error('Error deleting tarefa:', error)
    return NextResponse.json({ error: 'Erro ao remover tarefa' }, { status: 500 })
  }
}
