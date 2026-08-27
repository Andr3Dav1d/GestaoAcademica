'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  Loading,
  InlineNotification,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@carbon/react'
import { ArrowRight, Time, Location, UserFollow } from '@carbon/icons-react'

interface TodayItem {
  id: string
  disciplinaNome: string
  professor: string
  horaInicio: string
  horaFim: string
  salaPadrao: string
  localFinal: string
  isLaboratorio: boolean
  origem: string
  agendamentoInfo?: {
    descricao?: string
    title?: string
  }
}

interface SalaAcessoLivre {
  id: string
  nome_sala: string
  ocupacao: number
  quantidade_computadores: number
  observacao?: string
}

interface Tarefa {
  id: string
  titulo: string
  prazo: string
  status: string
  disciplina?: { nome: string }
  grupo?: { nome: string }
}

const DIA_SEMANA_MAP: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
}

export default function DashboardPage() {
  const [schedule, setSchedule] = useState<TodayItem[]>([])
  const [freeLabs, setFreeLabs] = useState<SalaAcessoLivre[]>([])
  const [diaSemana, setDiaSemana] = useState<number>(1)
  const [urgentTasks, setUrgentTasks] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [dashRes, tasksRes] = await Promise.all([
          fetch('/api/v1/dashboard/hoje'),
          fetch('/api/v1/tarefas'),
        ])

        if (!dashRes.ok) throw new Error('Erro ao carregar agenda de hoje')
        const dashData = await dashRes.json()
        setSchedule(dashData.horarioHoje || [])
        setFreeLabs(dashData.salasAcessoLivre || [])
        setDiaSemana(dashData.diaSemana || 1)

        if (tasksRes.ok) {
          const tasksData: Tarefa[] = await tasksRes.json()
          const pending = tasksData
            .filter((t) => t.status !== 'CONCLUIDO')
            .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
            .slice(0, 3)
          setUrgentTasks(pending)
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
        else setError('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <Loading description="Carregando dashboard..." />
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Dashboard Acadêmico</h1>
        <p style={{ color: '#6f6f6f' }}>
          Hoje é {DIA_SEMANA_MAP[diaSemana] || 'Dia de aula'}. Veja sua grade de hoje e tarefas pendentes.
        </p>
      </div>

      {error && <InlineNotification kind="error" title="Erro:" subtitle={error} style={{ marginBottom: '1.5rem' }} />}

      <Grid style={{ marginBottom: '2rem' }}>
        {/* Main schedule section */}
        <Column sm={4} md={8} lg={10}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Horário de Aulas de Hoje</h2>
              <Tag type="blue">{schedule.length} {schedule.length === 1 ? 'aula' : 'aulas'}</Tag>
            </div>

            {schedule.length === 0 ? (
              <p style={{ color: '#6f6f6f', fontStyle: 'italic', padding: '1rem 0' }}>
                Nenhuma aula cadastrada no seu horário fixo para hoje.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderLeft: `4px solid ${item.isLaboratorio ? '#24a148' : '#0f62fe'}`,
                      padding: '1rem',
                      background: 'var(--cds-layer-02, #f4f4f4)',
                      borderRadius: '0 4px 4px 0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.disciplinaNome}</h3>
                      <div>
                        {item.isLaboratorio ? (
                          <span className="badge-lab">Laboratório: {item.localFinal}</span>
                        ) : (
                          <span className="badge-sala">Sala Padrão: {item.localFinal}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: '#525252', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Time size={16} /> {item.horaInicio} - {item.horaFim}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <UserFollow size={16} /> Prof(a). {item.professor}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Location size={16} /> {item.origem}
                      </span>
                    </div>

                    {item.agendamentoInfo?.descricao && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6f6f6f' }}>
                        Obs: {item.agendamentoInfo.descricao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Tile>
        </Column>

        {/* Side cards */}
        <Column sm={4} md={8} lg={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Free Labs Card */}
            <Tile style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Laboratórios de Acesso Livre
              </h3>
              {freeLabs.length === 0 ? (
                <p style={{ color: '#6f6f6f', fontSize: '0.9rem' }}>Nenhum laboratório livre informado pela API hoje.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {freeLabs.map((lab) => (
                    <div
                      key={lab.id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--cds-layer-02, #f4f4f4)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{lab.nome_sala}</strong>
                        {lab.observacao && (
                          <div style={{ fontSize: '0.8rem', color: '#6f6f6f' }}>{lab.observacao}</div>
                        )}
                      </div>
                      <Tag type={lab.ocupacao > lab.quantidade_computadores ? 'red' : 'green'}>
                        {lab.ocupacao} / {lab.quantidade_computadores} computadores
                      </Tag>
                    </div>
                  ))}
                </div>
              )}
            </Tile>

            {/* Upcoming urgent tasks card */}
            <Tile style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tarefas Próximas do Prazo</h3>
                <Link href="/kanban" passHref legacyBehavior>
                  <Button kind="ghost" size="sm" renderIcon={ArrowRight}>
                    Ver Kanban
                  </Button>
                </Link>
              </div>

              {urgentTasks.length === 0 ? (
                <p style={{ color: '#6f6f6f', fontSize: '0.9rem' }}>Nenhuma tarefa pendente no momento!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {urgentTasks.map((t) => {
                    const prazoDate = new Date(t.prazo)
                    const isOverdue = prazoDate < new Date()
                    const diffHours = (prazoDate.getTime() - Date.now()) / (1000 * 60 * 60)
                    const isUrgent = diffHours < 48

                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem',
                          background: 'var(--cds-layer-02, #f4f4f4)',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.titulo}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6f6f6f' }}>
                            {t.disciplina?.nome || 'Tarefa Individual'}
                          </div>
                        </div>
                        <div>
                          {isOverdue ? (
                            <span className="badge-overdue">Vencida</span>
                          ) : isUrgent ? (
                            <span className="badge-urgent">&lt; 48h</span>
                          ) : (
                            <Tag type="gray">
                              {prazoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </Tag>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Tile>
          </div>
        </Column>
      </Grid>
    </div>
  )
}
