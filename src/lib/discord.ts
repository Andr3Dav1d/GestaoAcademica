import { and, eq, lte, ne } from 'drizzle-orm'
import { db } from './db'
import { tarefas } from './db/schema'

export async function checkAndSendNotifications() {
  try {
    const config = await db.query.configWebhook.findFirst({ where: (table, { eq }) => eq(table.id, 'default') })
    if (!config?.discordWebhookUrl) return

    const now = new Date()
    const thresholdDate = new Date(now.getTime() + (config.antecedenciaHoras || 48) * 60 * 60 * 1000)

    const tarefasElegiveis = await db.query.tarefas.findMany({
      where: and(lte(tarefas.prazo, thresholdDate), eq(tarefas.notificada, false), ne(tarefas.status, 'CONCLUIDO')),
      with: { disciplina: true, grupo: true },
    })

    const baseUrl = process.env.APP_URL || 'http://localhost:3000'

    for (const tarefa of tarefasElegiveis) {
      try {
        const prazoFormatted = new Date(tarefa.prazo).toLocaleString('pt-BR', {
          timeZone: 'America/Belem',
          dateStyle: 'short',
          timeStyle: 'short',
        })

        const fields = [
          { name: 'Prazo', value: prazoFormatted, inline: true },
          { name: 'Status', value: tarefa.status.replaceAll('_', ' '), inline: true },
        ]

        if (tarefa.disciplina) fields.push({ name: 'Disciplina', value: tarefa.disciplina.nome, inline: true })
        if (tarefa.grupo) fields.push({ name: 'Grupo', value: tarefa.grupo.nome, inline: true })
        if (tarefa.responsaveis.length) fields.push({ name: 'Responsáveis', value: tarefa.responsaveis.join(', '), inline: false })

        const isOverdue = new Date(tarefa.prazo) < now
        const payload = {
          username: 'Gestão Acadêmica',
          embeds: [
            {
              title: `${isOverdue ? '⚠️ TAREFA VENCIDA' : '⏰ ALERTA DE PRAZO'}: ${tarefa.titulo}`,
              description: tarefa.descricao || 'Sem descrição',
              url: `${baseUrl}/kanban`,
              color: isOverdue ? 0xff3333 : 0xffaa00,
              fields,
              footer: { text: 'Sistema de Gestão Acadêmica' },
              timestamp: new Date().toISOString(),
            },
          ],
        }

        const response = await fetch(config.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          console.error(`Discord webhook failed with HTTP ${response.status} for task ${tarefa.id}`)
          continue
        }

        await db.update(tarefas).set({ notificada: true, updatedAt: new Date() }).where(eq(tarefas.id, tarefa.id))
      } catch (error) {
        console.error(`Error sending notification for task ${tarefa.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendNotifications:', error)
  }
}
