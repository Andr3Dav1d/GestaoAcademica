import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Pool } from 'pg'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    const sql = readFileSync(join(process.cwd(), 'drizzle', '0000_initial.sql'), 'utf8')
    await client.query(sql)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
