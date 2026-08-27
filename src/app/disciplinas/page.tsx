'use client'

import React, { useEffect, useState } from 'react'
import {
  Button,
  Tile,
  Modal,
  TextInput,
  TextArea,
  InlineNotification,
  Loading,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
} from '@carbon/react'
import { Add, Launch, Edit, TrashCan, Download } from '@carbon/icons-react'

interface Grupo {
  id: string
  nome: string
  tema?: string
  participantes: string[]
}

interface Disciplina {
  id: string
  nome: string
  periodo: string
  sharepointSiteId?: string
  createdAt: string
  updatedAt: string
  grupos: Grupo[]
  horariosFixos: unknown[]
  _count: { tarefas: number }
}

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDiscIndex, setSelectedDiscIndex] = useState(0)

  // Disciplina Modal
  const [discModalOpen, setDiscModalOpen] = useState(false)
  const [editingDisc, setEditingDisc] = useState<Disciplina | null>(null)
  const [discNome, setDiscNome] = useState('')
  const [discPeriodo, setDiscPeriodo] = useState('2026.2')
  const [discSiteId, setDiscSiteId] = useState('')

  // Grupo Modal
  const [grupoModalOpen, setGrupoModalOpen] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
  const [grupoNome, setGrupoNome] = useState('')
  const [grupoTema, setGrupoTema] = useState('')
  const [grupoParticipantes, setGrupoParticipantes] = useState('')

  const loadDisciplinas = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/disciplinas', { credentials: 'include' })
      if (!res.ok) {
        let message = 'Erro ao buscar disciplinas'
        try {
          const errBody = await res.json()
          if (typeof errBody?.error === 'string') message = errBody.error
        } catch {}
        throw new Error(message)
      }
      const data = await res.json()
      if (!Array.isArray(data)) {
        throw new Error('Resposta inesperada da API de disciplinas')
      }
      setDisciplinas(data)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Erro ao carregar disciplinas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisciplinas()
  }, [])

  // Garante que o índice selecionado seja sempre válido quando a lista muda
  useEffect(() => {
    if (disciplinas.length === 0) {
      if (selectedDiscIndex !== 0) setSelectedDiscIndex(0)
      return
    }
    if (selectedDiscIndex > disciplinas.length - 1) {
      setSelectedDiscIndex(disciplinas.length - 1)
    }
  }, [disciplinas, selectedDiscIndex])

  const currentDisc = disciplinas[selectedDiscIndex]

  // Disciplina handlers
  const handleOpenNewDisc = () => {
    setEditingDisc(null)
    setDiscNome('')
    setDiscPeriodo('2026.2')
    setDiscSiteId('')
    setDiscModalOpen(true)
  }

  const handleOpenEditDisc = (disc: Disciplina) => {
    setEditingDisc(disc)
    setDiscNome(disc.nome)
    setDiscPeriodo(disc.periodo)
    setDiscSiteId(disc.sharepointSiteId || '')
    setDiscModalOpen(true)
  }

  const handleSaveDisc = async () => {
    if (!discNome || !discPeriodo) {
      alert('Nome e período são obrigatórios')
      return
    }

    try {
      const url = editingDisc ? `/api/v1/disciplinas/${editingDisc.id}` : '/api/v1/disciplinas'
      const method = editingDisc ? 'PATCH' : 'POST'
      const isNew = !editingDisc
      const countBefore = disciplinas.length

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: discNome,
          periodo: discPeriodo,
          sharepointSiteId: discSiteId || null,
        }),
      })

      if (!res.ok) throw new Error('Erro ao salvar disciplina')

      setDiscModalOpen(false)
      await loadDisciplinas()
      if (isNew) setSelectedDiscIndex(countBefore)
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleDeleteDisc = async (id: string) => {
    if (!confirm('Deseja realmente remover esta disciplina? Todos os grupos serão apagados.')) return
    try {
      const res = await fetch(`/api/v1/disciplinas/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao remover disciplina')
      if (selectedDiscIndex >= disciplinas.length - 1) setSelectedDiscIndex(Math.max(0, disciplinas.length - 2))
      loadDisciplinas()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  // Grupo handlers
  const handleOpenNewGrupo = () => {
    setEditingGrupo(null)
    setGrupoNome('')
    setGrupoTema('')
    setGrupoParticipantes('')
    setGrupoModalOpen(true)
  }

  const handleOpenEditGrupo = (g: Grupo) => {
    setEditingGrupo(g)
    setGrupoNome(g.nome)
    setGrupoTema(g.tema || '')
    setGrupoParticipantes(Array.isArray(g.participantes) ? g.participantes.join('\n') : '')
    setGrupoModalOpen(true)
  }

  const handleSaveGrupo = async () => {
    if (!currentDisc) return
    if (!grupoNome) {
      alert('Nome do grupo é obrigatório')
      return
    }

    const participantesList = grupoParticipantes
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)

    try {
      const url = editingGrupo ? `/api/v1/grupos/${editingGrupo.id}` : '/api/v1/grupos'
      const method = editingGrupo ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: grupoNome,
          disciplinaId: currentDisc.id,
          tema: grupoTema || null,
          participantes: participantesList,
        }),
      })

      if (!res.ok) throw new Error('Erro ao salvar grupo')

      setGrupoModalOpen(false)
      loadDisciplinas()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  const handleDeleteGrupo = async (id: string) => {
    if (!confirm('Deseja remover este grupo?')) return
    try {
      const res = await fetch(`/api/v1/grupos/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao remover grupo')
      loadDisciplinas()
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!currentDisc || !currentDisc.grupos || currentDisc.grupos.length === 0) {
      alert('Nenhum grupo cadastrado para exportar')
      return
    }

    let csvContent = 'data:text/csv;charset=utf-8,Grupo,Tema,Qtd Participantes,Participantes\n'
    currentDisc.grupos.forEach((g) => {
      const parts = Array.isArray(g.participantes) ? g.participantes.join('; ') : ''
      const count = Array.isArray(g.participantes) ? g.participantes.length : 0
      csvContent += `"${g.nome}","${g.tema || ''}",${count},"${parts}"\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Grupos_${currentDisc.nome.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <Loading description="Carregando disciplinas..." />

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Disciplinas &amp; Grupos</h1>
          <p style={{ color: '#6f6f6f' }}>Gerencie os materiais da aula e a relação de grupos de trabalho por disciplina.</p>
        </div>
        <Button renderIcon={Add} onClick={handleOpenNewDisc}>
          Nova Disciplina
        </Button>
      </div>

      {error && <InlineNotification kind="error" title="Erro:" subtitle={error} style={{ marginBottom: '1.5rem' }} />}

      {disciplinas.length === 0 ? (
        <Tile style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>Nenhuma disciplina cadastrada.</p>
          <Button renderIcon={Add} onClick={handleOpenNewDisc}>
            Cadastrar Primeira Disciplina
          </Button>
        </Tile>
      ) : (
        <>
          {/* Tab bar customizada — substitui Carbon Tabs que crashava silenciosamente em produção */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #e0e0e0' }}>
            {disciplinas.map((disc, index) => (
              <button
                key={disc.id}
                onClick={() => setSelectedDiscIndex(index)}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  borderBottom: selectedDiscIndex === index ? '2px solid #0f62fe' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  color: selectedDiscIndex === index ? '#0f62fe' : 'inherit',
                  fontWeight: selectedDiscIndex === index ? 600 : 400,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.1s, color 0.1s',
                }}
              >
                {disc.nome}
              </button>
            ))}
          </div>

          {/* Conteúdo da disciplina selecionada */}
          {currentDisc && (() => {
            const disc = currentDisc
            const discSharePointUrl = disc.sharepointSiteId
              ? `https://sempreuninassau.sharepoint.com/sites/${disc.sharepointSiteId}`
              : null
            return (
              <div style={{ paddingTop: '1.5rem' }}>
                {/* Cabeçalho da disciplina */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{disc.nome}</h2>
                    <p style={{ color: '#6f6f6f' }}>Período: {disc.periodo}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button kind="tertiary" size="sm" renderIcon={Edit} onClick={() => handleOpenEditDisc(disc)}>
                      Editar Disciplina
                    </Button>
                    <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} onClick={() => handleDeleteDisc(disc.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>

                {/* Material SharePoint */}
                <Tile style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Material de Aula (SharePoint)</h3>
                    {discSharePointUrl && (
                      <a href={discSharePointUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Button kind="secondary" size="sm" renderIcon={Launch}>
                          Abrir no SharePoint
                        </Button>
                      </a>
                    )}
                  </div>
                  {!discSharePointUrl ? (
                    <InlineNotification
                      kind="info"
                      title="Nenhum SharePoint configurado"
                      subtitle="Edite a disciplina para informar o siteId do SharePoint/Teams."
                    />
                  ) : (
                    <div style={{ background: '#f4f4f4', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', color: '#525252', fontSize: '0.85rem' }}>
                      ℹ️ <strong>Aviso:</strong> O SharePoint não permite incorporação via iframe. Use o botão <strong>&quot;Abrir no SharePoint&quot;</strong> acima para acessar o material.
                    </div>
                  )}
                </Tile>

                {/* Grupos de Trabalho */}
                <Tile style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      Grupos de Trabalho ({disc.grupos?.length || 0})
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button kind="secondary" size="sm" renderIcon={Download} onClick={handleExportCSV}>
                        Exportar CSV
                      </Button>
                      <Button kind="primary" size="sm" renderIcon={Add} onClick={handleOpenNewGrupo}>
                        Novo Grupo
                      </Button>
                    </div>
                  </div>

                  {!disc.grupos || disc.grupos.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#6f6f6f', padding: '1rem 0' }}>
                      Nenhum grupo cadastrado nesta disciplina.
                    </p>
                  ) : (
                    <DataTable
                      rows={disc.grupos.map((g) => ({
                        id: g.id,
                        nome: g.nome,
                        tema: g.tema || 'Sem tema definido',
                        qtd: Array.isArray(g.participantes) ? g.participantes.length : 0,
                        participantes: Array.isArray(g.participantes) ? g.participantes.join(', ') : '',
                      }))}
                      headers={[
                        { key: 'nome', header: 'Nome do Grupo' },
                        { key: 'tema', header: 'Tema/Projeto' },
                        { key: 'qtd', header: 'Qtd' },
                        { key: 'participantes', header: 'Participantes' },
                        { key: 'actions', header: 'Ações' },
                      ]}
                    >
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
                            {rows.map((row) => {
                              const grupoObj = disc.grupos?.find((g) => g.id === row.id)
                              const { key, ...rowProps } = getRowProps({ row })
                              return (
                                <TableRow key={key || row.id} {...rowProps}>
                                  <TableCell style={{ fontWeight: 600 }}>{row.cells[0].value}</TableCell>
                                  <TableCell>{row.cells[1].value}</TableCell>
                                  <TableCell>
                                    <Tag type="blue">{row.cells[2].value}</Tag>
                                  </TableCell>
                                  <TableCell style={{ maxWidth: '300px' }}>{row.cells[3].value}</TableCell>
                                  <TableCell>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      {grupoObj && (
                                        <Button
                                          kind="ghost"
                                          size="sm"
                                          hasIconOnly
                                          renderIcon={Edit}
                                          iconDescription="Editar"
                                          onClick={() => handleOpenEditGrupo(grupoObj)}
                                        />
                                      )}
                                      <Button
                                        kind="ghost"
                                        size="sm"
                                        hasIconOnly
                                        renderIcon={TrashCan}
                                        iconDescription="Excluir"
                                        onClick={() => handleDeleteGrupo(row.id)}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </DataTable>
                  )}
                </Tile>
              </div>
            )
          })()}
        </>
      )}

      {/* Modal Disciplina */}
      <Modal
        open={discModalOpen}
        modalHeading={editingDisc ? 'Editar Disciplina' : 'Nova Disciplina'}
        primaryButtonText="Salvar"
        secondaryButtonText="Cancelar"
        onRequestSubmit={handleSaveDisc}
        onRequestClose={() => setDiscModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <TextInput
            id="disc-nome"
            labelText="Nome da Disciplina"
            placeholder="Ex: Machine Learning"
            value={discNome}
            onChange={(e) => setDiscNome(e.target.value)}
            required
          />
          <TextInput
            id="disc-periodo"
            labelText="Período / Semestre"
            placeholder="2026.2"
            value={discPeriodo}
            onChange={(e) => setDiscPeriodo(e.target.value)}
            required
          />
          <TextInput
            id="disc-siteid"
            labelText="SharePoint Site ID (opcional)"
            placeholder="Ex: team_4.6.2022010"
            value={discSiteId}
            onChange={(e) => setDiscSiteId(e.target.value)}
            helperText="Formato do ID do site no Teams/SharePoint"
          />
        </div>
      </Modal>

      {/* Modal Grupo */}
      <Modal
        open={grupoModalOpen}
        modalHeading={editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}
        primaryButtonText="Salvar"
        secondaryButtonText="Cancelar"
        onRequestSubmit={handleSaveGrupo}
        onRequestClose={() => setGrupoModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <TextInput
            id="grupo-nome"
            labelText="Nome do Grupo"
            placeholder="Ex: Grupo Alpha"
            value={grupoNome}
            onChange={(e) => setGrupoNome(e.target.value)}
            required
          />
          <TextInput
            id="grupo-tema"
            labelText="Tema / Projeto"
            placeholder="Ex: Sistema de Recomendação em E-commerce"
            value={grupoTema}
            onChange={(e) => setGrupoTema(e.target.value)}
          />
          <TextArea
            id="grupo-participantes"
            labelText="Participantes (um por linha)"
            placeholder={'João Silva\nMaria Santos\nCarlos Oliveira'}
            value={grupoParticipantes}
            onChange={(e) => setGrupoParticipantes(e.target.value)}
            helperText="Cole ou digite a lista de nomes dividida por linhas."
            rows={5}
          />
        </div>
      </Modal>
    </div>
  )
}
