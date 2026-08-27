import cron from 'node-cron'
import { checkAndSendNotifications } from './discord'

const globalForScheduler = global as unknown as { schedulerInitialized?: boolean }

export function initScheduler() {
  if (globalForScheduler.schedulerInitialized) {
    return
  }

  globalForScheduler.schedulerInitialized = true

  const cronExpression = process.env.CRON_SCHEDULE || '*/15 * * * *'

  cron.schedule(cronExpression, async () => {
    console.log('[Scheduler] Verificando notificações de prazo...')
    await checkAndSendNotifications()
  })

  console.log(`[Scheduler] Cron de notificações inicializado (${cronExpression}).`)
}
