'use client'

import React, { useEffect, useState } from 'react'
import {
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Modal,
  TextInput,
  Select,
  SelectItem,
  InlineNotification,
  Loading,
  Tile,
} from '@carbon/react'
import { Add, TrashCan, Edit } from '@carbon/icons-react'

interface Disciplina {
  id: string
  nome: string
}

interface HorarioFixo {
  id: string
  disciplinaId: string
  disciplina: Disciplina
  professor: string
  diaSemana: number
  horaInicio: string
  horaFim: string
  salaPadrao: string
}

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

export default function HorarioFixoPage() {
  const [horarios, setHorarios] = useState<HorarioFixo[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HorarioFixo | null>(null)

  // Form state
  const [disciplinaId, setDisciplinaId] = useState('')
  const [professor, setProfessor] = useState('')
  const [diaSemana, setDiaSemana] = useState('1')
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [horaFim, setHoraFim] = useState('10:50')
  const [salaPadrao, setSalaPadrao] = useState('D405')

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [hRes, dRes] = await Promise.all([
        fetch('/api/v1/horario-fixo'),
        fetch('/api/v1/disciplinas'),
      ])

      if (!hRes.ok || !dRes.ok) throw new Error('Erro ao buscar dados do servidor')

      const hData = await hRes.json()
      const dData = await dRes.json()

      setHorarios(hData)
      setDisciplinas(dData)
      if (dData.length > 0 && !disciplinaId) {
        setDisciplinaId(dData[0].id)
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [disciplinaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setProfessor('')
    setDiaSemana('1')
    setHoraInicio('08:00')
    setHoraFim('10:50')
    setSalaPadrao('D405')
    if (disciplinas.length > 0) setDisciplinaId(disciplinas[0].id)
    setModalOpen(true)
  }

  const handleOpenEditModal = (item: HorarioFixo) => {
    setEditingItem(item)
    setDisciplinaId(item.disciplinaId)
    setProfessor(item.professor)
    setDiaSemana(item.diaSemana.toString())
    setHoraInicio(item.horaInicio)
    setHoraFim(item.horaFim)
    setSalaPadrao(item.salaPadrao)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!disciplinaId || !professor || !horaInicio || !horaFim) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const payload = {
      disciplinaId,
      professor,
      diaSemana: Number(diaSemana),
      horaInicio,
      horaFim,
      salaPadrao: salaPadrao || 'D405',
    }

    try {
      const url = editingItem ? `/api/v1/horario-fixo/${editingItem.id}` : '/api/v1/horario-fixo'
      const method = editingItem ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Falha ao salvar horário')

      setModalOpen(false)
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este horário?')) return

    try {
      const res = await fetch(`/api/v1/horario-fixo/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir horário')
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  if (loading) return <Loading description="Carregando horários fixos..." />

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Horário Fixo Semanal</h1>
          <p style={{ color: '#6f6f6f' }}>Cadastre suas disciplinas e horários normais da semana pro semestre.</p>
        </div>
        <Button renderIcon={Add} onClick={handleOpenCreateModal}>
          Novo Horário
        </Button>
      </div>

      {error && <InlineNotification kind="error" title="Erro:" subtitle={error} style={{ marginBottom: '1.5rem' }} />}

      {horarios.length === 0 ? (
        <Tile style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>Nenhum horário fixo cadastrado ainda.</p>
          <Button renderIcon={Add} onClick={handleOpenCreateModal}>
            Cadastrar Primeiro Horário
          </Button>
        </Tile>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {DIAS_SEMANA.map((dia) => {
            const horariosDoDia = horarios
              .filter((h) => h.diaSemana === dia.value)
              .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

            if (horariosDoDia.length === 0) return null

            return (
              <Tile key={dia.value} style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--cds-border-subtle, #222222)', paddingBottom: '0.5rem' }}>
                  {dia.label}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {horariosDoDia.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'var(--cds-layer-01, #0d0d0d)',
                        border: '1px solid var(--cds-border-subtle, #222222)',
                        borderRadius: '4px',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', flex: 1 }}>
                        {/* Horário */}
                        <div style={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          background: 'var(--cds-layer-02, #161616)',
                          border: '1px solid var(--cds-border-subtle, #222222)',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '4px',
                          color: '#0f62fe',
                          minWidth: '110px',
                          textAlign: 'center'
                        }}>
                          {item.horaInicio} - {item.horaFim}
                        </div>

                        {/* Disciplina e Professor */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.15rem' }}>
                            {item.disciplina.nome}
                          </h4>
                          <span style={{ fontSize: '0.85rem', color: '#8d8d8d' }}>
                            Prof(a). {item.professor}
                          </span>
                        </div>

                        {/* Sala */}
                        <div>
                          <span className="badge-sala" style={{ backgroundColor: '#161616', border: '1px solid #333333', color: '#f4f4f4', padding: '4px 10px' }}>
                            Sala: {item.salaPadrao}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          renderIcon={Edit}
                          iconDescription="Editar"
                          onClick={() => handleOpenEditModal(item)}
                        />
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          renderIcon={TrashCan}
                          iconDescription="Excluir"
                          onClick={() => handleDelete(item.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Tile>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        modalHeading={editingItem ? 'Editar Horário Fixo' : 'Novo Horário Fixo'}
        primaryButtonText="Salvar"
        secondaryButtonText="Cancelar"
        onRequestSubmit={handleSave}
        onRequestClose={() => setModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <Select
            id="disciplina-select"
            labelText="Disciplina"
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
          >
            {disciplinas.map((d) => (
              <SelectItem key={d.id} value={d.id} text={d.nome} />
            ))}
          </Select>

          <TextInput
            id="prof-input"
            labelText="Nome do Professor"
            placeholder="Ex: Márcia Pantoja"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            required
          />

          <Select
            id="dia-select"
            labelText="Dia da Semana"
            value={diaSemana}
            onChange={(e) => setDiaSemana(e.target.value)}
          >
            {DIAS_SEMANA.map((d) => (
              <SelectItem key={d.value} value={d.value.toString()} text={d.label} />
            ))}
          </Select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <TextInput
              id="inicio-input"
              labelText="Horário Início"
              placeholder="08:00"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              required
            />
            <TextInput
              id="fim-input"
              labelText="Horário Fim"
              placeholder="10:50"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              required
            />
          </div>

          <TextInput
            id="sala-input"
            labelText="Sala Padrão"
            placeholder="D405"
            value={salaPadrao}
            onChange={(e) => setSalaPadrao(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
