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

  const headers = [
    { key: 'dia', header: 'Dia da Semana' },
    { key: 'horario', header: 'Horário' },
    { key: 'disciplina', header: 'Disciplina' },
    { key: 'professor', header: 'Professor' },
    { key: 'sala', header: 'Sala Padrão' },
    { key: 'actions', header: 'Ações' },
  ]

  const rows = horarios.map((h) => ({
    id: h.id,
    dia: DIAS_SEMANA.find((d) => d.value === h.diaSemana)?.label || `Dia ${h.diaSemana}`,
    horario: `${h.horaInicio} - ${h.horaFim}`,
    disciplina: h.disciplina.nome,
    professor: h.professor,
    sala: h.salaPadrao,
  }))

  if (loading) return <Loading description="Carregando horários fixos..." />

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Horário Fixo Semanal</h1>
          <p style={{ color: '#6f6f6f' }}>Cadastre suas disciplinas e horários normais da semana pro semestre.</p>
        </div>
        <Button renderIcon={Add} onClick={handleOpenCreateModal}>
          Novo Horário
        </Button>
      </div>

      {error && <InlineNotification kind="error" title="Erro:" subtitle={error} style={{ marginBottom: '1.5rem' }} />}

      <Tile style={{ padding: '1rem' }}>
        <DataTable rows={rows} headers={headers}>
          {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => {
                    const { key, ...headerProps } = getHeaderProps({ header })
                    return (
                      <TableHeader key={key || header.key} {...headerProps}>
                        {header.header}
                      </TableHeader>
                    )
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} style={{ textAlign: 'center', fontStyle: 'italic', padding: '2rem' }}>
                      Nenhum horário fixo cadastrado ainda. Clique em &quot;Novo Horário&quot; para adicionar.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const item = horarios.find((h) => h.id === row.id)
                    const { key, ...rowProps } = getRowProps({ row })
                    return (
                      <TableRow key={key || row.id} {...rowProps}>
                        <TableCell>{row.cells[0].value}</TableCell>
                        <TableCell>{row.cells[1].value}</TableCell>
                        <TableCell>{row.cells[2].value}</TableCell>
                        <TableCell>{row.cells[3].value}</TableCell>
                        <TableCell>{row.cells[4].value}</TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {item && (
                              <Button
                                kind="ghost"
                                size="sm"
                                hasIconOnly
                                renderIcon={Edit}
                                iconDescription="Editar"
                                onClick={() => handleOpenEditModal(item)}
                              />
                            )}
                            <Button
                              kind="ghost"
                              size="sm"
                              hasIconOnly
                              renderIcon={TrashCan}
                              iconDescription="Excluir"
                              onClick={() => handleDelete(row.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </DataTable>
      </Tile>

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
