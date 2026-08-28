import { asc } from 'drizzle-orm'
import { db } from './db'
import { horariosFixos } from './db/schema'
import { SalaAcessoLivre, fetchSalasToday } from './salas-api'

export interface TodayScheduleItem {
  id: string
  disciplinaId: string
  disciplinaNome: string
  professor: string
  horaInicio: string
  horaFim: string
  salaPadrao: string
  localFinal: string
  isLaboratorio: boolean
  origem: string
  agendamentoInfo?: {
    id: string
    descricao?: string
    title?: string
  }
}

export interface TodayScheduleResult {
  horarioHoje: TodayScheduleItem[]
  salasAcessoLivre: SalaAcessoLivre[]
  diaSemana: number
}

function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length < 2) return 0
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0)
}

function extractTimeFromIso(isoStr: string): string {
  try {
    const match = isoStr.match(/T(\d{2}:\d{2})/)
    return match?.[1] || '00:00'
  } catch {
    return '00:00'
  }
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  return Math.max(s1, s2) < Math.min(e1, e2)
}

function matchProfessor(prof1: string, prof2: string): { matched: boolean; lowConfidence: boolean } {
  const n1 = normalizeString(prof1)
  const n2 = normalizeString(prof2)

  if (n1 === n2) return { matched: true, lowConfidence: false }
  if (n1.includes(n2) || n2.includes(n1)) return { matched: true, lowConfidence: true }

  const parts1 = n1.split(/\s+/).filter((p) => p.length > 2)
  const parts2 = n2.split(/\s+/).filter((p) => p.length > 2)
  const common = parts1.filter((p) => parts2.includes(p))

  return { matched: common.length >= 2, lowConfidence: common.length >= 2 }
}

export async function getTodaySchedule(customDay?: number, forceRefresh?: boolean): Promise<TodayScheduleResult> {
  const now = new Date()
  const diaSemana = customDay || (now.getDay() === 0 ? 7 : now.getDay())

  const aulasHoje = await db.query.horariosFixos.findMany({
    where: (table, { eq }) => eq(table.diaSemana, diaSemana),
    with: { disciplina: true },
    orderBy: [asc(horariosFixos.horaInicio)],
  })

  const salasData = await fetchSalasToday(forceRefresh)

  const horarioHoje: TodayScheduleItem[] = aulasHoje.map((hf) => {
    const matchedAgendamento = salasData.agendamentos.find((ag) => {
      const professorMatch = matchProfessor(hf.professor, ag.usuario_nome)
      const timeMatch = timesOverlap(hf.horaInicio, hf.horaFim, extractTimeFromIso(ag.start), extractTimeFromIso(ag.end))

      if (professorMatch.matched && professorMatch.lowConfidence) {
        console.warn(`Professor matched with low confidence: "${hf.professor}" ~ "${ag.usuario_nome}"`)
      }

      return professorMatch.matched && timeMatch
    })

    return {
      id: hf.id,
      disciplinaId: hf.disciplinaId,
      disciplinaNome: hf.disciplina.nome,
      professor: hf.professor,
      horaInicio: hf.horaInicio,
      horaFim: hf.horaFim,
      salaPadrao: hf.salaPadrao,
      localFinal: matchedAgendamento?.sala_nome || hf.salaPadrao,
      isLaboratorio: Boolean(matchedAgendamento),
      origem: matchedAgendamento ? 'Laboratório (API)' : 'Sala Padrão',
      agendamentoInfo: matchedAgendamento
        ? {
            id: matchedAgendamento.id,
            descricao: matchedAgendamento.descricao,
            title: matchedAgendamento.title,
          }
        : undefined,
    }
  })

  return {
    horarioHoje,
    salasAcessoLivre: salasData.salas_acesso_livre,
    diaSemana,
  }
}
