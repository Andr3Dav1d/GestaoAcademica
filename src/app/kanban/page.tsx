'use client'

import React, { useEffect, useState } from 'react'
import {
  Button,
  Tile,
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Checkbox,
  InlineNotification,
  Loading,
  Tag,
} from '@carbon/react'
import { Add, TrashCan, Edit, Filter } from '@carbon/icons-react'

interface Disciplina {
  id: string
  nome: string
}

interface Grupo {
  id: string
  nome: string
  participantes?: string[]
}

interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  disciplinaId?: string
  disciplina?: Disciplina
  grupoId?: string
  grupo?: Grupo
  status: string
  prazo: string
  responsaveis: string[]
}

const COLUMNS = [
  { id: 'A_FAZER', label: 'A Fazer' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { id: 'EM_REVISAO', label: 'Em Revisão' },
  { id: 'CONCLUIDO', label: 'Concluído' },
]

export default function KanbanPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [antecedenciaHoras, setAntecedenciaHoras] = useState(48)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterDisciplina, setFilterDisciplina] = useState('')
  const [filterIndividuais, setFilterIndividuais] = useState(false)

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // Task Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [status, setStatus] = useState('A_FAZER')
  const [prazo, setPrazo] = useState('')
  const [responsaveis, setResponsaveis] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [tRes, dRes, gRes, cRes] = await Promise.all([
        fetch('/api/v1/tarefas'),
        fetch('/api/v1/disciplinas'),
        fetch('/api/v1/grupos'),
        fetch('/api/v1/config/webhook'),
      ])

      if (!tRes.ok || !dRes.ok || !gRes.ok) throw new Error('Erro ao carregar dados do servidor')

      setTarefas(await tRes.json())
      setDisciplinas(await dRes.json())
      setGrupos(await gRes.json())
      if (cRes.ok) {
        const configData = await cRes.json()
        setAntecedenciaHoras(configData.antecedenciaHoras || 48)
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered Tasks
  const filteredTarefas = tarefas.filter((t) => {
    if (filterDisciplina && t.disciplinaId !== filterDisciplina) return false
    if (filterIndividuais && t.grupoId !== null && t.grupoId !== undefined) return false
    return true
  })

  // Available groups based on selected discipline in modal
  const availableGrupos = grupoId && !disciplinaId
    ? grupos
    : disciplinaId
    ? grupos.filter((g) => (g as unknown as { disciplinaId: string }).disciplinaId === disciplinaId)
    : grupos

  // Handlers
  const handleOpenCreateModal = (initialStatus = 'A_FAZER') => {
    setEditingTask(null)
    setTitulo('')
    setDescricao('')
    setDisciplinaId('')
    setGrupoId('')
    setStatus(initialStatus)

    // default deadline tomorrow 23:59
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 0, 0)
    setPrazo(tomorrow.toISOString().slice(0, 16))

    setResponsaveis('')
    setModalOpen(true)
  }

  const handleOpenEditModal = (t: Tarefa) => {
    setEditingTask(t)
    setTitulo(t.titulo)
    setDescricao(t.descricao || '')
    setDisciplinaId(t.disciplinaId || '')
    setGrupoId(t.grupoId || '')
    setStatus(t.status)
    setPrazo(new Date(t.prazo).toISOString().slice(0, 16))
    setResponsaveis(Array.isArray(t.responsaveis) ? t.responsaveis.join(', ') : '')
    setModalOpen(true)
  }

  const handleSaveTask = async () => {
    if (!titulo || !prazo) {
      alert('Título e prazo são obrigatórios')
      return
    }

    const responsaveisList = responsaveis
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)

    const payload = {
      titulo,
      descricao: descricao || null,
      disciplinaId: disciplinaId || null,
      grupoId: grupoId || null,
      status,
      prazo: new Date(prazo).toISOString(),
      responsaveis: responsaveisList,
    }

    try {
      const url = editingTask ? `/api/v1/tarefas/${editingTask.id}` : '/api/v1/tarefas'
      const method = editingTask ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Erro ao salvar tarefa')

      setModalOpen(false)
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja excluir esta tarefa?')) return

    try {
      const res = await fetch(`/api/v1/tarefas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir tarefa')
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  // Drag and Drop
  const handleDragStart = (id: string) => {
    setDraggedTaskId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: string) => {
    if (!draggedTaskId) return

    const task = tarefas.find((t) => t.id === draggedTaskId)
    if (!task || task.status === newStatus) {
      setDraggedTaskId(null)
      return
    }

    // Optimistic update
    setTarefas((prev) =>
      prev.map((t) => (t.id === draggedTaskId ? { ...t, status: newStatus } : t))
    )
    setDraggedTaskId(null)

    try {
      const res = await fetch(`/api/v1/tarefas/${draggedTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Erro ao atualizar status da tarefa')
    } catch (err) {
      console.error(err)
      loadData() // rollback
    }
  }

  if (loading) return <Loading description="Carregando Kanban..." />

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Quadro Kanban de Tarefas</h1>
          <p style={{ color: '#6f6f6f' }}>Organize seus prazos e entregas por disciplinas e grupos.</p>
        </div>
        <Button renderIcon={Add} onClick={() => handleOpenCreateModal('A_FAZER')}>
          Nova Tarefa
        </Button>
      </div>

      {error && <InlineNotification kind="error" title="Erro:" subtitle={error} style={{ marginBottom: '1.5rem' }} />}

      {/* Filter Bar */}
      <Tile style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Filter size={20} /> Filtros:
        </div>
        <div style={{ minWidth: '220px' }}>
          <Select
            id="filter-disc"
            labelText=""
            aria-label="Filtrar por disciplina"
            value={filterDisciplina}
            onChange={(e) => setFilterDisciplina(e.target.value)}
            size="sm"
          >
            <SelectItem value="" text="Todas as Disciplinas" />
            {disciplinas.map((d) => (
              <SelectItem key={d.id} value={d.id} text={d.nome} />
            ))}
          </Select>
        </div>

        <Checkbox
          id="filter-indiv"
          labelText="Só minhas tarefas individuais"
          checked={filterIndividuais}
          onChange={(_, { checked }) => setFilterIndividuais(checked)}
        />
      </Tile>

      {/* Board */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colTasks = filteredTarefas.filter((t) => t.status === col.id)

          return (
            <div
              key={col.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{col.label}</h3>
                <Tag type="blue">{colTasks.length}</Tag>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {colTasks.map((t) => {
                  const prazoDate = new Date(t.prazo)
                  const isOverdue = col.id !== 'CONCLUIDO' && prazoDate < new Date()
                  const diffHours = (prazoDate.getTime() - Date.now()) / (1000 * 60 * 60)
                  const isUrgent = col.id !== 'CONCLUIDO' && !isOverdue && diffHours < antecedenciaHoras

                  return (
                    <div
                      key={t.id}
                      className={`kanban-card ${draggedTaskId === t.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(t.id)}
                      onClick={() => handleOpenEditModal(t)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '1rem', flex: 1, paddingRight: '0.5rem' }}>
                          {t.titulo}
                        </h4>
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          renderIcon={TrashCan}
                          iconDescription="Excluir"
                          onClick={(e) => handleDeleteTask(t.id, e)}
                        />
                      </div>

                      {t.descricao && (
                        <p style={{ fontSize: '0.85rem', color: '#6f6f6f', marginBottom: '0.5rem' }}>
                          {t.descricao}
                        </p>
                      )}

                      <div style={{ fontSize: '0.8rem', color: '#525252', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div>
                          <strong>Disc:</strong> {t.disciplina?.nome || 'Geral'}
                        </div>
                        {t.grupo && (
                          <div>
                            <strong>Grupo:</strong> {t.grupo.nome}
                          </div>
                        )}
                        {Array.isArray(t.responsaveis) && t.responsaveis.length > 0 && (
                          <div>
                            <strong>Resp:</strong> {t.responsaveis.join(', ')}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>
                          {prazoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div>
                          {isOverdue ? (
                            <span className="badge-overdue">Vencida</span>
                          ) : isUrgent ? (
                            <span className="badge-urgent">&lt; {antecedenciaHoras}h</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {colTasks.length === 0 && (
                  <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#a8a8a8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Solte cartões aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task Modal */}
      <Modal
        open={modalOpen}
        modalHeading={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        primaryButtonText="Salvar"
        secondaryButtonText="Cancelar"
        onRequestSubmit={handleSaveTask}
        onRequestClose={() => setModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <TextInput
            id="task-titulo"
            labelText="Título da Tarefa"
            placeholder="Ex: Entrega do Relatório Final"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

          <TextArea
            id="task-desc"
            labelText="Descrição (opcional)"
            placeholder="Detalhes ou requisitos do trabalho..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              id="task-disc"
              labelText="Disciplina (opcional)"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
            >
              <SelectItem value="" text="Sem disciplina (Geral)" />
              {disciplinas.map((d) => (
                <SelectItem key={d.id} value={d.id} text={d.nome} />
              ))}
            </Select>

            <Select
              id="task-grupo"
              labelText="Grupo (opcional - individual se vazio)"
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
            >
              <SelectItem value="" text="Individual (Sem grupo)" />
              {availableGrupos.map((g) => (
                <SelectItem key={g.id} value={g.id} text={g.nome} />
              ))}
            </Select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              id="task-status"
              labelText="Coluna Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {COLUMNS.map((c) => (
                <SelectItem key={c.id} value={c.id} text={c.label} />
              ))}
            </Select>

            <TextInput
              id="task-prazo"
              labelText="Data e Hora do Prazo"
              type="datetime-local"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              required
            />
          </div>

          <TextInput
            id="task-resp"
            labelText="Responsáveis (separados por vírgula)"
            placeholder="Ex: Eu, João, Maria"
            value={responsaveis}
            onChange={(e) => setResponsaveis(e.target.value)}
            helperText="Digite quem é responsável por esta entrega."
          />
        </div>
      </Modal>
    </div>
  )
}
