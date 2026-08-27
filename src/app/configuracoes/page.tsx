'use client'

import React, { useEffect, useState } from 'react'
import {
  Tile,
  TextInput,
  NumberInput,
  Button,
  InlineNotification,
  Loading,
} from '@carbon/react'
import { Save, Send } from '@carbon/icons-react'

export default function ConfiguracoesPage() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [antecedenciaHoras, setAntecedenciaHoras] = useState(48)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [notification, setNotification] = useState<{ kind: 'success' | 'error'; title: string; subtitle: string } | null>(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true)
        const res = await fetch('/api/v1/config/webhook')
        if (res.ok) {
          const data = await res.json()
          setWebhookUrl(data.discordWebhookUrl || '')
          setAntecedenciaHoras(data.antecedenciaHoras || 48)
        }
      } catch (err) {
        console.error('Error loading webhook config:', err)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setNotification(null)

    try {
      const res = await fetch('/api/v1/config/webhook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordWebhookUrl: webhookUrl || null,
          antecedenciaHoras: Number(antecedenciaHoras),
        }),
      })

      if (!res.ok) throw new Error('Erro ao salvar configurações')

      setNotification({
        kind: 'success',
        title: 'Sucesso!',
        subtitle: 'Configurações de notificação salvas com sucesso.',
      })
    } catch (err: unknown) {
      setNotification({
        kind: 'error',
        title: 'Erro:',
        subtitle: err instanceof Error ? err.message : 'Falha ao salvar',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      alert('Informe uma URL de webhook válida para testar.')
      return
    }

    setTesting(true)
    setNotification(null)

    try {
      const payload = {
        username: 'Gestão Acadêmica',
        embeds: [
          {
            title: '🔔 Teste de Notificação Discord',
            description: 'Seu webhook do Discord está configurado e funcionando corretamente!',
            color: 0x0f62fe,
            fields: [
              { name: 'Antecedência Configurada', value: `${antecedenciaHoras} horas`, inline: true },
              { name: 'Data do Teste', value: new Date().toLocaleString('pt-BR'), inline: true },
            ],
            footer: { text: 'Sistema de Gestão Acadêmica' },
          },
        ],
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Webhook respondeu com status ${res.status}`)

      setNotification({
        kind: 'success',
        title: 'Teste enviado!',
        subtitle: 'Confira seu canal do Discord para visualizar o alerta.',
      })
    } catch (err: unknown) {
      setNotification({
        kind: 'error',
        title: 'Falha no teste:',
        subtitle: err instanceof Error ? err.message : 'Não foi possível disparar o webhook.',
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <Loading description="Carregando configurações..." />

  return (
    <div style={{ padding: '1rem 0', maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Configurações do Sistema</h1>
        <p style={{ color: '#6f6f6f' }}>Gerencie o webhook do Discord e parâmetros do alerta automático de tarefas.</p>
      </div>

      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          subtitle={notification.subtitle}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      <Tile style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSave}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            Alertas no Discord
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <TextInput
              id="webhook-url"
              labelText="URL do Webhook do Discord"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              helperText="Cole aqui a URL criada nas integrações do seu servidor do Discord."
            />
          </div>

          <div style={{ marginBottom: '1.5rem', maxWidth: '300px' }}>
            <NumberInput
              id="antecedencia-horas"
              label="Antecedência do Alerta (horas)"
              min={1}
              max={168}
              value={antecedenciaHoras}
              onChange={(_, { value }) => setAntecedenciaHoras(Number(value) || 48)}
              helperText="Alertar tarefas cujo prazo expira dentro deste número de horas."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button type="submit" renderIcon={Save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button kind="secondary" type="button" renderIcon={Send} onClick={handleTestWebhook} disabled={testing || !webhookUrl}>
              {testing ? 'Enviando...' : 'Testar Webhook'}
            </Button>
          </div>
        </form>
      </Tile>
    </div>
  )
}
