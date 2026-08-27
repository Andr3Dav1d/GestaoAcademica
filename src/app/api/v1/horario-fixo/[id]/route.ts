import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { horariosFixos } from '@/lib/db/schema'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const horario = await db.query.horariosFixos.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
      with: { disciplina: true },
    })

    if (!horario) {
      return NextResponse.json({ error: 'Horário fixo não encontrado' }, { status: 404 })
    }

    return NextResponse.json(horario)
  } catch (error) {
    console.error('Error fetching horario fixo:', error)
    return NextResponse.json({ error: 'Erro ao buscar horário fixo' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { disciplinaId, professor, diaSemana, horaInicio, horaFim, salaPadrao } = body

    const existing = await db.query.horariosFixos.findFirst({ where: (table, { eq }) => eq(table.id, params.id) })
    if (!existing) {
      return NextResponse.json({ error: 'Horário fixo não encontrado' }, { status: 404 })
    }

    await db
      .update(horariosFixos)
      .set({
        disciplinaId: disciplinaId ?? existing.disciplinaId,
        professor: professor ?? existing.professor,
        diaSemana: diaSemana !== undefined ? Number(diaSemana) : existing.diaSemana,
        horaInicio: horaInicio ?? existing.horaInicio,
        horaFim: horaFim ?? existing.horaFim,
        salaPadrao: salaPadrao ?? existing.salaPadrao,
        updatedAt: new Date(),
      })
      .where(eq(horariosFixos.id, params.id))

    const updated = await db.query.horariosFixos.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
      with: { disciplina: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating horario fixo:', error)
    return NextResponse.json({ error: 'Erro ao atualizar horário fixo' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(horariosFixos).where(eq(horariosFixos.id, params.id))
    return NextResponse.json({ message: 'Horário fixo removido' })
  } catch (error) {
    console.error('Error deleting horario fixo:', error)
    return NextResponse.json({ error: 'Erro ao remover horário fixo' }, { status: 500 })
  }
}
