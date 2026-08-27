import { NextResponse } from 'next/server'
import { getTodaySchedule } from '@/lib/schedule'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const diaSemanaParam = searchParams.get('diaSemana')
    const customDay = diaSemanaParam ? parseInt(diaSemanaParam, 10) : undefined

    const schedule = await getTodaySchedule(customDay)
    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching today schedule:', error)
    return NextResponse.json({ error: 'Erro ao carregar o quadro de horários de hoje' }, { status: 500 })
  }
}
