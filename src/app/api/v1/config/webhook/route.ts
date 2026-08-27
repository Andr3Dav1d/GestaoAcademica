import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { configWebhook } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let config = await db.query.configWebhook.findFirst({ where: (table, { eq }) => eq(table.id, 'default') })

    if (!config) {
      await db.insert(configWebhook).values({ id: 'default', antecedenciaHoras: 48 })
      config = await db.query.configWebhook.findFirst({ where: (table, { eq }) => eq(table.id, 'default') })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching webhook config:', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração do webhook' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { discordWebhookUrl, antecedenciaHoras } = body

    const existing = await db.query.configWebhook.findFirst({ where: (table, { eq }) => eq(table.id, 'default') })

    if (!existing) {
      await db.insert(configWebhook).values({
        id: 'default',
        discordWebhookUrl: discordWebhookUrl || null,
        antecedenciaHoras: antecedenciaHoras ? Number(antecedenciaHoras) : 48,
      })
    } else {
      await db
        .update(configWebhook)
        .set({
          discordWebhookUrl: discordWebhookUrl !== undefined ? discordWebhookUrl : existing.discordWebhookUrl,
          antecedenciaHoras: antecedenciaHoras !== undefined ? Number(antecedenciaHoras) : existing.antecedenciaHoras,
          updatedAt: new Date(),
        })
        .where(eq(configWebhook.id, 'default'))
    }

    const updated = await db.query.configWebhook.findFirst({ where: (table, { eq }) => eq(table.id, 'default') })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating webhook config:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configuração do webhook' }, { status: 500 })
  }
}
