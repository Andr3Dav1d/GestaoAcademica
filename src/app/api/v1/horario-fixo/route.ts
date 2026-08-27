import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { horariosFixos } from '@/lib/db/schema'
import { cuidLike } from '@/lib/db/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const diaSemana = searchParams.get('diaSemana')

    const rows = await db.query.horariosFixos.findMany({
      where: diaSemana ? (table, { eq }) => eq(table.diaSemana, Number(diaSemana)) : undefined,
      with: { disciplina: true },
      orderBy: [asc(horariosFixos.diaSemana), asc(horariosFixos.horaInicio)],
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error listing horarios fixos:', error)
    return NextResponse.json({ error: 'Erro ao listar horários fixos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { disciplinaId, professor, diaSemana, horaInicio, horaFim, salaPadrao } = body

    if (!disciplinaId || !professor || !diaSemana || !horaInicio || !horaFim) {
      return NextResponse.json(
        { error: 'disciplinaId, professor, diaSemana, horaInicio e horaFim são obrigatórios' },
        { status: 400 }
      )
    }

    const horario = {
      id: cuidLike(),
      disciplinaId,
      professor,
      diaSemana: Number(diaSemana),
      horaInicio,
      horaFim,
      salaPadrao: salaPadrao || 'D405',
    }

    await db.insert(horariosFixos).values(horario)
    const created = await db.query.horariosFixos.findFirst({
      where: (table, { eq }) => eq(table.id, horario.id),
      with: { disciplina: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating horario fixo:', error)
    return NextResponse.json({ error: 'Erro ao criar horário fixo' }, { status: 500 })
  }
}
