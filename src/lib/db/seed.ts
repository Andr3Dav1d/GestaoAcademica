import 'dotenv/config'
import { db } from './index'
import { configWebhook, disciplinas } from './schema'
import { cuidLike } from './utils'

const initialDisciplinas = [
  { nome: 'APIEx', periodo: '2026.2', sharepointSiteId: 'team_4.6.2022015' },
  { nome: 'Arq. De Software e Comp. Em Nuvem', periodo: '2026.2', sharepointSiteId: 'team_4.6.2022013' },
  { nome: 'Eng. de Requisitos, Teste e Qualidade de Software', periodo: '2026.2', sharepointSiteId: 'team_4.6.2022012' },
  { nome: 'Lab. de Empreendimentos Inovadores', periodo: '2026.2', sharepointSiteId: 'team_4.6.2022014' },
  { nome: 'Machine Learning', periodo: '2026.2', sharepointSiteId: 'team_4.6.2022010' },
  { nome: 'Tópicos Integradores (ADS)', periodo: '2026.2', sharepointSiteId: 'team_4.6.2022011' },
]

async function main() {
  for (const disc of initialDisciplinas) {
    const existing = await db.query.disciplinas.findFirst({ where: (table, { eq }) => eq(table.nome, disc.nome) })
    if (!existing) {
      await db.insert(disciplinas).values({ id: cuidLike(), ...disc })
    }
  }

  const existingConfig = await db.query.configWebhook.findFirst({ where: (table, { eq }) => eq(table.id, 'default') })
  if (!existingConfig) {
    await db.insert(configWebhook).values({
      id: 'default',
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || null,
      antecedenciaHoras: 48,
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
